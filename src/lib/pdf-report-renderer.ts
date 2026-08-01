/**
 * PDFReportRenderer — Custom pdf-lib renderer for S. Mohanty & Associates valuation reports.
 *
 * Provides reusable drawing primitives (drawCell, drawTable, drawSection, drawWrappedText, etc.)
 * on top of pdf-lib. All coordinates use a top-down system internally converted to pdf-lib's
 * bottom-left origin.
 *
 * US Letter: 612 × 792 points (1pt = 1/72 inch)
 */

import { PDFDocument, PDFPage, PDFFont, StandardFonts, rgb, PDFImage } from 'pdf-lib';

// ─── Color helpers ──────────────────────────────────────────────────
function hexToRgb(hex: string) {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16) / 255;
  const g = parseInt(h.substring(2, 4), 16) / 255;
  const b = parseInt(h.substring(4, 6), 16) / 255;
  return rgb(r, g, b);
}

// ─── Constants ──────────────────────────────────────────────────────
const PAGE_W = 612;   // US Letter width in points
const PAGE_H = 792;   // US Letter height in points
const MARGIN_T = 84;  // Top margin (matches letterhead header)
const MARGIN_B = 80;  // Bottom margin (matches letterhead footer)
const MARGIN_L = 54;  // Left margin
const MARGIN_R = 54;  // Right margin
const CONTENT_W = PAGE_W - MARGIN_L - MARGIN_R; // 504pt usable width

// 3-column widths (28% / 35% / 37%)
const COL_W = [
  Math.round(CONTENT_W * 0.28), // 141pt — label column
  Math.round(CONTENT_W * 0.35), // 176pt — options column
  CONTENT_W - Math.round(CONTENT_W * 0.28) - Math.round(CONTENT_W * 0.35), // 187pt — value column
];

// Styling
const CELL_PAD_X = 4;
const CELL_PAD_Y = 3;
const FONT_SIZE = 12;
const FONT_SIZE_HEADER = 14;
const FONT_SIZE_SMALL = 11;
const FONT_SIZE_CAPTION = 10;
const LINE_HEIGHT = 1.25; // multiplier on font size
const BORDER_W = 0.75;
const LBL_BG = '#DBE6F0';
const OPT_BG = '#DDE9F6';

export interface TextSegment {
  text: string;
  bold?: boolean;
  italic?: boolean;
}

interface DrawTextOptions {
  bold?: boolean;
  italic?: boolean;
  fontSize?: number;
  align?: 'left' | 'center' | 'right';
  maxWidth?: number;
}

