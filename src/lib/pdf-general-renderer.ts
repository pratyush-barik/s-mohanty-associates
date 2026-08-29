/**
 * PDFGeneralRenderer — Custom pdf-lib renderer for S Mohanty & Associates general valuation reports.
 * Uses A4 Portrait size.
 */

import { PDFDocument, PDFPage, PDFFont, PDFImage, PDFEmbeddedPage, StandardFonts, rgb } from 'pdf-lib';

// ─── Color helpers ──────────────────────────────────────────────────
export function hexToRgb(hex: string) {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16) / 255;
  const g = parseInt(h.substring(2, 4), 16) / 255;
  const b = parseInt(h.substring(4, 6), 16) / 255;
  return rgb(r, g, b);
}

// ─── Constants ──────────────────────────────────────────────────────
export const PAGE_W = 595.28;   // A4 width in points
export const PAGE_H = 841.89;   // A4 height in points
export const MARGIN_T = 108;  // Top margin — must clear the letterhead header (logo + tagline row).
export const MARGIN_B = 80;   // Bottom margin (matches letterhead footer)
export const MARGIN_L = 54;   // Left margin
export const MARGIN_R = 54;   // Right margin
export const CONTENT_W = PAGE_W - MARGIN_L - MARGIN_R; // Usable width: 487.28pt

// 3-column widths (28% / 35% / 37%)
export const COL_W = [
  Math.round(CONTENT_W * 0.28), // label column
  Math.round(CONTENT_W * 0.35), // options column
  CONTENT_W - Math.round(CONTENT_W * 0.28) - Math.round(CONTENT_W * 0.35), // value column
];

// Styling
export const CELL_PAD_X = 4;
export const CELL_PAD_Y = 3;
export const FONT_SIZE = 12;
export const FONT_SIZE_HEADER = 14;
export const FONT_SIZE_TITLE = 14;
export const FONT_SIZE_SMALL = 12;
export const FONT_SIZE_CAPTION = 10;
export const LINE_HEIGHT = 1.25; // multiplier on font size
export const BORDER_W = 0.5;
export const LBL_BG = '#DBE6F0';
export const OPT_BG = '#DDE9F6';
export const VAL_BG = '#FEF9E7';
export const BG_OPACITY = 0.5;

export interface TextSegment {
  text: string;
  bold?: boolean;
  italic?: boolean;
}

export interface DrawTextOptions {
  bold?: boolean;
  italic?: boolean;
  fontSize?: number;
  align?: 'left' | 'center' | 'right';
  maxWidth?: number;
}

export class PDFGeneralRenderer {
  protected doc!: PDFDocument;
  protected page!: PDFPage;
  protected fontRegular!: PDFFont;
  protected fontBold!: PDFFont;
  protected fontItalic!: PDFFont;
  protected fontBoldItalic!: PDFFont;
  // Form XObject (embedded PDF page) for the letterhead background.
  protected letterheadForm: PDFEmbeddedPage | null = null;
  protected cursorY = 0; // distance from top of content area (top-down)
  protected initialized = false;

