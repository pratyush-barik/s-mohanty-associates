/**
 * DOCXIBBIRenderer — Word document renderer for S Mohanty & Associates IBBI valuation reports.
 * Mirrors the API of PDFIBBIRenderer but outputs .docx using the 'docx' npm package.
 * Uses A4 Portrait size with matching margins.
 */

import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, HeadingLevel, BorderStyle, WidthType, ImageRun,
  PageBreak, Header, Footer, PageNumber, TableLayoutType,
  ShadingType, UnderlineType, convertInchesToTwip, Tab, TabStopType, TabStopPosition, LeaderType,
} from 'docx';

// ─── Types ──────────────────────────────────────────────────────
interface DrawTextOptions {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  fontSize?: number;
  align?: 'left' | 'center' | 'right';
}

interface TextSegment {
  text: string;
  bold?: boolean;
  italic?: boolean;
}

interface SignatureItem {
  text: string;
  bold?: boolean;
  italic?: boolean;
}

// ─── Constants ──────────────────────────────────────────────────
const FONT_NAME = 'Times New Roman';
const FONT_SIZE_DEFAULT = 11; // half-points = 22
const HEADER_COLOR = '1E3A5F';
const TABLE_BORDER = { style: BorderStyle.SINGLE, size: 1, color: '000000' };
const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };

export class DOCXIBBIRenderer {
  private children: (Paragraph | Table)[] = [];
  private letterheadBytes: Uint8Array | null = null;

  async init(letterheadBytes?: Uint8Array): Promise<void> {
    this.letterheadBytes = letterheadBytes || null;
  }

  // ── Spacing helper ──
  advanceCursor(pts: number): void {
    // Convert pt spacing to a blank paragraph with spacing
    this.children.push(new Paragraph({ spacing: { after: pts * 15 } }));
  }

  // ── Page break ──
  newPage(): void {
    this.children.push(new Paragraph({ children: [new PageBreak()] }));
  }