export class PDFReportRenderer {
  private doc!: PDFDocument;
  private page!: PDFPage;
  private fontRegular!: PDFFont;
  private fontBold!: PDFFont;
  private fontItalic!: PDFFont;
  private fontBoldItalic!: PDFFont;
  private letterheadImage: PDFImage | null = null;
  private cursorY = 0; // distance from top of content area (top-down)
  private initialized = false;

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
        this.letterheadImage = await this.doc.embedPng(letterheadBytes);
      } catch {
        try {
          this.letterheadImage = await this.doc.embedJpg(letterheadBytes);
        } catch {
          this.letterheadImage = null;
        }
      }
    }

    this.addPage();
    this.initialized = true;
  }

  // ─── Page Management ────────────────────────────────────────────

  private addPage(): void {
    this.page = this.doc.addPage([PAGE_W, PAGE_H]);
    this.cursorY = 0;

    // Draw letterhead background
    if (this.letterheadImage) {
      this.page.drawImage(this.letterheadImage, {
        x: 0, y: 0, width: PAGE_W, height: PAGE_H,
      });
    }
  }

  /** Available height remaining on current page */
  private get availableHeight(): number {
    return PAGE_H - MARGIN_T - MARGIN_B - this.cursorY;
  }

  /** Convert top-down cursorY to pdf-lib bottom-up Y */
  private pdfY(topDown: number): number {
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

  private getFont(bold?: boolean, italic?: boolean): PDFFont {
    if (bold && italic) return this.fontBoldItalic;
    if (bold) return this.fontBold;
    if (italic) return this.fontItalic;
    return this.fontRegular;
  }

  // ─── Text Measurement ──────────────────────────────────────────

  /** Measure the width of a string at a given font size */
  private textWidth(text: string, fontSize: number, bold?: boolean, italic?: boolean): number {
    const font = this.getFont(bold, italic);
    return font.widthOfTextAtSize(String(text ?? ''), fontSize);
  }

  /** Break text into lines that fit within maxWidth */
  private wrapText(text: string, maxWidth: number, fontSize: number, bold?: boolean, italic?: boolean): string[] {
    const strText = String(text ?? '');
    if (!strText) return [''];
    const font = this.getFont(bold, italic);
    const words = strText.split(/\s+/);
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
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
      const words = String(seg.text || '').split(/(\s+)/);
      for (const w of words) {
        if (w) wordList.push({ word: w, bold: seg.bold, italic: seg.italic });
      }
    }
    const lines: { word: string; bold?: boolean; italic?: boolean }[][] = [];
    let currentLine: typeof wordList = [];
    let currentWidth = 0;
    for (const item of wordList) {
      const font = this.getFont(item.bold, item.italic);
      const ww = font.widthOfTextAtSize(item.word, fontSize);
      if (currentWidth + ww > maxWidth && currentLine.length > 0 && !/^\s+$/.test(item.word)) {
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
  private drawRect(x: number, topY: number, w: number, h: number, fillColor?: string, borderColor?: string, borderWidth?: number, opacity?: number): void {
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
  private drawHLine(x1: number, x2: number, topY: number, color?: string, width?: number): void {
    const pY = this.pdfY(topY);
    this.page.drawLine({
      start: { x: x1, y: pY },
      end: { x: x2, y: pY },
      thickness: width || 0.5,
      color: color ? hexToRgb(color) : rgb(0, 0, 0),
    });
  }

  /** Draw a single line of text at absolute coordinates */
  private drawTextAt(text: string, x: number, topY: number, opts?: DrawTextOptions & { textColor?: string }): void {
    const strText = String(text || '');
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
  private drawWrappedTextAt(text: string, x: number, topY: number, maxWidth: number, opts?: DrawTextOptions): number {
    const fontSize = opts?.fontSize || FONT_SIZE;
    const lineH = fontSize * LINE_HEIGHT;
    const lines = this.wrapText(String(text || ''), maxWidth, fontSize, opts?.bold, opts?.italic);

    for (let i = 0; i < lines.length; i++) {
      this.drawTextAt(lines[i], x, topY + i * lineH, { ...opts, maxWidth });
    }
    return lines.length * lineH;
  }

  /** Draw rich text segments (mixed bold/regular) on a single conceptual line, with wrapping */
  private drawRichTextAt(segments: TextSegment[], x: number, topY: number, maxWidth: number, fontSize: number): number {
    // Simple approach: concatenate, wrap, then draw word by word with correct style
    // For now, wrap the full text and draw each line, applying bold to the right words
    const lineH = fontSize * LINE_HEIGHT;

    // Build a flat list of {word, bold, italic}
    const wordList: { word: string; bold?: boolean; italic?: boolean }[] = [];
    for (const seg of segments) {
      const words = String(seg.text || '').split(/(\s+)/); // preserve whitespace
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
      const ww = font.widthOfTextAtSize(item.word, fontSize);
      if (currentWidth + ww > maxWidth && currentLine.length > 0 && !/^\s+$/.test(item.word)) {
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
        this.page.drawText(item.word, {
          x: cx, y: pY, size: fontSize, font, color: rgb(0, 0, 0),
        });
        cx += font.widthOfTextAtSize(item.word, fontSize);
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
   * Draw a simple row: "Label: - **Value**" spanning all 3 columns.
   * Advances cursor.
   */
  drawSimpleRow(label: string, value: string): void {
    const segments = [
      { text: `${label}: - ` },
      { text: value || 'N/A', bold: true },
    ];
    const textW = CONTENT_W - CELL_PAD_X * 2;
    const textH = this.measureRichTextHeight(segments, textW, FONT_SIZE);
    const h = Math.max(textH + CELL_PAD_Y * 2, FONT_SIZE * LINE_HEIGHT + CELL_PAD_Y * 2);

    this.checkPageBreak(h);

    // Fill + border for full row
    this.drawRect(MARGIN_L, this.cursorY, CONTENT_W, h, '#FFFFFF', '#000000', BORDER_W, 0.5);

    // Draw rich text: label normal, value bold
    this.drawRichTextAt(
      segments,
      MARGIN_L + CELL_PAD_X,
      this.cursorY + CELL_PAD_Y,
      textW,
      FONT_SIZE
    );

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

    // Calculate actual heights per option (sum of each option's wrapped height + padding)
    let totalOptionsH = 0;
    const optionHeights: number[] = [];
    for (const opt of options) {
      const lines = this.wrapText(opt, optionTextW, FONT_SIZE);
      const h = lines.length * FONT_SIZE * LINE_HEIGHT + CELL_PAD_Y * 2;
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
    let optY = this.cursorY;
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

    // Calculate actual per-row heights
    let totalProximityH = 0;
    const rowHeights: number[] = [];
    for (let i = 0; i < count; i++) {
      const subH = i < subLabels.length
        ? this.wrapText(subLabels[i], subTextW, FONT_SIZE).length * FONT_SIZE * LINE_HEIGHT + CELL_PAD_Y * 2
        : 0;
      const valH = i < values.length
        ? this.wrapText(values[i], valTextW, FONT_SIZE).length * FONT_SIZE * LINE_HEIGHT + CELL_PAD_Y * 2
        : 0;
      const rowH = Math.max(subH, valH, FONT_SIZE * LINE_HEIGHT + CELL_PAD_Y * 2);
      rowHeights.push(rowH);
      totalProximityH += rowH;
    }

    const labelH = this.cellHeight(label, COL_W[0], { bold: true, fontSize: FONT_SIZE });
    const rowH = Math.max(labelH, totalProximityH);

    this.checkPageBreak(rowH);

    // Col 1: Label
    this.drawCell(col1X, this.cursorY, COL_W[0], rowH, label, {
      bold: true, fontSize: FONT_SIZE, fillColor: LBL_BG, bgOpacity: 0.5, vAlign: 'middle',
    });

    // Col 2: Sub-labels with wrapping and correct per-row heights
    this.drawRect(col2X, this.cursorY, COL_W[1], rowH, OPT_BG, '#000000', BORDER_W, 0.5);
    let subY = this.cursorY;
    for (let i = 0; i < subLabels.length; i++) {
      const lines = this.wrapText(subLabels[i], subTextW, FONT_SIZE);
      const allocatedH = rowHeights[i];
      const textH = lines.length * FONT_SIZE * LINE_HEIGHT;
      const textY = subY + (allocatedH - textH) / 2;
      for (let j = 0; j < lines.length; j++) {
        this.drawTextAt(lines[j], col2X + CELL_PAD_X, textY + j * FONT_SIZE * LINE_HEIGHT, { fontSize: FONT_SIZE });
      }
      subY += allocatedH;
      if (i < subLabels.length - 1) {
        this.drawHLine(col2X, col2X + COL_W[1], subY, '#000000', 0.5);
      }
    }

    // Col 3: Values with wrapping and correct per-row heights
    this.drawRect(col3X, this.cursorY, COL_W[2], rowH, OPT_BG, '#000000', BORDER_W, 0.5);
    let valY = this.cursorY;
    for (let i = 0; i < values.length; i++) {
      const lines = this.wrapText(values[i], valTextW, FONT_SIZE);
      const allocatedH = rowHeights[i];
      const textH = lines.length * FONT_SIZE * LINE_HEIGHT;
      const textY = valY + (allocatedH - textH) / 2;
      for (let j = 0; j < lines.length; j++) {
        this.drawTextAt(lines[j], col3X + CELL_PAD_X, textY + j * FONT_SIZE * LINE_HEIGHT, { fontSize: FONT_SIZE });
      }
      valY += allocatedH;
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

    // Calculate actual heights per option
    let totalOptionsH = 0;
    const optionHeights: number[] = [];
    for (const opt of options) {
      const lines = this.wrapText(opt, optionTextW, FONT_SIZE);
      const h = lines.length * FONT_SIZE * LINE_HEIGHT + CELL_PAD_Y * 2;
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
    let optY = this.cursorY;
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
  drawCenteredTitle(text: string, fontSize?: number): void {
    const fs = fontSize || FONT_SIZE_HEADER;
    const lineH = fs * LINE_HEIGHT;
    // Require an extra 60pt of space to prevent orphaned headings
    this.checkPageBreak(lineH + 60);
    this.drawTextAt(text, MARGIN_L, this.cursorY, {
      bold: true, fontSize: fs, align: 'center', maxWidth: CONTENT_W,
    });
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
   */
  async drawImagePair(
    img1Bytes: Uint8Array, caption1: string,
    img2Bytes: Uint8Array | null, caption2: string,
  ): Promise<void> {
    const imgW = (CONTENT_W - 16) / 2; // half width minus gap
    const imgH = 170;
    const captionH = FONT_SIZE_CAPTION * LINE_HEIGHT;
    const pairH = imgH + captionH + 12;

    this.checkPageBreak(pairH);

    // Image 1
    if (img1Bytes && img1Bytes.length > 0) {
      let img: PDFImage;
      try { img = await this.doc.embedPng(img1Bytes); } catch {
        try { img = await this.doc.embedJpg(img1Bytes); } catch { return; }
      }
      const x1 = MARGIN_L + 4;
      let w = img.width, h = img.height;
      if (w > imgW) { h = h * (imgW / w); w = imgW; }
      if (h > imgH) { w = w * (imgH / h); h = imgH; }
      const cx = x1 + (imgW - w) / 2;
      const pY = this.pdfY(this.cursorY) - h;
      this.page.drawImage(img, { x: cx, y: pY, width: w, height: h });

      // Caption 1
      this.drawTextAt(caption1, x1, this.cursorY + imgH + 4, {
        italic: true, fontSize: FONT_SIZE_CAPTION, align: 'center', maxWidth: imgW,
      });
    }

    // Image 2
    if (img2Bytes && img2Bytes.length > 0) {
      let img: PDFImage;
      try { img = await this.doc.embedPng(img2Bytes); } catch {
        try { img = await this.doc.embedJpg(img2Bytes); } catch { 
          this.cursorY += pairH;
          return;
        }
      }
      const x2 = MARGIN_L + imgW + 12;
      let w = img.width, h = img.height;
      if (w > imgW) { h = h * (imgW / w); w = imgW; }
      if (h > imgH) { w = w * (imgH / h); h = imgH; }
      const cx = x2 + (imgW - w) / 2;
      const pY = this.pdfY(this.cursorY) - h;
      this.page.drawImage(img, { x: cx, y: pY, width: w, height: h });

      // Caption 2
      this.drawTextAt(caption2, x2, this.cursorY + imgH + 4, {
        italic: true, fontSize: FONT_SIZE_CAPTION, align: 'center', maxWidth: imgW,
      });
    }

    this.cursorY += pairH;
  }

  // ─── Output ────────────────────────────────────────────────────

  /** Generate the PDF as a Blob */
  async toBlob(): Promise<Blob> {
    const bytes = await this.doc.save();
    return new Blob([bytes], { type: 'application/pdf' });
  }
}