  /**
   * Initialize the renderer. Must be called before any drawing.
   */
  async init(letterheadBytes?: Uint8Array): Promise<void> {
    this.doc = await PDFDocument.create();
    this.fontRegular = await this.doc.embedFont(StandardFonts.TimesRoman);
    this.fontBold = await this.doc.embedFont(StandardFonts.TimesRomanBold);
    this.fontItalic = await this.doc.embedFont(StandardFonts.TimesRomanItalic);
    this.fontBoldItalic = await this.doc.embedFont(StandardFonts.TimesRomanBoldItalic);

    if (letterheadBytes && letterheadBytes.length > 0) {
      try {
        const tmpDoc = await PDFDocument.create();
        let tmpImg = null;
        try { tmpImg = await tmpDoc.embedPng(letterheadBytes); } catch { /* try jpg */ }
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
    this.initialized = true;
  }

  // ─── Page Management ────────────────────────────────────────────

  protected addPage(): void {
    this.page = this.doc.addPage([PAGE_W, PAGE_H]);
    this.cursorY = 0;

    // Draw letterhead as a Form XObject so PDF-to-Word converters treat it
    // as a background/template layer, not an inline content image.
    if (this.letterheadForm) {
      this.page.drawPage(this.letterheadForm, {
        x: 0, y: 0, width: PAGE_W, height: PAGE_H,
      });
    }
  }

  /** Available height remaining on current page */
  protected get availableHeight(): number {
    return PAGE_H - MARGIN_T - MARGIN_B - this.cursorY;
  }

  /** Convert top-down cursorY to pdf-lib bottom-up Y */
  protected pdfY(topDown: number): number {
    return PAGE_H - MARGIN_T - topDown;
  }

  /** Check if neededHeight fits; if not, add a new page. */
  checkPageBreak(neededHeight: number): void {
    if (this.availableHeight < neededHeight) {
      this.addPage();
    }
  }

  /** Force a page break */
  newPage(): void {
    this.addPage();
  }

  /** Add vertical spacing */
  advanceCursor(pts: number): void {
    this.cursorY += pts;
  }

  // ─── Font Selection ─────────────────────────────────────────────

  protected getFont(bold?: boolean, italic?: boolean): PDFFont {
    if (bold && italic) return this.fontBoldItalic;
    if (bold) return this.fontBold;
    if (italic) return this.fontItalic;
    return this.fontRegular;
  }

  /** Strip/replace characters that WinAnsi (Helvetica/Times) cannot encode */
  protected sanitizeText(text: string): string {
    let clean = String(text ?? '');
    
    // Decode HTML entities
    clean = clean
      .replace(/&amp;/g, '&')
      .replace(/&amp/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&lt/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&gt/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&quot/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&#39;/g, "'");

    return clean
      .replace(/[\r\n\t]/g, ' ')          // newlines/tabs -> space
      .replace(/[\u2018\u2019]/g, "'")     // smart single quotes
      .replace(/[\u201C\u201D]/g, '"')     // smart double quotes
      .replace(/\u2013/g, '-')             // en-dash
      .replace(/\u2014/g, '--')            // em-dash
      .replace(/\u2026/g, '...')           // ellipsis
      .replace(/\u20B9/g, 'Rs.')           // rupee sign
      .replace(/[^\x20-\x7E\u2022]/g, '');       // allow ASCII + bullet •
  }

  // ─── Text Measurement ──────────────────────────────────────────

  /** Measure the width of a string at a given font size */
  private textWidth(text: string, fontSize: number, bold?: boolean, italic?: boolean): number {
    const font = this.getFont(bold, italic);
    return font.widthOfTextAtSize(this.sanitizeText(text), fontSize);
  }

  /** Break text into lines that fit within maxWidth */
  private wrapText(text: string, maxWidth: number, fontSize: number, bold?: boolean, italic?: boolean): string[] {
    const strText = this.sanitizeText(text);
    if (!strText) return [''];
    const font = this.getFont(bold, italic);
    const words = strText.split(/\s+/);
    const lines: string[] = [];
    let currentLine = '';

    for (let word of words) {
      if (!word) continue;

      // Force break long words to prevent horizontal spillage across cell boundaries
      if (font.widthOfTextAtSize(word, fontSize) > maxWidth) {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = '';
        }
        while (font.widthOfTextAtSize(word, fontSize) > maxWidth && word.length > 1) {
          let fitLen = 1;
          while (fitLen < word.length && font.widthOfTextAtSize(word.substring(0, fitLen + 1), fontSize) <= maxWidth) {
            fitLen++;
          }
          lines.push(word.substring(0, fitLen));
          word = word.substring(fitLen);
        }
      }

      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const w = font.widthOfTextAtSize(testLine, fontSize);
      if (w > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);
    if (lines.length === 0) lines.push('');
    return lines;
  }

  /** Measure how tall wrapped text will be */
  measureTextHeight(text: string, maxWidth: number, fontSize: number, bold?: boolean): number {
    const lines = this.wrapText(text, maxWidth, fontSize, bold);
    return lines.length * fontSize * LINE_HEIGHT;
  }

  /** Measure height for a RichText (mixed bold/regular segments) */
  private measureRichTextHeight(segments: TextSegment[], maxWidth: number, fontSize: number): number {
    const wordList: { word: string; bold?: boolean; italic?: boolean }[] = [];
    for (const seg of segments) {
      const words = this.sanitizeText(seg.text).split(/(\s+)/);
      for (const w of words) {
        if (w) wordList.push({ word: w, bold: seg.bold, italic: seg.italic });
      }
    }
    const lines: { word: string; bold?: boolean; italic?: boolean }[][] = [];
    let currentLine: typeof wordList = [];
    let currentWidth = 0;
    for (const item of wordList) {
      const font = this.getFont(item.bold, item.italic);
      const safeWord = this.sanitizeText(item.word);
      const ww = font.widthOfTextAtSize(safeWord, fontSize);
      if (currentWidth + ww > maxWidth && currentLine.length > 0 && !/^\s+$/.test(safeWord)) {
        lines.push(currentLine);
        currentLine = [];
        currentWidth = 0;
      }
      currentLine.push(item);
      currentWidth += ww;
    }
    if (currentLine.length > 0) lines.push(currentLine);
    if (lines.length === 0) lines.push([]);
    return lines.length * fontSize * LINE_HEIGHT;
  }

  // ─── Drawing Primitives ────────────────────────────────────────

  /** Draw a filled rectangle */
  protected drawRect(x: number, topY: number, w: number, h: number, fillColor?: string, borderColor?: string, borderWidth?: number, opacity?: number): void {
    const pY = this.pdfY(topY) - h;
    if (fillColor) {
      this.page.drawRectangle({ x, y: pY, width: w, height: h, color: hexToRgb(fillColor), opacity: opacity ?? 1 });
    }
    if (borderColor) {
      this.page.drawRectangle({
        x, y: pY, width: w, height: h,
        borderColor: hexToRgb(borderColor),
        borderWidth: borderWidth || BORDER_W,
      });
    }
  }

  /** Draw a horizontal line */
  protected drawHLine(x1: number, x2: number, topY: number, color?: string, width?: number): void {
    const pY = this.pdfY(topY);
    this.page.drawLine({
      start: { x: x1, y: pY },
      end: { x: x2, y: pY },
      thickness: width || 0.5,
      color: color ? hexToRgb(color) : rgb(0, 0, 0),
    });
  }

  /** Draw a single line of text at absolute coordinates */
  protected drawTextAt(text: string, x: number, topY: number, opts?: DrawTextOptions & { textColor?: string }): void {
    const strText = this.sanitizeText(text);
    const fontSize = opts?.fontSize || FONT_SIZE;
    const font = this.getFont(opts?.bold, opts?.italic);
    // Baseline is roughly 0.8 * fontSize below the top of the text
    const baselineOffset = fontSize * 0.8;
    const pY = this.pdfY(topY) - baselineOffset;

    let drawX = x;
    if (opts?.align === 'center' && opts.maxWidth) {
      const tw = font.widthOfTextAtSize(strText, fontSize);
      drawX = x + (opts.maxWidth - tw) / 2;
    } else if (opts?.align === 'right' && opts.maxWidth) {
      const tw = font.widthOfTextAtSize(strText, fontSize);
      drawX = x + opts.maxWidth - tw;
    }

    this.page.drawText(strText, {
      x: drawX,
      y: pY,
      size: fontSize,
      font,
      color: opts?.textColor ? hexToRgb(opts.textColor) : rgb(0, 0, 0),
    });
  }

  /** Draw wrapped text at absolute coordinates, returns total height consumed */
  protected drawWrappedTextAt(text: string, x: number, topY: number, maxWidth: number, opts?: DrawTextOptions): number {
    const fontSize = opts?.fontSize || FONT_SIZE;
    const lineH = fontSize * LINE_HEIGHT;
    const lines = this.wrapText(String(text || ''), maxWidth, fontSize, opts?.bold, opts?.italic);

    for (let i = 0; i < lines.length; i++) {
      this.drawTextAt(lines[i], x, topY + i * lineH, { ...opts, maxWidth });
    }
    return lines.length * lineH;
  }

  /** Draw rich text segments (mixed bold/regular) on a single conceptual line, with wrapping */
  protected drawRichTextAt(segments: TextSegment[], x: number, topY: number, maxWidth: number, fontSize: number): number {
    const lineH = fontSize * LINE_HEIGHT;

    // Build a flat list of {word, bold, italic}
    const wordList: { word: string; bold?: boolean; italic?: boolean }[] = [];
    for (const seg of segments) {
      const words = this.sanitizeText(seg.text).split(/(\s+)/); // preserve whitespace
      for (const w of words) {
        if (w) wordList.push({ word: w, bold: seg.bold, italic: seg.italic });
      }
    }

    // Wrap into lines
    const lines: { word: string; bold?: boolean; italic?: boolean }[][] = [];
    let currentLine: typeof wordList = [];
    let currentWidth = 0;

    for (const item of wordList) {
      const font = this.getFont(item.bold, item.italic);
      const safeWord = this.sanitizeText(item.word);
      const ww = font.widthOfTextAtSize(safeWord, fontSize);
      if (currentWidth + ww > maxWidth && currentLine.length > 0 && !/^\s+$/.test(safeWord)) {
        lines.push(currentLine);
        currentLine = [];
        currentWidth = 0;
      }
      currentLine.push(item);
      currentWidth += ww;
    }
    if (currentLine.length > 0) lines.push(currentLine);
    if (lines.length === 0) lines.push([]);

    // Draw each line
    for (let li = 0; li < lines.length; li++) {
      let cx = x;
      const baselineOffset = fontSize * 0.8;
      const pY = this.pdfY(topY + li * lineH) - baselineOffset;

      for (const item of lines[li]) {
        const font = this.getFont(item.bold, item.italic);
        const safeWord = this.sanitizeText(item.word);
        this.page.drawText(safeWord, {
          x: cx, y: pY, size: fontSize, font, color: rgb(0, 0, 0),
        });
        cx += font.widthOfTextAtSize(safeWord, fontSize);
      }
    }

    return lines.length * lineH;
  }

  // ─── Cell Primitive ────────────────────────────────────────────

  /**
   * Draw a bordered table cell with wrapped text.
   * Returns the height of the cell.
   */
  drawCell(
    x: number, topY: number, w: number, h: number,
    text: string,
    opts?: {
      bold?: boolean; italic?: boolean; fontSize?: number;
      align?: 'left' | 'center' | 'right';
      fillColor?: string; bgOpacity?: number; borderColor?: string;
      textColor?: string;
      vAlign?: 'top' | 'middle';
    }
  ): void {
    const fontSize = opts?.fontSize || FONT_SIZE;

    // Fill
    if (opts?.fillColor) {
      this.drawRect(x, topY, w, h, opts.fillColor, undefined, undefined, opts.bgOpacity);
    }

    // Border
    this.drawRect(x, topY, w, h, undefined, opts?.borderColor || '#000000', BORDER_W);

    // Text
    const textW = w - CELL_PAD_X * 2;
    const lines = this.wrapText(text, textW, fontSize, opts?.bold, opts?.italic);
    const textH = lines.length * fontSize * LINE_HEIGHT;

    let textTopY = topY + CELL_PAD_Y;
    if (opts?.vAlign === 'middle') {
      textTopY = topY + (h - textH) / 2;
      if (textTopY < topY + CELL_PAD_Y) textTopY = topY + CELL_PAD_Y;
    }

    for (let i = 0; i < lines.length; i++) {
      this.drawTextAt(lines[i], x + CELL_PAD_X, textTopY + i * fontSize * LINE_HEIGHT, {
        bold: opts?.bold, italic: opts?.italic, fontSize, align: opts?.align, maxWidth: textW, textColor: opts?.textColor
      });
    }
  }

  /** Calculate the height a cell would need for the given text */
  cellHeight(text: string, w: number, opts?: { bold?: boolean; fontSize?: number }): number {
    const fontSize = opts?.fontSize || FONT_SIZE;
    const textW = w - CELL_PAD_X * 2;
    const lines = this.wrapText(text, textW, fontSize, opts?.bold);
    return Math.max(lines.length * fontSize * LINE_HEIGHT + CELL_PAD_Y * 2, fontSize * LINE_HEIGHT + CELL_PAD_Y * 2);
  }

  // ─── Table Row Primitives ──────────────────────────────────────

  /**
   * Draw a section header: full-width bold cell with background.
   * Advances cursor.
   */
  drawSectionHeader(title: string): void {
    const h = this.cellHeight(title, CONTENT_W, { bold: true, fontSize: FONT_SIZE_HEADER });
    // Require an extra 150pt of space to prevent orphaned headings or single rows
    this.checkPageBreak(h + 150);
    this.drawCell(MARGIN_L, this.cursorY, CONTENT_W, h, title, {
      bold: true, fontSize: FONT_SIZE_HEADER, fillColor: LBL_BG,
    });
    this.cursorY += h;
  }

  /**
   * Draw a two-column row: label on left (with background), bold value on right.
   * Advances cursor.
   */
  drawSimpleRow(label: string, value: string): void {
    const labelW = Math.round(CONTENT_W * 0.40);  // 40% for label
    const valueW = CONTENT_W - labelW;             // 60% for value

    // Measure both sides to get max height
    const labelH = this.cellHeight(label, labelW, { bold: false });
    const valueH = this.cellHeight(value || 'N/A', valueW, { bold: true });
    const h = Math.max(labelH, valueH);

    this.checkPageBreak(h);

    // Left cell: label with background
    this.drawCell(MARGIN_L, this.cursorY, labelW, h, label, {
      fillColor: LBL_BG, bgOpacity: 0.5, bold: false, vAlign: 'middle',
    });

    // Right cell: bold value on white
    this.drawCell(MARGIN_L + labelW, this.cursorY, valueW, h, value || 'N/A', {
      bold: true, vAlign: 'middle',
    });

    this.cursorY += h;
  }

  /**
   * Draw a 3-column option row:
   *   Col 1: Bold label with LBL_BG
   *   Col 2: Stacked option sub-cells with OPT_BG (selected one bolded)
   *   Col 3: Selected value, centered, bold, OPT_BG
   *   Text wraps within cells to prevent overflow.
   * Advances cursor.
   */
  drawOptionRow(label: string, options: string[], selectedValue: string): void {
    const col1X = MARGIN_L;
    const col2X = MARGIN_L + COL_W[0];
    const col3X = MARGIN_L + COL_W[0] + COL_W[1];

    const optionTextW = COL_W[1] - CELL_PAD_X * 2;
    const labelH = this.cellHeight(label, COL_W[0], { bold: true, fontSize: FONT_SIZE });
    const optionLineH = FONT_SIZE * LINE_HEIGHT + CELL_PAD_Y * 2;

    // Calculate actual heights per option (with per-item padding)
    let totalOptionsH = 0;
    const optionHeights: number[] = [];
    for (const opt of options) {
      const lines = this.wrapText(opt, optionTextW, FONT_SIZE);
      const h = Math.max(lines.length * FONT_SIZE * LINE_HEIGHT + CELL_PAD_Y * 2, optionLineH);
      optionHeights.push(h);
      totalOptionsH += h;
    }

    const valueH = this.cellHeight(selectedValue || 'N/A', COL_W[2], { bold: true, fontSize: FONT_SIZE });
    const rowH = Math.max(labelH, totalOptionsH, valueH);

    this.checkPageBreak(rowH);

    // Col 1: Label
    this.drawCell(col1X, this.cursorY, COL_W[0], rowH, label, {
      bold: true, fontSize: FONT_SIZE, fillColor: LBL_BG, bgOpacity: 0.5, vAlign: 'middle',
    });

    // Col 2: Stacked options with internal dividers (wrapped text)
    this.drawRect(col2X, this.cursorY, COL_W[1], rowH, OPT_BG, '#000000', BORDER_W, 0.5);
    let optY = this.cursorY + CELL_PAD_Y;
    for (let i = 0; i < options.length; i++) {
      const optLines = this.wrapText(options[i], optionTextW, FONT_SIZE);
      const isBold = options[i] === selectedValue;
      const textH = optLines.length * FONT_SIZE * LINE_HEIGHT;
      const textY = optY + (optionHeights[i] - textH) / 2;
      for (let j = 0; j < optLines.length; j++) {
        this.drawTextAt(optLines[j], col2X + CELL_PAD_X, textY + j * FONT_SIZE * LINE_HEIGHT, {
          bold: isBold, fontSize: FONT_SIZE,
        });
      }
      optY += optionHeights[i];
      if (i < options.length - 1) {
        this.drawHLine(col2X, col2X + COL_W[1], optY, '#000000', 0.5);
      }
    }

    // Col 3: Selected value (with wrapping)
    this.drawCell(col3X, this.cursorY, COL_W[2], rowH, selectedValue || 'N/A', {
      bold: true, fontSize: FONT_SIZE, fillColor: OPT_BG, bgOpacity: 0.5, align: 'center', vAlign: 'middle',
    });

    this.cursorY += rowH;
  }

  /**
   * Draw a 3-column proximity/landmark row:
   *   Col 1: Bold label with LBL_BG
   *   Col 2: Stacked sub-labels (text wraps)
   *   Col 3: Stacked values with OPT_BG (text wraps)
   * Advances cursor.
   */
  drawProximityRow(label: string, subLabels: string[], values: string[]): void {
    const col1X = MARGIN_L;
    const col2X = MARGIN_L + COL_W[0];
    const col3X = MARGIN_L + COL_W[0] + COL_W[1];

    const subTextW = COL_W[1] - CELL_PAD_X * 2;
    const valTextW = COL_W[2] - CELL_PAD_X * 2;
    const count = Math.max(subLabels.length, values.length);

    // Calculate actual per-row heights (with per-item padding)
    let totalProximityH = 0;
    const rowHeights: number[] = [];
    for (let i = 0; i < count; i++) {
      const subLines = i < subLabels.length ? this.wrapText(subLabels[i], subTextW, FONT_SIZE) : [];
      const valLines = i < values.length ? this.wrapText(values[i], valTextW, FONT_SIZE) : [];
      const subH = subLines.length * FONT_SIZE * LINE_HEIGHT + CELL_PAD_Y * 2;
      const valH = valLines.length * FONT_SIZE * LINE_HEIGHT + CELL_PAD_Y * 2;
      const h = Math.max(subH, valH, FONT_SIZE * LINE_HEIGHT + CELL_PAD_Y * 2);
      rowHeights.push(h);
      totalProximityH += h;
    }

    const labelH = this.cellHeight(label, COL_W[0], { bold: true, fontSize: FONT_SIZE });
    const rowH = Math.max(labelH, totalProximityH);

    this.checkPageBreak(rowH);

    // Col 1: Label
    this.drawCell(col1X, this.cursorY, COL_W[0], rowH, label, {
      bold: true, fontSize: FONT_SIZE, fillColor: LBL_BG, bgOpacity: 0.5, vAlign: 'middle',
    });

    // Col 2: Sub-labels with wrapping
    this.drawRect(col2X, this.cursorY, COL_W[1], rowH, OPT_BG, '#000000', BORDER_W, 0.5);
    let subY = this.cursorY + CELL_PAD_Y;
    for (let i = 0; i < subLabels.length; i++) {
      const lines = this.wrapText(subLabels[i], subTextW, FONT_SIZE);
      const textH = lines.length * FONT_SIZE * LINE_HEIGHT;
      const textY = subY + (rowHeights[i] - textH) / 2;
      for (let j = 0; j < lines.length; j++) {
        this.drawTextAt(lines[j], col2X + CELL_PAD_X, textY + j * FONT_SIZE * LINE_HEIGHT, { fontSize: FONT_SIZE });
      }
      subY += rowHeights[i];
      if (i < subLabels.length - 1) {
        this.drawHLine(col2X, col2X + COL_W[1], subY, '#000000', 0.5);
      }
    }

    // Col 3: Values with wrapping
    this.drawRect(col3X, this.cursorY, COL_W[2], rowH, OPT_BG, '#000000', BORDER_W, 0.5);
    let valY = this.cursorY + CELL_PAD_Y;
    for (let i = 0; i < values.length; i++) {
      const lines = this.wrapText(values[i], valTextW, FONT_SIZE);
      const textH = lines.length * FONT_SIZE * LINE_HEIGHT;
      const textY = valY + (rowHeights[i] - textH) / 2;
      for (let j = 0; j < lines.length; j++) {
        this.drawTextAt(lines[j], col3X + CELL_PAD_X, textY + j * FONT_SIZE * LINE_HEIGHT, { fontSize: FONT_SIZE });
      }
      valY += rowHeights[i];
      if (i < values.length - 1) {
        this.drawHLine(col3X, col3X + COL_W[2], valY, '#000000', 0.5);
      }
    }

    this.cursorY += rowH;
  }

  /**
   * Draw the age option row: like optionRow but the selected *option* in col2 is bolded,
   * and col3 shows a separate actual value.
   * Text wraps within cells to prevent overflow.
   */
  drawAgeOptionRow(label: string, options: string[], selectedRange: string, actualValue: string): void {
    const col1X = MARGIN_L;
    const col2X = MARGIN_L + COL_W[0];
    const col3X = MARGIN_L + COL_W[0] + COL_W[1];

    const labelH = this.cellHeight(label, COL_W[0], { bold: true, fontSize: FONT_SIZE });
    const optionTextW = COL_W[1] - CELL_PAD_X * 2;
    const optionLineH = FONT_SIZE * LINE_HEIGHT + CELL_PAD_Y * 2;

    // Calculate actual heights per option (with per-item padding)
    let totalOptionsH = 0;
    const optionHeights: number[] = [];
    for (const opt of options) {
      const lines = this.wrapText(opt, optionTextW, FONT_SIZE);
      const h = Math.max(lines.length * FONT_SIZE * LINE_HEIGHT + CELL_PAD_Y * 2, optionLineH);
      optionHeights.push(h);
      totalOptionsH += h;
    }

    const valueH = this.cellHeight(actualValue || 'N/A', COL_W[2], { bold: true, fontSize: FONT_SIZE });
    const rowH = Math.max(labelH, totalOptionsH, valueH);

    this.checkPageBreak(rowH);

    // Col 1: Label
    this.drawCell(col1X, this.cursorY, COL_W[0], rowH, label, {
      bold: true, fontSize: FONT_SIZE, fillColor: LBL_BG, bgOpacity: 0.5, vAlign: 'middle',
    });

    // Col 2: Options with selectedRange bolded (wrapped, per-item heights)
    this.drawRect(col2X, this.cursorY, COL_W[1], rowH, OPT_BG, '#000000', BORDER_W, 0.5);
    let optY = this.cursorY + CELL_PAD_Y;
    for (let i = 0; i < options.length; i++) {
      const optLines = this.wrapText(options[i], optionTextW, FONT_SIZE);
      const textH = optLines.length * FONT_SIZE * LINE_HEIGHT;
      const textY = optY + (optionHeights[i] - textH) / 2;
      for (let j = 0; j < optLines.length; j++) {
        this.drawTextAt(optLines[j], col2X + CELL_PAD_X, textY + j * FONT_SIZE * LINE_HEIGHT, {
          bold: options[i] === selectedRange, fontSize: FONT_SIZE,
        });
      }
      optY += optionHeights[i];
      if (i < options.length - 1) {
        this.drawHLine(col2X, col2X + COL_W[1], optY, '#000000', 0.5);
      }
    }

    // Col 3: Actual value (with wrapping)
    this.drawCell(col3X, this.cursorY, COL_W[2], rowH, actualValue || 'N/A', {
      bold: true, fontSize: FONT_SIZE, fillColor: OPT_BG, bgOpacity: 0.5, align: 'center', vAlign: 'middle',
    });

    this.cursorY += rowH;
  }

  /**
   * Draw the 8-column floor valuation table.
   * Advances cursor.
   */
  drawFloorTable(
    headers: string[],
    rows: { name: string; area: string; rate: string; estimated: string; life: string; age: string; dep: string; netValue: string }[],
    totalLabel: string,
    totalValue: string,
  ): void {
    const numCols = 8;
    const colWidths = [
      Math.round(CONTENT_W * 0.12), // Floor
      Math.round(CONTENT_W * 0.12), // Area
      Math.round(CONTENT_W * 0.15), // Rate
      Math.round(CONTENT_W * 0.15), // Estimated
      Math.round(CONTENT_W * 0.08), // Life
      Math.round(CONTENT_W * 0.08), // Age
      Math.round(CONTENT_W * 0.09), // Dep%
      0, // Net Value (remainder)
    ];
    colWidths[7] = CONTENT_W - colWidths.slice(0, 7).reduce((a, b) => a + b, 0);

    const rowH = FONT_SIZE_SMALL * LINE_HEIGHT + CELL_PAD_Y * 2;
    const headerRowH = FONT_SIZE_SMALL * LINE_HEIGHT * 2 + CELL_PAD_Y * 2;
    const totalH = headerRowH + rowH * (rows.length + 1); // header + data rows + total row

    this.checkPageBreak(totalH);

    // Header row (black bg, white text)
    let cx = MARGIN_L;
    for (let c = 0; c < numCols; c++) {
      this.drawRect(cx, this.cursorY, colWidths[c], headerRowH, '#000000', '#000000', BORDER_W);

      const headerText = headers[c];
      const match = headerText.match(/^(.*?)\s+(\(.*\))$/);
      
      if (match) {
        const topText = match[1];
        const bottomText = match[2];
        const topY = this.cursorY + CELL_PAD_Y + 1;
        this.drawTextAt(topText, cx + CELL_PAD_X, topY, {
          bold: true, fontSize: FONT_SIZE_SMALL, textColor: '#FFFFFF', align: 'left', maxWidth: colWidths[c] - CELL_PAD_X * 2
        });
        this.drawTextAt(bottomText, cx + CELL_PAD_X, topY + FONT_SIZE_SMALL * LINE_HEIGHT, {
          bold: true, fontSize: FONT_SIZE_SMALL - 1.5, textColor: '#FFFFFF', align: 'left', maxWidth: colWidths[c] - CELL_PAD_X * 2
        });
      } else {
        const textH = FONT_SIZE_SMALL * LINE_HEIGHT;
        const topY = this.cursorY + (headerRowH - textH) / 2;
        this.drawTextAt(headerText, cx + CELL_PAD_X, topY, {
          bold: true, fontSize: FONT_SIZE_SMALL, textColor: '#FFFFFF', align: 'left', maxWidth: colWidths[c] - CELL_PAD_X * 2
        });
      }
      cx += colWidths[c];
    }
    this.cursorY += headerRowH;

    // Data rows
    const aligns: ('left' | 'right' | 'center')[] = ['left', 'right', 'right', 'right', 'center', 'center', 'center', 'right'];
    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      const vals = [row.name, row.area, row.rate, row.estimated, row.life, row.age, row.dep, row.netValue];
      const bgColor = r % 2 === 0 ? '#FFFFFF' : '#F5F5F5';
      cx = MARGIN_L;
      for (let c = 0; c < numCols; c++) {
        this.drawCell(cx, this.cursorY, colWidths[c], rowH, vals[c], {
          fontSize: FONT_SIZE_SMALL, align: aligns[c], fillColor: bgColor, bgOpacity: 0.5,
        });
        cx += colWidths[c];
      }
      this.cursorY += rowH;
    }

    // Total row
    const totalLabelW = colWidths.slice(0, 7).reduce((a, b) => a + b, 0);
    this.drawCell(MARGIN_L, this.cursorY, totalLabelW, rowH, totalLabel, {
      bold: true, fontSize: FONT_SIZE_SMALL, fillColor: LBL_BG, bgOpacity: 0.5,
    });
    this.drawCell(MARGIN_L + totalLabelW, this.cursorY, colWidths[7], rowH, totalValue, {
      bold: true, fontSize: FONT_SIZE_SMALL, fillColor: OPT_BG, bgOpacity: 0.5, align: 'right',
    });
    this.cursorY += rowH;
  }

  // ─── High-Level Content Methods ────────────────────────────────

  /**
   * Draw a plain text block (like "To", date, ref).
   * Advances cursor.
   */
  drawTextBlock(text: string, opts?: DrawTextOptions): void {
    const fontSize = opts?.fontSize || FONT_SIZE;
    const maxWidth = opts?.maxWidth || CONTENT_W;
    const lineH = fontSize * LINE_HEIGHT;
    const lines = this.wrapText(text, maxWidth, fontSize, opts?.bold, opts?.italic);
    const totalH = lines.length * lineH;

    this.checkPageBreak(totalH);

    for (let i = 0; i < lines.length; i++) {
      this.drawTextAt(lines[i], MARGIN_L, this.cursorY + i * lineH, {
        ...opts, maxWidth: CONTENT_W,
      });
    }

    this.cursorY += totalH;
  }

  /**
   * Draw a rich text block with mixed bold/regular segments.
   * Advances cursor.
   */
  drawRichTextBlock(segments: TextSegment[], opts?: { fontSize?: number }): void {
    const fontSize = opts?.fontSize || FONT_SIZE;
    const maxWidth = CONTENT_W - CELL_PAD_X;
    const h = this.measureRichTextHeight(segments, maxWidth, fontSize);

    this.checkPageBreak(h);

    const consumed = this.drawRichTextAt(segments, MARGIN_L, this.cursorY, maxWidth, fontSize);
    this.cursorY += consumed;
  }

  /**
   * Draw a centered title.
   * Advances cursor.
   */
  drawCenteredTitle(text: string, fontSize?: number, underline?: boolean): void {
    const fs = fontSize || FONT_SIZE_HEADER;
    const lineH = fs * LINE_HEIGHT;
    // Require an extra 60pt of space to prevent orphaned headings
    this.checkPageBreak(lineH + 60);
    this.drawTextAt(text, MARGIN_L, this.cursorY, {
      bold: true, fontSize: fs, align: 'center', maxWidth: CONTENT_W,
    });
    if (underline) {
      const font = this.getFont(true);
      const safeStr = this.sanitizeText(text);
      const tw = font.widthOfTextAtSize(safeStr, fs);
      const drawX = MARGIN_L + (CONTENT_W - tw) / 2;
      const lineTopY = this.cursorY + fs * 0.95;
      this.drawHLine(drawX, drawX + tw, lineTopY, '#000000', 1);
    }
    this.cursorY += lineH;
  }

  /**
   * Draw a bordered certificate box with rich text content.
   * Advances cursor.
   */
  drawCertificateBox(lines: { segments: TextSegment[]; bold?: boolean }[]): void {
    const boxPad = 8;
    const fs = FONT_SIZE;
    const lineH = fs * LINE_HEIGHT;
    const innerW = CONTENT_W - boxPad * 2;

    // Measure total height
    let totalTextH = 0;
    for (const line of lines) {
      if (line.segments.length > 0) {
        totalTextH += this.measureRichTextHeight(line.segments, innerW, fs);
      }
      totalTextH += 2; // spacing between lines
    }
    const boxH = totalTextH + boxPad * 2;

    this.checkPageBreak(boxH);

    // Draw box border
    this.drawRect(MARGIN_L, this.cursorY, CONTENT_W, boxH, undefined, '#000000', 1.5);

    // Draw content
    let yOff = this.cursorY + boxPad;
    for (const line of lines) {
      if (line.segments.length > 0) {
        const consumed = this.drawRichTextAt(line.segments, MARGIN_L + boxPad, yOff, innerW, fs);
        yOff += consumed;
      }
      yOff += 2;
    }

    this.cursorY += boxH;
  }

  /**
   * Draw a right-aligned signature block.
   * Advances cursor.
   */
  drawSignatureBlock(lines: { text: string; bold?: boolean; italic?: boolean; fontSize?: number }[]): void {
    const lineH = FONT_SIZE * LINE_HEIGHT;
    const totalH = lines.length * lineH + 20; // extra spacing at top

    this.checkPageBreak(totalH);
    this.cursorY += 20; // gap before signature

    for (const line of lines) {
      const fs = line.fontSize || FONT_SIZE;
      this.drawTextAt(line.text, MARGIN_L, this.cursorY, {
        bold: line.bold, italic: line.italic, fontSize: fs, align: 'right', maxWidth: CONTENT_W,
      });
      this.cursorY += fs * LINE_HEIGHT;
    }
  }

  // ─── Image Support ─────────────────────────────────────────────

  /**
   * Embed an image (PNG or JPEG bytes) and draw it.
   * Returns the embedded image for reuse, or null on failure.
   */
  async drawImageBlock(
    imageBytes: Uint8Array,
    opts?: {
      maxWidth?: number;
      maxHeight?: number;
      caption?: string;
      centered?: boolean;
    }
  ): Promise<void> {
    if (!imageBytes || imageBytes.length === 0) return;

    let img: PDFImage;
    try {
      try {
        img = await this.doc.embedPng(imageBytes);
      } catch {
        img = await this.doc.embedJpg(imageBytes);
      }
    } catch {
      return; // unsupported format
    }

    const maxW = opts?.maxWidth || CONTENT_W * 0.85;
    const maxH = opts?.maxHeight || 400;

    // Scale to fit
    let w = img.width;
    let h = img.height;
    if (w > maxW) { h = h * (maxW / w); w = maxW; }
    if (h > maxH) { w = w * (maxH / h); h = maxH; }

    const captionH = opts?.caption ? FONT_SIZE_CAPTION * LINE_HEIGHT + 4 : 0;
    const totalH = h + captionH + 8;

    this.checkPageBreak(totalH);

    const x = opts?.centered ? MARGIN_L + (CONTENT_W - w) / 2 : MARGIN_L;
    const pY = this.pdfY(this.cursorY) - h;

    this.page.drawImage(img, { x, y: pY, width: w, height: h });
    this.cursorY += h + 4;

    if (opts?.caption) {
      this.drawTextAt(opts.caption, MARGIN_L, this.cursorY, {
        italic: true, fontSize: FONT_SIZE_CAPTION, align: 'center', maxWidth: CONTENT_W,
      });
      this.cursorY += FONT_SIZE_CAPTION * LINE_HEIGHT + 4;
    }
  }

  /**
   * Draw two images side by side with captions.
   * Dynamically sizes images based on actual aspect ratio to reduce whitespace.
   */
  async drawImagePair(
    img1Bytes: Uint8Array, caption1: string,
    img2Bytes: Uint8Array | null, caption2: string,
  ): Promise<void> {
    const gap = 8;
    const imgW = (CONTENT_W - gap) / 2;
    const maxImgH = 220;
    const captionH = FONT_SIZE_CAPTION * LINE_HEIGHT + 2;

    let img1: PDFImage | null = null;
    let img2: PDFImage | null = null;

    if (img1Bytes && img1Bytes.length > 0) {
      try { img1 = await this.doc.embedPng(img1Bytes); } catch {
        try { img1 = await this.doc.embedJpg(img1Bytes); } catch { /* skip */ }
      }
    }
    if (img2Bytes && img2Bytes.length > 0) {
      try { img2 = await this.doc.embedPng(img2Bytes); } catch {
        try { img2 = await this.doc.embedJpg(img2Bytes); } catch { /* skip */ }
      }
    }

    const calcSize = (img: PDFImage) => {
      let w = img.width, h = img.height;
      if (w > imgW) { h = h * (imgW / w); w = imgW; }
      if (h > maxImgH) { w = w * (maxImgH / h); h = maxImgH; }
      return { w, h };
    };

    const s1 = img1 ? calcSize(img1) : { w: 0, h: 0 };
    const s2 = img2 ? calcSize(img2) : { w: 0, h: 0 };
    const rowImgH = Math.max(s1.h, s2.h);
    const pairH = rowImgH + captionH + 6;

    this.checkPageBreak(pairH);

    if (img1) {
      const x1 = MARGIN_L;
      const cx = x1 + (imgW - s1.w) / 2;
      const pY = this.pdfY(this.cursorY + (rowImgH - s1.h)) - s1.h;
      this.page.drawImage(img1, { x: cx, y: pY, width: s1.w, height: s1.h });
      this.drawTextAt(caption1, x1, this.cursorY + rowImgH + 2, {
        bold: true, fontSize: FONT_SIZE_CAPTION, align: 'center', maxWidth: imgW,
      });
    }

    if (img2) {
      const x2 = MARGIN_L + imgW + gap;
      const cx = x2 + (imgW - s2.w) / 2;
      const pY = this.pdfY(this.cursorY + (rowImgH - s2.h)) - s2.h;
      this.page.drawImage(img2, { x: cx, y: pY, width: s2.w, height: s2.h });
      this.drawTextAt(caption2, x2, this.cursorY + rowImgH + 2, {
        bold: true, fontSize: FONT_SIZE_CAPTION, align: 'center', maxWidth: imgW,
      });
    }

    this.cursorY += pairH;
  }

  /**
   * Helper to trim empty leading/trailing columns and rows from an Excel table grid
   * and adjust merge coordinates and column widths accordingly.
   */
  trimEmptyGrid(
    allRows: string[][],
    merges: { sr: number; sc: number; er: number; ec: number }[],
    colWidths?: number[]
  ) {
    if (!allRows || allRows.length === 0) return { allRows: [], merges: [], colWidths: [] };
    const numRows = allRows.length;
    const numCols = allRows[0]?.length || 0;
    const cellStr = (v: any) => String(v ?? '').trim();

    let minCol = 0;
    while (minCol < numCols) {
      if (!allRows.every(row => !row || cellStr(row[minCol]) === '')) break;
      minCol++;
    }
    let maxCol = numCols - 1;
    while (maxCol >= minCol) {
      if (!allRows.every(row => !row || cellStr(row[maxCol]) === '')) break;
      maxCol--;
    }
    let minRow = 0;
    while (minRow < numRows) {
      if (!allRows[minRow] || !allRows[minRow].every(cell => cellStr(cell) === '')) break;
      minRow++;
    }
    let maxRow = numRows - 1;
    while (maxRow >= minRow) {
      if (!allRows[maxRow] || !allRows[maxRow].every(cell => cellStr(cell) === '')) break;
      maxRow--;
    }

    if (minCol > maxCol || minRow > maxRow) return { allRows: [], merges: [], colWidths: [] };

    const trimmedRows = allRows.slice(minRow, maxRow + 1).map(row => (row || []).slice(minCol, maxCol + 1));
    const trimmedColWidths = (colWidths && colWidths.length === numCols) ? colWidths.slice(minCol, maxCol + 1) : [];

    const newNumRows = maxRow - minRow + 1;
    const newNumCols = maxCol - minCol + 1;
    const trimmedMerges: { sr: number; sc: number; er: number; ec: number }[] = [];

    for (const m of merges) {
      const sr = m.sr - minRow;
      const er = m.er - minRow;
      const sc = m.sc - minCol;
      const ec = m.ec - minCol;
      if (er < 0 || sr >= newNumRows || ec < 0 || sc >= newNumCols) continue;
      trimmedMerges.push({
        sr: Math.max(0, sr),
        sc: Math.max(0, sc),
        er: Math.min(newNumRows - 1, er),
        ec: Math.min(newNumCols - 1, ec),
      });
    }

    // Auto-detect horizontal row merges for single-entry rows (e.g. section titles)
    for (let r = 0; r < trimmedRows.length; r++) {
      const row = trimmedRows[r];
      const nonEmpties = row.map((cell, c) => ({ cell: cellStr(cell), c })).filter(item => item.cell !== '');
      if (nonEmpties.length === 1 && newNumCols > 1) {
        const firstCol = nonEmpties[0].c;
        const existing = trimmedMerges.find(m => m.sr === r && m.sc === firstCol);
        if (!existing) {
          trimmedMerges.push({ sr: r, sc: firstCol, er: r, ec: newNumCols - 1 });
        }
      }
    }

    return { allRows: trimmedRows, merges: trimmedMerges, colWidths: trimmedColWidths };
  }

  /**
   * Draw a generic data table from a 2D string array (headers + rows).
   * Auto-fits column widths proportionally. Handles page breaks.
   */
  drawDataTable(headers: string[], rows: string[][]): void {
    if (headers.length === 0) return;

    const numCols = headers.length;
    const cellStr = (v: any) => String(v ?? '').trim();
    const isFullWidth = (arr: string[]) => arr && arr.length > 0 && cellStr(arr[0]) !== '' && arr.slice(1).every(c => cellStr(c) === '');

    const maxColChars = Array(numCols).fill(3);
    if (!isFullWidth(headers)) {
      headers.forEach((h, i) => { if (h && h.length > maxColChars[i]) maxColChars[i] = h.length; });
    }
    for (const row of rows) {
      if (isFullWidth(row)) continue;
      row.forEach((cell, i) => {
        if (cell && cell.length > maxColChars[i]) maxColChars[i] = cell.length;
      });
    }

    const totalChars = maxColChars.reduce((a, b) => a + b, 0);
    const colWidths = maxColChars.map(c => Math.max((c / totalChars) * CONTENT_W, 30));
    const widthSum = colWidths.reduce((a, b) => a + b, 0);
    const scale = CONTENT_W / widthSum;
    const finalWidths = colWidths.map(w => w * scale);

    const fontSize = 9;
    const rowPadY = 4;
    const rowPadX = 4;

    let headerH = 0;
    const headerIsFull = isFullWidth(headers);
    if (headerIsFull) {
      const lines = this.wrapText(headers[0], CONTENT_W - rowPadX * 2, fontSize, true);
      headerH = lines.length * fontSize * LINE_HEIGHT + rowPadY * 2 + 2;
    } else {
      headerH = Math.max(...headers.map((h, i) => {
        const lines = this.wrapText(h, finalWidths[i] - rowPadX * 2, fontSize, true);
        return lines.length * fontSize * LINE_HEIGHT + rowPadY * 2 + 2;
      }));
    }

    this.checkPageBreak(headerH + 40);

    let x = MARGIN_L;
    if (headerIsFull) {
      this.drawCell(x, this.cursorY, CONTENT_W, headerH, headers[0], {
        bold: true, fontSize, align: 'center', vAlign: 'middle', fillColor: LBL_BG, bgOpacity: 0.45,
      });
    } else {
      for (let c = 0; c < numCols; c++) {
        this.drawCell(x, this.cursorY, finalWidths[c], headerH, headers[c], {
          bold: true, fontSize, align: 'center', vAlign: 'middle', fillColor: LBL_BG, bgOpacity: 0.45,
        });
        x += finalWidths[c];
      }
    }
    this.cursorY += headerH;

    for (const row of rows) {
      const rowIsFull = isFullWidth(row);
      let rowH = 0;

      if (rowIsFull) {
        const lines = this.wrapText(row[0], CONTENT_W - rowPadX * 2, fontSize);
        rowH = lines.length * fontSize * LINE_HEIGHT + rowPadY * 2 + 2;
      } else {
        const cellHeights = row.map((cell, c) => {
          const lines = this.wrapText(cell || '', finalWidths[c] - rowPadX * 2, fontSize);
          return lines.length * fontSize * LINE_HEIGHT + rowPadY * 2 + 2;
        });
        rowH = Math.max(...cellHeights, fontSize * LINE_HEIGHT + rowPadY * 2 + 2);
      }

      this.checkPageBreak(rowH);

      x = MARGIN_L;
      if (rowIsFull) {
        this.drawCell(x, this.cursorY, CONTENT_W, rowH, row[0], { fontSize, vAlign: 'middle', fillColor: LBL_BG, bgOpacity: 0.45 });
      } else {
        for (let c = 0; c < numCols; c++) {
          this.drawCell(x, this.cursorY, finalWidths[c], rowH, row[c] || '', { fontSize, align: 'center', vAlign: 'middle', fillColor: LBL_BG, bgOpacity: 0.45 });
          x += finalWidths[c];
        }
      }
      this.cursorY += rowH;
    }
  }

  /**
   * Draw a table from Excel data that may contain merged cells (col/row spans).
   * allRows     — every row including header
   * merges      — 0-indexed { sr, sc, er, ec } ranges (relative to allRows)
   * colWidths   — normalised 0-1 column widths (from workbook or equal-split)
   */
  drawMergedTable(
    rawAllRows: string[][],
    rawMerges: { sr: number; sc: number; er: number; ec: number }[],
    rawColWidths: number[],
  ): void {
    const { allRows, merges, colWidths } = this.trimEmptyGrid(rawAllRows, rawMerges, rawColWidths);
    if (!allRows || allRows.length === 0) return;

    const numCols = allRows[0].length;
    const fontSize = 9;
    const padX = 4;
    const padY = 4;
    const DEFAULT_ROW_H = fontSize * LINE_HEIGHT + padY * 2 + 2;

    let colPx: number[];
    if (colWidths && colWidths.length === numCols) {
      const totalNorm = colWidths.reduce((s, w) => s + w, 0) || 1;
      colPx = colWidths.map(w => (w / totalNorm) * CONTENT_W);
    } else {
      colPx = Array(numCols).fill(CONTENT_W / numCols);
    }
    const pxSum = colPx.reduce((s, w) => s + w, 0);
    if (pxSum > 0) {
      const scale = CONTENT_W / pxSum;
      colPx = colPx.map(w => w * scale);
    }

    const covered = new Set<string>();
    const spanMap = new Map<string, { er: number; ec: number }>();
    for (const m of merges) {
      spanMap.set(`${m.sr},${m.sc}`, { er: m.er, ec: m.ec });
      for (let r = m.sr; r <= m.er; r++) {
        for (let c = m.sc; c <= m.ec; c++) {
          if (r !== m.sr || c !== m.sc) covered.add(`${r},${c}`);
        }
      }
    }

    // Pre-compute row heights using exact text wrapping
    const rowH: number[] = allRows.map((row, ri) => {
      let h = DEFAULT_ROW_H;
      for (let ci = 0; ci < numCols; ci++) {
        if (covered.has(`${ri},${ci}`)) continue;
        const span = spanMap.get(`${ri},${ci}`);
        if (span && span.er > ri) continue;
        const colSpan = span ? span.ec - ci + 1 : 1;
        const cellW = colPx.slice(ci, ci + colSpan).reduce((s, w) => s + w, 0);
        const text = row[ci] || '';
        const isHeader = ri === 0;
        const lines = this.wrapText(text, cellW - padX * 2, fontSize, isHeader);
        const needed = lines.length * fontSize * LINE_HEIGHT + padY * 2 + 2;
        if (needed > h) h = needed;
      }
      return h;
    });

    for (let ri = 0; ri < allRows.length; ri++) {
      const row = allRows[ri];
      this.checkPageBreak(rowH[ri]);

      let x = MARGIN_L;
      for (let ci = 0; ci < numCols; ci++) {
        const colW = colPx[ci] || (CONTENT_W / numCols);

        if (covered.has(`${ri},${ci}`)) {
          x += colW;
          continue;
        }

        const span = spanMap.get(`${ri},${ci}`);
        const colSpan = span ? span.ec - ci + 1 : 1;
        const rowSpan = span ? span.er - ri + 1 : 1;

        const cellW = colPx.slice(ci, ci + colSpan).reduce((s, w) => s + w, 0);
        const cellH = rowSpan > 1
          ? rowH.slice(ri, ri + rowSpan).reduce((s, h) => s + h, 0)
          : rowH[ri];

        const isHeader = ri === 0;
        const isSpannedHeader = colSpan === numCols;
        this.drawCell(x, this.cursorY, cellW, cellH, row[ci] || '', {
          bold: isHeader || isSpannedHeader,
          fontSize,
          align: 'center',
          vAlign: 'middle',
          fillColor: LBL_BG,
          bgOpacity: 0.45,
        });

        x += colW;
      }

      this.cursorY += rowH[ri];
    }
  }

  private drawPageNumbers(): void {
    const pages = this.doc.getPages();
    for (let i = 1; i < pages.length; i++) {
      const page = pages[i];
      const text = String(i + 1);
      const textW = this.fontRegular.widthOfTextAtSize(text, 10);
      page.drawText(text, {
        x: MARGIN_L + CONTENT_W - textW, // Aligned to the right
        y: MARGIN_B / 2,
        size: 10,
        font: this.fontRegular,
      });
    }
  }

  // ─── Output ────────────────────────────────────────────────────

  /** Generate the PDF as a Blob */
  async toBlob(): Promise<Blob> {
    this.drawPageNumbers();
    const bytes = await this.doc.save();
    return new Blob([bytes] as any, { type: 'application/pdf' });
  }
}