  // ── Centered Title ──
  drawCenteredTitle(text: string, fontSize?: number): void {
    this.children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [new TextRun({
        text,
        bold: true,
        underline: { type: UnderlineType.SINGLE },
        font: FONT_NAME,
        size: (fontSize || 14) * 2,
      })],
    }));
  }

  // ── Section Header ──
  drawSectionHeader(text: string): void {
    this.children.push(new Paragraph({
      spacing: { before: 200, after: 120 },
      children: [new TextRun({
        text,
        bold: true,
        underline: { type: UnderlineType.SINGLE },
        font: FONT_NAME,
        size: 13 * 2,
      })],
    }));
  }

  // ── Text Block ──
  drawTextBlock(text: string, opts?: DrawTextOptions): void {
    const alignment = opts?.align === 'center' ? AlignmentType.CENTER
      : opts?.align === 'right' ? AlignmentType.RIGHT
      : AlignmentType.LEFT;

    this.children.push(new Paragraph({
      alignment,
      spacing: { after: 60 },
      children: [new TextRun({
        text: text || '',
        bold: opts?.bold,
        italics: opts?.italic,
        underline: opts?.underline ? { type: UnderlineType.SINGLE } : undefined,
        font: FONT_NAME,
        size: (opts?.fontSize || FONT_SIZE_DEFAULT) * 2,
      })],
    }));
  }

  // ── Rich Text Block (multiple segments) ──
  drawRichTextBlock(segments: TextSegment[]): void {
    this.children.push(new Paragraph({
      spacing: { after: 60 },
      children: segments.map(seg => new TextRun({
        text: seg.text || '',
        bold: seg.bold,
        italics: seg.italic,
        font: FONT_NAME,
        size: FONT_SIZE_DEFAULT * 2,
      })),
    }));
  }

  // ── Simple Row (label-value table row) ──
  drawSimpleRow(label: string, value?: string): void {
    this.children.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      rows: [new TableRow({
        children: [
          new TableCell({
            width: { size: 40, type: WidthType.PERCENTAGE },
            borders: { top: TABLE_BORDER, bottom: TABLE_BORDER, left: TABLE_BORDER, right: TABLE_BORDER },
            shading: { type: ShadingType.SOLID, color: 'E8F0FE' },
            children: [new Paragraph({
              children: [new TextRun({ text: label || '', bold: true, font: FONT_NAME, size: FONT_SIZE_DEFAULT * 2 })],
            })],
          }),
          new TableCell({
            width: { size: 60, type: WidthType.PERCENTAGE },
            borders: { top: TABLE_BORDER, bottom: TABLE_BORDER, left: TABLE_BORDER, right: TABLE_BORDER },
            children: [new Paragraph({
              children: [new TextRun({ text: value || 'N/A', font: FONT_NAME, size: FONT_SIZE_DEFAULT * 2 })],
            })],
          }),
        ],
      })],
    }));
  }

  // ── Data Table (multi-column with headers) ──
  drawDataTable(headers: string[], rows: string[][]): void {
    const headerRow = new TableRow({
      children: headers.map(h => new TableCell({
        borders: { top: TABLE_BORDER, bottom: TABLE_BORDER, left: TABLE_BORDER, right: TABLE_BORDER },
        shading: { type: ShadingType.SOLID, color: HEADER_COLOR },
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: h, bold: true, color: 'FFFFFF', font: FONT_NAME, size: 10 * 2 })],
        })],
      })),
    });

    const dataRows = rows.map(row => new TableRow({
      children: row.map(cell => new TableCell({
        borders: { top: TABLE_BORDER, bottom: TABLE_BORDER, left: TABLE_BORDER, right: TABLE_BORDER },
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: cell || '-', font: FONT_NAME, size: 10 * 2 })],
        })],
      })),
    }));

    this.children.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      rows: [headerRow, ...dataRows],
    }));
  }

  // ── TOC Row ──
  drawTOCRow(label: string, _ref: string): void {
    this.children.push(new Paragraph({
      spacing: { after: 40 },
      tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX, leader: LeaderType.DOT }],
      children: [
        new TextRun({ text: label, font: FONT_NAME, size: FONT_SIZE_DEFAULT * 2 }),
        new TextRun({ children: [new Tab()] }),
        new TextRun({ text: '', font: FONT_NAME, size: FONT_SIZE_DEFAULT * 2 }),
      ],
    }));
  }

  // ── Signature Block ──
  drawSignatureBlock(items: SignatureItem[]): void {
    for (const item of items) {
      this.children.push(new Paragraph({
        alignment: AlignmentType.RIGHT,
        spacing: { after: 40 },
        children: [new TextRun({
          text: item.text || '',
          bold: item.bold,
          italics: item.italic,
          font: FONT_NAME,
          size: FONT_SIZE_DEFAULT * 2,
        })],
      }));
    }
  }

  // ── Image Block ──
  async drawImageBlock(imageBytes: Uint8Array, opts?: { maxWidth?: number; maxHeight?: number; centered?: boolean }): Promise<void> {
    if (!imageBytes || imageBytes.length === 0) return;
    const maxW = opts?.maxWidth || 500;
    const maxH = opts?.maxHeight || 300;

    this.children.push(new Paragraph({
      alignment: opts?.centered ? AlignmentType.CENTER : AlignmentType.LEFT,
      spacing: { after: 120 },
      children: [new ImageRun({
        data: imageBytes,
        transformation: { width: maxW, height: maxH },
        type: 'png',
      })],
    }));
  }

  // ── Image Pair (side by side) ──
  async drawImagePair(
    img1Bytes: Uint8Array, caption1: string,
    img2Bytes: Uint8Array | null, caption2: string,
  ): Promise<void> {
    const imgW = 250;
    const imgH = 180;

    const cells: TableCell[] = [];

    // Image 1
    const img1Children: (Paragraph)[] = [];
    if (img1Bytes && img1Bytes.length > 0) {
      img1Children.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new ImageRun({ data: img1Bytes, transformation: { width: imgW, height: imgH }, type: 'png' })],
      }));
    }
    img1Children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: caption1, italics: true, font: FONT_NAME, size: 9 * 2 })],
    }));
    cells.push(new TableCell({
      width: { size: 50, type: WidthType.PERCENTAGE },
      borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER },
      children: img1Children,
    }));

    // Image 2
    const img2Children: (Paragraph)[] = [];
    if (img2Bytes && img2Bytes.length > 0) {
      img2Children.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new ImageRun({ data: img2Bytes, transformation: { width: imgW, height: imgH }, type: 'png' })],
      }));
    }
    img2Children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: caption2 || '', italics: true, font: FONT_NAME, size: 9 * 2 })],
    }));
    cells.push(new TableCell({
      width: { size: 50, type: WidthType.PERCENTAGE },
      borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER },
      children: img2Children,
    }));

    this.children.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [new TableRow({ children: cells })],
    }));
  }

  // ── Build and return Blob ──
  async toBlob(): Promise<Blob> {
    const sections: any[] = [];

    // Build header with letterhead if available
    let defaultHeader: Header | undefined;
    if (this.letterheadBytes) {
      defaultHeader = new Header({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new ImageRun({
            data: this.letterheadBytes,
            transformation: { width: 595, height: 80 },
            type: 'png',
          })],
        })],
      });
    }

    sections.push({
      properties: {
        page: {
          size: { width: convertInchesToTwip(8.27), height: convertInchesToTwip(11.69) }, // A4
          margin: {
            top: convertInchesToTwip(1.17),   // ~84pt
            bottom: convertInchesToTwip(1.11), // ~80pt
            left: convertInchesToTwip(0.75),   // ~54pt
            right: convertInchesToTwip(0.75),  // ~54pt
          },
        },
      },
      headers: defaultHeader ? { default: defaultHeader } : undefined,
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({ text: 'Page ', font: FONT_NAME, size: 9 * 2 }),
              new TextRun({ children: [PageNumber.CURRENT], font: FONT_NAME, size: 9 * 2 }),
            ],
          })],
        }),
      },
      children: this.children,
    });

    const doc = new Document({ sections });
    const buffer = await Packer.toBuffer(doc);
    return new Blob([new Uint8Array(buffer)], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  }
}
