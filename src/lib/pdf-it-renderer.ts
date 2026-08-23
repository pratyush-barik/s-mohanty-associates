import { PDFDocument, PDFPage, PDFEmbeddedPage, StandardFonts, rgb } from 'pdf-lib';
import { formatIndianCurrency, rupeesInWords } from './numberToWords';

function hexToRgb(hex: string) {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16) / 255;
  const g = parseInt(h.substring(2, 4), 16) / 255;
  const b = parseInt(h.substring(4, 6), 16) / 255;
  return rgb(r, g, b);
}

const LBL_BG = '#DBE6F0';

const parseNum = (val: string | number): number => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const cleaned = val.toString().replace(/[^0-9.]/g, '');
  return parseFloat(cleaned) || 0;
};

export interface ValuationFloorRow {
  name: string;
  plinthArea: string;
  roofHeight: string;
  age: string;
  ratePerSqft: string;
  replacementCost: number;
  depAmt: number;
  netValue: number;
}

export interface ExtraItem {
  description: string;
  amount: string;
}

export interface IncomeTaxFieldsForPDF {
  propertyType: string;
  ownerName: string;
  propertyDescription: string;
  refNo: string;
  valuationDate: string;
  inspectionDate: string;
  reportDate: string;
  identifiedBy: string;
  valuationPlace?: string;
  place?: string;
  ownerAddress: string;
  ownershipType: string;
  briefDescriptionLines: string[];
  locationDetailsLines: string[];
  surveyPlotNoLines: string[];
  areaType: string;
  classOfLocality: string;
  civicAmenitiesDistance: string;
  landArea: string;
  landAreaUnit: string;
  landShape: string;
  landLevel: string;
  roadAccess: string;
  landTenure: string;
  leaseDetails: string;
  restrictiveCovenant: string;
  easements: string;
  developmentContribution: string;
  plansAttached: string;
  technicalDetails: string;
  tenancyStatus: string;
  tenancyPortionDetails: string;
  fsi: string;
  tenantName: string;
  tenantPortion: string;
  tenantRent: string;
  tenantGrossAmount: string;
  relatedOccupants: string;
  fixtures: string;
  waterElectricCharges: string;
  pumpMaintenance: string;
  commonElectricity: string;
  propertyTax: string;
  buildingInsured: string;
  landlordTenantDispute: string;
  standardRent: string;
  saleInstances: string;
  landRatePerUnit: string;
  landRateUnit: string;
  landRateSecondaryPerUnit?: string;
  landRateSecondaryUnit?: string;
  landRateMode?: 'auto' | 'custom';
  landRateCustomText?: string;
  landRate: string;
  totalLandValue: string;
  landRateBasis: string;
  constructionStartYear: string;
  constructionEndYear: string;
  constructionMethod: string;
  contractAgreements: string;
  materialRates: string;
  buildingApproval: string;
  valuationYear: string;
  completionYear: string;
  valuationBullets: string[];
  depreciationPct: string;
  valuationCalcDate: string;
  hasRemarks: boolean;
  remarks: string;
  propertyImages: string[];
  locationMapImage: string;
  locationSearchQuery?: string;
  latitude?: string;
  longitude?: string;
  ciiTableImage: string;
  bdaMapImage: string;
  benchmarkImage: string;
  sketchMapImages: string[];
  extraItems: ExtraItem[];
  showLandAnnexure?: boolean;
  isValuationDateReverseCalc?: boolean;
  plotAreaLines?: string[];
  landDimension?: string;
  easementAttached?: boolean;
  easementImages?: string[];
  fsiPermissible?: string;
  fsiUtilized?: string;
  saleInstancesLines?: string[];
  annexureEnabled?: boolean;
  annexures?: {
    id: string;
    label: string;
    title?: string;
    excelFileUrl: string;
    excelFileName: string;
    parsedData?: {
      headers: string[];
      rows: string[][];
      allRows?: string[][];
      merges?: { sr: number; sc: number; er: number; ec: number }[];
      colWidths?: number[];
    };
  }[];
  plinthAreaConsidered: string;
  techFloors: string;
  techFloorHeight: string;
  techPlinthAreaActual: string;
  techPlinthAreaApproved: string;
  showPlinthActual?: boolean;
  showPlinthApproved?: boolean;
  techYearConstruction: string;
  techYearCompletion?: string;
  techFutureLife: string;
  techConstructionType: string;
  techFoundation: string;
  techWallsBasement: string;
  techWallsGround: string;
  annexMainBuilding: string;
  annexAnnexes: string;
  annexServantsQuarters: string;
  annexGarage: string;
  annexPumpHouse: string;
  techPartitions: string;
  techDoorsWindows: string;
  techFlooring: string;
  techFinishing: string;
  techRoofing: string;
  techArchitecturalFeatures: string;
  techWiring: string;
  techFittings: string;
  techSanitary?: string;
  techSanitaryLines: string[];
  techCompoundWall: string;
  techCompoundWallType?: string;
  techLifts: string;
  techOverheadTank: string;
  techPump: string;
  techUndergroundSump: string;
  techRoadsPaving: string;
  techSewageDisposal: string;
}

const UNIT_SQFT_MAP: Record<string, number> = {
  'DEC': 435.6,
  'ACRE': 43560,
  'SQFT': 1,
  'SQ.FT.': 1,
  'SQMT': 10.7639,
  'SQ.MTR.': 10.7639,
  'GUNTHA': 1089,
  'CENT': 435.6,
};

export const calculateLandValue = (
  areaStr: string,
  areaUnit: string,
  rateStr: string,
  rateUnit: string
): number => {
  const areaNum = parseFloat(areaStr?.replace(/[^0-9.]/g, '') || '');
  const rateNum = parseFloat(rateStr || '');
  if (!areaNum || isNaN(areaNum) || !rateNum || isNaN(rateNum)) return 0;

  const areaSqft = areaNum * (UNIT_SQFT_MAP[areaUnit?.toUpperCase()] || 435.6);
  const rateUnitSqft = UNIT_SQFT_MAP[rateUnit?.toUpperCase()] || 435.6;
  const areaInRateUnits = areaSqft / rateUnitSqft;

  return Math.round(areaInRateUnits * rateNum);
};

export async function generateIncomeTaxPDF(
  fields: IncomeTaxFieldsForPDF,
  computedLandValue: number,
  computedFloorRows: ValuationFloorRow[],
  computedBuildingValue: number,
  computedExtraTotal: number,
  computedTotalProperty: number,
  isLandOnly: boolean
): Promise<Blob | null> {
  const A4_W = 595.28;
  const A4_H = 841.89;
  const ML = 54; const MR = 54; const MT = 102; const MB = 85;
  const CW = A4_W - ML - MR;
  const LINE_H = 1.25;

  const doc = await PDFDocument.create();
  const fontR = await doc.embedFont(StandardFonts.TimesRoman);
  const fontB = await doc.embedFont(StandardFonts.TimesRomanBold);
  const fontI = await doc.embedFont(StandardFonts.TimesRomanItalic);
  const fontBI = await doc.embedFont(StandardFonts.TimesRomanBoldItalic);

  const fetchBytes = async (url: string | undefined): Promise<Uint8Array | null> => {
    if (!url) return null;
    try {
      const resp = await fetch(url);
      const buf = await resp.arrayBuffer();
      return new Uint8Array(buf);
    } catch { return null; }
  };

  // Fetch letterhead & all appendix images upfront
  const propImgs = (fields.propertyImages || []).filter(Boolean);
  const easementImgs = (fields.easementAttached && fields.easementImages) ? fields.easementImages.filter(Boolean) : [];
  const allImageUrls = [
    '/templates/letterhead.png',
    ...propImgs,
    ...easementImgs,
    ...(fields.locationMapImage ? [fields.locationMapImage] : []),
    ...(fields.ciiTableImage ? [fields.ciiTableImage] : []),
    ...(fields.bdaMapImage ? [fields.bdaMapImage] : []),
    ...(fields.benchmarkImage ? [fields.benchmarkImage] : []),
    ...(fields.sketchMapImages && fields.sketchMapImages.length > 0 ? fields.sketchMapImages : []),
  ];
  const allImageBytes = await Promise.all(allImageUrls.map(u => fetchBytes(u)));
  const letterheadBytes = allImageBytes[0];
  let imgIdx = 1;
  const propImageBytes = allImageBytes.slice(imgIdx, imgIdx + propImgs.length).filter(Boolean) as Uint8Array[];
  imgIdx += propImgs.length;
  const easementImageBytes = easementImgs.length > 0 ? (allImageBytes.slice(imgIdx, imgIdx + easementImgs.length).filter(Boolean) as Uint8Array[]) : [];
  if (easementImgs.length > 0) imgIdx += easementImgs.length;
  const locationBytes = fields.locationMapImage ? allImageBytes[imgIdx++] : null;
  const ciiBytes = fields.ciiTableImage ? allImageBytes[imgIdx++] : null;
  const bdaBytes = fields.bdaMapImage ? allImageBytes[imgIdx++] : null;
  const benchmarkBytes = fields.benchmarkImage ? allImageBytes[imgIdx++] : null;
  const sketchBytesList = fields.sketchMapImages?.length ? allImageBytes.slice(imgIdx, imgIdx + fields.sketchMapImages.length) : null;
  if (fields.sketchMapImages?.length) imgIdx += fields.sketchMapImages.length;

  // Build the letterhead as a Form XObject (embedPdf+drawPage = /Subtype/Form)
  // so PDF-to-Word converters (e.g. ilovepdf) treat it as a background/template layer
  // rather than an inline content image, giving consistent letterhead in exported DOCX.
  let letterheadForm: PDFEmbeddedPage | null = null;
  if (letterheadBytes && letterheadBytes.length > 0) {
    try {
      const tmpDoc = await PDFDocument.create();
      let tmpImg = null;
      try { tmpImg = await tmpDoc.embedPng(letterheadBytes); } catch { /* try jpg */ }
      if (!tmpImg) {
        try { tmpImg = await tmpDoc.embedJpg(letterheadBytes); } catch { /* ignore */ }
      }
      if (tmpImg) {
        const tmpPage = tmpDoc.addPage([A4_W, A4_H]);
        tmpPage.drawImage(tmpImg, { x: 0, y: 0, width: A4_W, height: A4_H });
        const tmpBytes = await tmpDoc.save();
        [letterheadForm] = await doc.embedPdf(tmpBytes, [0]);
      }
    } catch {
      letterheadForm = null;
    }
  }

  const drawBackground = (p: PDFPage) => {
    if (letterheadForm) {
      p.drawPage(letterheadForm, { x: 0, y: 0, width: A4_W, height: A4_H });
    }
  };

  let page = doc.addPage([A4_W, A4_H]);
  drawBackground(page);
  let cy = MT; // cursor from top

  const pdfY = (topDown: number) => A4_H - topDown;
  const avail = () => A4_H - MB - cy;

  const addPageNum = (p: any, num: number) => {
    const numStr = String(num);
    const tw = fontR.widthOfTextAtSize(numStr, 12);
    p.drawText(numStr, { x: A4_W - MR - tw, y: MB / 2, size: 12, font: fontR, color: rgb(0, 0, 0) });
  };

  let pageNum = 1;

  const ensureSpace = (h: number) => {
    if (avail() < h) {
      addPageNum(page, pageNum);
      pageNum++;
      page = doc.addPage([A4_W, A4_H]);
      drawBackground(page);
      cy = MT;
    }
  };

  const cleanText = (text: string): string => {
    let clean = String(text ?? '');
    
    // Decode HTML entities
    clean = clean
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&#039;/gi, "'")
      .replace(/&#39;/gi, "'")
      .replace(/&nbsp;/gi, ' ')
      .replace(/&ndash;/gi, '-')
      .replace(/&mdash;/gi, '--')
      .replace(/&hellip;/gi, '...');

    return clean
      .replace(/[\r\n\t]/g, ' ')                          // newlines/tabs -> space
      .replace(/[\u2023\u25E6\u2043\u2219\u25CF]/g, '•') // other bullet variants -> standard bullet •
      .replace(/[\u2018\u2019\u201A\u201B\u2032\u0060\u00B4]/g, "'") // smart single quotes / primes / feet sign -> '
      .replace(/[\u201C\u201D\u201E\u201F\u2033]/g, '"') // smart double quotes / double primes / inch sign -> "
      .replace(/[\u2013\u2014\u2015\u2212]/g, '-')       // en-dash, em-dash, minus -> -
      .replace(/\u2026/g, '...')                          // ellipsis
      .replace(/\u20B9/g, 'Rs.')                          // rupee sign
      .replace(/\u00B0/g, ' deg')                         // degree sign
      .replace(/\u00B2/g, ' sq')                          // squared
      .replace(/\u00B3/g, ' cu')                          // cubed
      .replace(/\u00BC/g, ' 1/4')                         // 1/4
      .replace(/\u00BD/g, ' 1/2')                         // 1/2
      .replace(/\u00BE/g, ' 3/4')                         // 3/4
      .replace(/[\u00A0\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g, ' ') // non-breaking and special spaces -> regular space
      .replace(/[^\x20-\x7E\u2022]/g, '');                      // allow ASCII + bullet •
  };

  // Text helpers
  const wrapText = (text: string, maxW: number, font: any, fs: number): string[] => {
    const strText = cleanText(text);
    if (!strText) return [''];
    const words = strText.split(/\s+/);
    const lines: string[] = [];
    let cur = '';
    for (const w of words) {
      if (!w) continue;
      const test = cur ? `${cur} ${w}` : w;
      if (font.widthOfTextAtSize(test, fs) > maxW && cur) {
        lines.push(cur);
        cur = w;
      } else {
        cur = test;
      }
    }
    if (cur) lines.push(cur);
    if (lines.length === 0) lines.push('');
    return lines;
  };

  const drawText = (text: string, opts?: { bold?: boolean; italic?: boolean; underline?: boolean; fontSize?: number; align?: 'left' | 'center' | 'right'; x?: number; maxW?: number }) => {
    const fs = opts?.fontSize || 12;
    const lh = fs * LINE_H;
    const font = opts?.bold && opts?.italic ? fontBI : opts?.bold ? fontB : fontR;
    const x = opts?.x ?? ML;
    const maxW = opts?.maxW ?? CW;
    const lines = wrapText(text, maxW, font, fs);
    const totalH = lines.length * lh;
    ensureSpace(totalH);
    for (let i = 0; i < lines.length; i++) {
      let dx = x;
      const tw = font.widthOfTextAtSize(lines[i], fs);
      if (opts?.align === 'center') {
        dx = x + (maxW - tw) / 2;
      } else if (opts?.align === 'right') {
        dx = x + maxW - tw;
      }
      const textY = pdfY(cy + i * lh) - fs * 0.8;
      page.drawText(lines[i], {
        x: dx,
        y: textY,
        size: fs,
        font,
        color: rgb(0, 0, 0),
      });
      if (opts?.underline && lines[i].trim()) {
        const lineY = textY - 2;
        page.drawLine({
          start: { x: dx, y: lineY },
          end: { x: dx + tw, y: lineY },
          thickness: 1,
          color: rgb(0, 0, 0),
        });
      }
    }
    cy += totalH;
  };

  const drawRichParagraph = (
    segments: { text: string; bold?: boolean; italic?: boolean }[],
    opts?: { fontSize?: number; align?: 'left' | 'center'; x?: number; maxW?: number }
  ) => {
    const fs = opts?.fontSize || 11;
    const lh = fs * LINE_H;
    const x = opts?.x ?? ML;
    const maxW = opts?.maxW ?? CW;

    interface Token {
      word: string;
      font: any;
      width: number;
    }

    const tokens: Token[] = [];
    for (const seg of segments) {
      const font = seg.bold && seg.italic ? fontBI : seg.bold ? fontB : seg.italic ? fontI : fontR;
      const cleanSeg = cleanText(seg.text);
      const words = cleanSeg.split(/(\s+)/);
      for (const w of words) {
        if (!w) continue;
        tokens.push({
          word: w,
          font,
          width: font.widthOfTextAtSize(w, fs),
        });
      }
    }

    const lines: Token[][] = [];
    let curLine: Token[] = [];
    let curW = 0;

    for (const tok of tokens) {
      if (tok.word === '\n') {
        lines.push(curLine);
        curLine = [];
        curW = 0;
        continue;
      }
      if (curW + tok.width > maxW && curLine.length > 0 && tok.word.trim()) {
        lines.push(curLine);
        curLine = [tok];
        curW = tok.width;
      } else {
        curLine.push(tok);
        curW += tok.width;
      }
    }
    if (curLine.length > 0) {
      lines.push(curLine);
    }

    const totalH = lines.length * lh;
    ensureSpace(totalH);

    for (let i = 0; i < lines.length; i++) {
      const lineTokens = lines[i];
      let dx = x;
      if (opts?.align === 'center') {
        const lineW = lineTokens.reduce((sum, t) => sum + t.width, 0);
        dx = x + (maxW - lineW) / 2;
      }
      for (const tok of lineTokens) {
        page.drawText(tok.word, {
          x: dx,
          y: pdfY(cy + i * lh) - fs * 0.8,
          size: fs,
          font: tok.font,
          color: rgb(0, 0, 0),
        });
        dx += tok.width;
      }
    }
    cy += totalH;
  };

  const advanceCursor = (pts: number) => { cy += pts; };

  // Helper to format report date as DD/MM/YYYY
  const formatReportDate = (dStr: string): string => {
    if (!dStr || !dStr.trim()) return '';
    const trimmed = dStr.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const [y, m, d] = trimmed.split('-');
      return `${d}/${m}/${y}`;
    }
    if (/^\d{2}[.-/]\d{2}[.-/]\d{4}$/.test(trimmed)) {
      return trimmed.replace(/[-.]/g, '/');
    }
    const parts = trimmed.split(/[-/.]/);
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        const y = parts[0];
        const m = parts[1].padStart(2, '0');
        const d = parts[2].padStart(2, '0');
        return `${d}/${m}/${y}`;
      } else if (parts[2].length === 4) {
        const d = parts[0].padStart(2, '0');
        const m = parts[1].padStart(2, '0');
        const y = parts[2];
        return `${d}/${m}/${y}`;
      }
    }
    return trimmed;
  };

  const formatDateDDMMYYYY = (dStr: string): string => formatReportDate(dStr);

  const formatLandAreaWithSqft = (rawLine: string): string => {
    if (!rawLine || !rawLine.trim()) return '';
    let str = rawLine.trim();

    if (/\bI\.E\.\s*\d+(?:\.\d+)?\s*SFT/i.test(str)) {
      return str;
    }

    const match = str.match(/^(?:AC\.)?(\d+(?:\.\d+)?)\s*(ACRE|ACRES|DEC|DECIMAL|SQMT|SQ\.MTR\.|SQFT|SQ\.FT\.|SFT)?(.*)$/i);
    if (!match) return str;

    const numVal = parseFloat(match[1]);
    if (isNaN(numVal) || numVal <= 0) return str;

    let unit = (match[2] || 'DEC').toUpperCase();
    const restStr = match[3] ? match[3].trim() : '';

    let sqftVal = 0;
    if (unit.includes('ACRE') || str.toUpperCase().startsWith('AC.')) {
      sqftVal = numVal * 43560;
    } else if (unit.includes('SQMT') || unit.includes('SQ.M')) {
      sqftVal = numVal * 10.7639;
    } else if (unit.includes('SQFT') || unit.includes('SQ.FT') || unit === 'SFT') {
      sqftVal = numVal;
    } else {
      sqftVal = numVal * 435.6;
    }

    const formattedSqft = sqftVal.toFixed(2);

    if (restStr) {
      if (/^\(AS PER [^)]+\)$/i.test(restStr)) {
        const mainPart = match[0].replace(restStr, '').trim();
        return `${mainPart} I.E. ${formattedSqft} SFT ${restStr}`;
      }
      return `${str} I.E. ${formattedSqft} SFT`;
    }

    return `${str} I.E. ${formattedSqft} SFT`;
  };

  // Render bullet lines: bullet-prefixed for entries, non-bulleted if single entry, 'NOT APPLICABLE' if none entered
  const renderBulletLines = (lines: string | string[]): string => {
    if (typeof lines === 'string') {
      const s = lines.trim();
      if (!s) return 'NOT APPLICABLE';
      const splitLines = s.split('\n').map(l => l.trim()).filter(Boolean);
      if (splitLines.length === 0) return 'NOT APPLICABLE';
      if (splitLines.length === 1) {
        return splitLines[0].replace(/^[-*•]\s*/, '');
      }
      return splitLines.map(l => `• ${l.replace(/^[-*•]\s*/, '')}`).join('\n');
    }
    const filled = lines.map(l => l?.trim()).filter(Boolean) as string[];
    if (filled.length === 0) return 'NOT APPLICABLE';
    if (filled.length === 1) {
      return filled[0].replace(/^[-*•]\s*/, '');
    }
    return filled.map(l => `• ${l.replace(/^[-*•]\s*/, '')}`).join('\n');
  };

  interface TextLineInfo {
    text: string;
    isNewParagraph: boolean;
    isBulletStart: boolean;
    bulletSymbol?: string;
    indentX: number;
    isBold?: boolean;
  }

  // Render multi-line answer in Q-row (supports \n line-breaks in answer text with bullet hanging indent & paragraph gap)
  const wrapMultiLineParagraphs = (text: string, maxW: number, font: any, fs: number): TextLineInfo[] => {
    const rawParagraphs = String(text ?? '').split('\n');
    const result: TextLineInfo[] = [];

    for (let pIdx = 0; pIdx < rawParagraphs.length; pIdx++) {
      const para = rawParagraphs[pIdx].trim();
      if (!para) continue;

      const isBullet = /^•\s*/.test(para) || /^[-*]\s*/.test(para);
      const isNewParagraph = result.length > 0;

      if (isBullet) {
        const cleanPara = para.replace(/^[-*•]\s*/, '');
        const bulletIndent = 14;
        const availW = maxW - bulletIndent;
        const wrapped = wrapText(cleanPara, availW, font, fs);

        for (let lIdx = 0; lIdx < wrapped.length; lIdx++) {
          result.push({
            text: wrapped[lIdx],
            isNewParagraph: lIdx === 0 && isNewParagraph,
            isBulletStart: lIdx === 0,
            bulletSymbol: '•',
            indentX: bulletIndent,
          });
        }
      } else {
        const isBoldLine = para.includes('CONSIDERED FOR VALUATION PURPOSE') || para.includes('PLINTH AREA IS CONSIDERED');
        const targetFont = isBoldLine ? fontB : font;
        const wrapped = wrapText(para, maxW, targetFont, fs);
        for (let lIdx = 0; lIdx < wrapped.length; lIdx++) {
          result.push({
            text: wrapped[lIdx],
            isNewParagraph: lIdx === 0 && isNewParagraph,
            isBulletStart: false,
            indentX: 0,
            isBold: isBoldLine,
          });
        }
      }
    }

    if (result.length === 0) {
      result.push({ text: 'NOT APPLICABLE', isNewParagraph: false, isBulletStart: false, indentX: 0 });
    }

    return result;
  };

  // Table cell primitive
  const drawCell = (x: number, topY: number, w: number, h: number, text: string, opts?: { bold?: boolean; fontSize?: number; align?: 'left' | 'center' | 'right'; vAlign?: 'top' | 'center' | 'middle'; fillColor?: string; bgOpacity?: number }) => {
    const fs = opts?.fontSize || 12;
    const font = opts?.bold ? fontB : fontR;
    if (opts?.fillColor) {
      page.drawRectangle({
        x,
        y: pdfY(topY) - h,
        width: w,
        height: h,
        color: hexToRgb(opts.fillColor),
        opacity: opts.bgOpacity ?? 1,
      });
    }
    // Border
    page.drawRectangle({
      x,
      y: pdfY(topY) - h,
      width: w,
      height: h,
      borderColor: rgb(0, 0, 0),
      borderWidth: 0.5,
    });
    // Text
    const padX = 4;
    const padY = 4;
    const textW = w - padX * 2;
    const lines = wrapText(text, textW, font, fs);
    const totalTextH = lines.length * fs * LINE_H;
    // Vertical start offset
    let startPadY = padY;
    if (opts?.vAlign === 'center' || opts?.vAlign === 'middle') {
      startPadY = (h - totalTextH) / 2;
      if (startPadY < padY) startPadY = padY;
    }
    for (let i = 0; i < lines.length; i++) {
      let dx = x + padX;
      if (opts?.align === 'center') {
        const tw = font.widthOfTextAtSize(lines[i], fs);
        dx = x + (w - tw) / 2;
      } else if (opts?.align === 'right') {
        const tw = font.widthOfTextAtSize(lines[i], fs);
        dx = x + w - padX - tw;
      }
      page.drawText(lines[i], {
        x: dx,
        y: pdfY(topY + startPadY + i * fs * LINE_H) - fs * 0.8,
        size: fs,
        font,
        color: rgb(0, 0, 0),
      });
    }
  };

  const cellHeight = (text: string, w: number, opts?: { bold?: boolean; fontSize?: number }) => {
    const fs = opts?.fontSize || 12;
    const font = opts?.bold ? fontB : fontR;
    const lines = wrapText(text, w - 8, font, fs);
    return Math.max(lines.length * fs * LINE_H + 6, fs * LINE_H + 6);
  };

  // Questionnaire table row (3 cols: QNo | Question | Answer)
  const qColW = [CW * 0.06, CW * 0.46, CW * 0.48];
  const PARA_GAP = 6;

  const drawQRow = (qNo: string, question: string, answer: string, opts?: { qBold?: boolean; headerRow?: boolean }) => {
    const fs = 11;
    const lh = fs * LINE_H;
    const h1 = cellHeight(qNo, qColW[0], { bold: true, fontSize: fs });
    const h2 = cellHeight(question, qColW[1], { fontSize: fs });

    const answerLineInfos = wrapMultiLineParagraphs(answer, qColW[2] - 12, fontR, fs);
    let totalAnsH = 0;
    for (let i = 0; i < answerLineInfos.length; i++) {
      totalAnsH += lh;
      if (answerLineInfos[i].isNewParagraph) {
        totalAnsH += PARA_GAP;
      }
    }
    const h3 = Math.max(totalAnsH + 8, lh + 8);
    const rowH = Math.max(h1, h2, h3);
    ensureSpace(rowH);

    let x = ML;
    drawCell(x, cy, qColW[0], rowH, qNo, { bold: true, fontSize: fs, align: 'center', fillColor: LBL_BG, bgOpacity: 0.5 });
    x += qColW[0];
    drawCell(x, cy, qColW[1], rowH, question, { fontSize: fs, bold: opts?.headerRow, fillColor: LBL_BG, bgOpacity: 0.5 });
    x += qColW[1];

    page.drawRectangle({
      x,
      y: pdfY(cy) - rowH,
      width: qColW[2],
      height: rowH,
      color: hexToRgb(LBL_BG),
      opacity: 0.5,
      borderColor: rgb(0, 0, 0),
      borderWidth: 0.5,
    });
    const padX = 5;
    const padY = 4;
    let lineY = cy + padY;

    for (let i = 0; i < answerLineInfos.length; i++) {
      const info = answerLineInfos[i];
      if (info.isNewParagraph) {
        lineY += PARA_GAP;
      }

      if (info.isBulletStart && info.bulletSymbol) {
        page.drawText(info.bulletSymbol, {
          x: x + padX,
          y: pdfY(lineY) - fs * 0.8,
          size: fs,
          font: fontR,
          color: rgb(0, 0, 0),
        });
      }

      const targetFont = info.isBold ? fontB : fontR;
      page.drawText(info.text, {
        x: x + padX + info.indentX,
        y: pdfY(lineY) - fs * 0.8,
        size: fs,
        font: targetFont,
        color: rgb(0, 0, 0),
      });
      lineY += lh;
    }
    cy += rowH;
  };

  const drawQHeader = (title: string) => {
    const fs = 12;
    const rowH = fs * LINE_H + 6;
    ensureSpace(rowH + 50); // Require space for header + at least one row
    // Spanning full table width with merged header
    drawCell(ML, cy, CW, rowH, title, { bold: true, fontSize: fs, align: 'center', fillColor: LBL_BG, bgOpacity: 0.5 });
    cy += rowH;
  };

  const drawQRowMulti = (qNo: string, items: { q: string, a: string }[], opts?: { drawSubBorders?: boolean }) => {
    const drawSubBorders = opts?.drawSubBorders ?? false;
    const fs = 11;
    const lh = fs * LINE_H;
    const h1 = cellHeight(qNo, qColW[0], { bold: true, fontSize: fs });
    let totalH = 0;
    const padY = drawSubBorders ? 4 : 2;
    const subHeights = items.map(item => {
      const qLineInfos = wrapMultiLineParagraphs(item.q, qColW[1] - 10, fontR, fs);
      const aLineInfos = wrapMultiLineParagraphs(item.a, qColW[2] - 10, fontR, fs);
      let qH = 0;
      qLineInfos.forEach(l => qH += lh + (l.isNewParagraph ? PARA_GAP : 0));
      let aH = 0;
      aLineInfos.forEach(l => aH += lh + (l.isNewParagraph ? PARA_GAP : 0));
      const rowH = Math.max(qH + padY * 2, aH + padY * 2, lh + padY * 2);
      return { rowH, qLineInfos, aLineInfos };
    });
    subHeights.forEach(sh => totalH += sh.rowH);
    totalH = Math.max(totalH, h1);
    
    ensureSpace(totalH);
    const startY = cy;
    
    page.drawRectangle({ x: ML, y: pdfY(startY) - totalH, width: qColW[0], height: totalH, color: hexToRgb(LBL_BG), opacity: 0.5, borderColor: rgb(0,0,0), borderWidth: 0.5 });
    page.drawRectangle({ x: ML + qColW[0], y: pdfY(startY) - totalH, width: qColW[1], height: totalH, color: hexToRgb(LBL_BG), opacity: 0.5, borderColor: rgb(0,0,0), borderWidth: 0.5 });
    page.drawRectangle({ x: ML + qColW[0] + qColW[1], y: pdfY(startY) - totalH, width: qColW[2], height: totalH, color: hexToRgb(LBL_BG), opacity: 0.5, borderColor: rgb(0,0,0), borderWidth: 0.5 });

    const tw = fontB.widthOfTextAtSize(qNo, fs);
    page.drawText(qNo, { x: ML + (qColW[0] - tw) / 2, y: pdfY(startY + 3 + (h1 - fs * LINE_H) / 2) - fs * 0.8, size: fs, font: fontB, color: rgb(0,0,0) });

    let currY = startY;
    const padX = 5;
    items.forEach((item, idx) => {
      const { rowH, qLineInfos, aLineInfos } = subHeights[idx];
      if (idx > 0 && drawSubBorders) {
        page.drawLine({ start: { x: ML + qColW[0], y: pdfY(currY) }, end: { x: ML + CW, y: pdfY(currY) }, thickness: 0.5, color: rgb(0,0,0) });
      }
      let qLineY = currY + padY;
      for (let i = 0; i < qLineInfos.length; i++) {
        const info = qLineInfos[i];
        if (info.isNewParagraph) qLineY += PARA_GAP;
        if (info.isBulletStart && info.bulletSymbol) {
          page.drawText(info.bulletSymbol, { x: ML + qColW[0] + padX, y: pdfY(qLineY) - fs * 0.8, size: fs, font: fontR, color: rgb(0,0,0) });
        }
        const targetFont = info.isBold ? fontB : fontR;
        page.drawText(info.text, { x: ML + qColW[0] + padX + info.indentX, y: pdfY(qLineY) - fs * 0.8, size: fs, font: targetFont, color: rgb(0,0,0) });
        qLineY += lh;
      }
      let aLineY = currY + padY;
      for (let i = 0; i < aLineInfos.length; i++) {
        const info = aLineInfos[i];
        if (info.isNewParagraph) aLineY += PARA_GAP;
        if (info.isBulletStart && info.bulletSymbol) {
          page.drawText(info.bulletSymbol, { x: ML + qColW[0] + qColW[1] + padX, y: pdfY(aLineY) - fs * 0.8, size: fs, font: fontR, color: rgb(0,0,0) });
        }
        const targetFont = info.isBold ? fontB : fontR;
        page.drawText(info.text, { x: ML + qColW[0] + qColW[1] + padX + info.indentX, y: pdfY(aLineY) - fs * 0.8, size: fs, font: targetFont, color: rgb(0,0,0) });
        aLineY += lh;
      }
      currY += rowH;
    });
    cy += totalH;
  };

  // ═══════════════════════════════════════════════════════
  // BLOCK 1 — INNER TITLE BLOCK
  // ═══════════════════════════════════════════════════════
  // Top right ref & date
  if (fields.refNo || fields.reportDate) {
    if (fields.refNo) {
      drawText(`REF NO–${fields.refNo.trim()}`, { bold: true, fontSize: 11, align: 'right' });
    }
    if (fields.reportDate) {
      drawText(`DATE–${formatReportDate(fields.reportDate)}`, { bold: true, fontSize: 11, align: 'right' });
    }
    advanceCursor(10);
  }

  // Centered & Underlined VALUATION REPORT
  const titleStr = 'VALUATION REPORT';
  const titleFs = 14;
  const titleW = fontBI.widthOfTextAtSize(titleStr, titleFs);
  const titleX = ML + (CW - titleW) / 2;
  ensureSpace(titleFs * LINE_H + 12);
  page.drawText(titleStr, {
    x: titleX,
    y: pdfY(cy) - titleFs * 0.8,
    size: titleFs,
    font: fontBI,
    color: rgb(0, 0, 0),
  });
  page.drawLine({
    start: { x: titleX, y: pdfY(cy) - titleFs * 0.8 - 2 },
    end: { x: titleX + titleW, y: pdfY(cy) - titleFs * 0.8 - 2 },
    thickness: 1,
    color: rgb(0, 0, 0),
  });
  cy += titleFs * LINE_H + 8;

  // Property Type & Owner
  const propType = (fields.propertyType || 'RESIDENTIAL LAND & BUILDING').toUpperCase();
  drawText(propType, { bold: true, fontSize: 12, align: 'center' });
  advanceCursor(3);
  drawText('OF', { bold: true, fontSize: 12, align: 'center' });
  advanceCursor(3);
  drawText(fields.ownerName.toUpperCase(), { bold: true, fontSize: 12, align: 'center' });
  advanceCursor(8);

  // Property Description (BEARING KHATA NO: ...)
  if (fields.propertyDescription) {
    let desc = fields.propertyDescription.trim().toUpperCase();
    if (!desc.startsWith('BEARING ') && !desc.startsWith('LAND BEARING ') && !desc.startsWith('PROPERTY BEARING ')) {
      desc = 'BEARING ' + desc;
    }
    drawText(desc, { fontSize: 11, align: 'left' });
    advanceCursor(8);
  }

  // Valuer credentials
  drawText('NAME OF THE VALUER:- ER. SATYAJIT MOHANTY', { bold: true, fontSize: 11 });
  advanceCursor(2);
  drawText('REGISTRATION NO.:- 107/2016-17 of Category-I', { bold: true, fontSize: 11 });
  advanceCursor(12);

  // Section header: PART–I–QUESTIONNAIRE (Centered & Underlined)
  const secStr = 'PART–I–QUESTIONNAIRE';
  const secFs = 13;
  const secW = fontBI.widthOfTextAtSize(secStr, secFs);
  const secX = ML + (CW - secW) / 2;
  ensureSpace(secFs * LINE_H + 12 + 60); // Ensure header + next lines fit
  page.drawText(secStr, {
    x: secX,
    y: pdfY(cy) - secFs * 0.8,
    size: secFs,
    font: fontBI,
    color: rgb(0, 0, 0),
  });
  page.drawLine({
    start: { x: secX, y: pdfY(cy) - secFs * 0.8 - 2 },
    end: { x: secX + secW, y: pdfY(cy) - secFs * 0.8 - 2 },
    thickness: 1,
    color: rgb(0, 0, 0),
  });
  cy += secFs * LINE_H + 8;

  // TABLE A — GENERAL
  drawQHeader('GENERAL');
  drawQRow('01', 'PURPOSE FOR WHICH THE VALUATION IS MADE:', 'TO ASSESS OF CAPITAL GAIN FOR INCOME TAX');
  const valDateSuffix = fields.isValuationDateReverseCalc ? ' (VALUATION AT THAT TIME BY REVERSE CALCULATION METHOD)' : '';
  const fullValuationDate = (fields.valuationDate ? formatDateDDMMYYYY(fields.valuationDate) : '') + valDateSuffix;
  const cleanIdentified = fields.identifiedBy ? fields.identifiedBy.replace(/^\(?D\)?\s*IDENTIFIED BY WHOM:?\s*/i, '').trim() : '';

  const q02Items = [
    { q: '(A) DATE ON WHICH THE VALUATION IS MADE:', a: fullValuationDate || 'NOT APPLICABLE' },
    { q: '(B) DATE OF INSPECTION:', a: fields.inspectionDate ? formatDateDDMMYYYY(fields.inspectionDate) : 'NOT APPLICABLE' },
    { q: '(C) DATE OF VALUATION REPORT:', a: fields.reportDate ? formatDateDDMMYYYY(fields.reportDate) : 'NOT APPLICABLE' },
    { q: '(D) IDENTIFIED BY WHOM:', a: cleanIdentified || 'NOT APPLICABLE' }
  ];
  drawQRowMulti('02', q02Items, { drawSubBorders: true });
  drawQRow('03', 'NAME OF THE OWNER/OWNERS.', fields.ownerName.toUpperCase() + (fields.ownerAddress ? ', ' + fields.ownerAddress.toUpperCase() : ''));
  drawQRow('04', 'IF THE PROPERTY IS UNDER JOINT OWNERSHIP/CO-OWNERSHIP, SHARE OF EACH SUCH OWNER. ARE THE SHARE OF UNDIVIDED?', fields.ownershipType);
  drawQRow('05', 'BRIEF DESCRIPTION OF THE PROPERTY.', renderBulletLines(fields.briefDescriptionLines));
  drawQRow('06', 'LOCATION, STREET, WARD NO.', renderBulletLines(fields.locationDetailsLines));
  drawQRow('07', 'SURVEY/PLOT NO. OF LAND:', renderBulletLines(fields.surveyPlotNoLines));
  drawQRow('08', 'IS THE PROPERTY SITUATED IN (RESIDENTIAL AREA / COMMERCIAL AREA / MIXED AREA / INDUSTRIAL AREA)', `THIS PROPERTY IS COMING UNDER ${fields.areaType}`);
  drawQRow('09', 'CLASSIFICATION OF LOCALITY:', `HIGH/MIDDLE/POOR: THIS PROPERTY IS SITUATED IN A ${fields.classOfLocality} CLASS LOCALITY.`);
  drawQRow('10', 'PROXIMITY TO CIVIC AMENITIES, LIKE SCHOOL, HOSPITAL, OFFICE, MARKET, CINEMA ETC.', `ALL CIVIC AMENITIES LIKE SCHOOL, COLLEGE, HOSPITAL, RAILWAY STATION, MARKET AREA, CINEMAS ARE PRESENT WITHIN ${fields.civicAmenitiesDistance} KMS.`);
  drawQRow('11', 'MEANS AND PROXIMITY TO SURFACE COMMUNICATION BY WHICH THE LOCALITY IS SERVED.', 'THE LOCALITY IS SERVED BY MEANS OF PUBLIC AND PRIVATE TRANSPORT SYSTEM.');
  advanceCursor(6);

  // TABLE B — LAND
  drawQHeader('LAND');
  const q12Question = 'AREA OF THE LAND SUPPORTED BY DOCUMENTARY PROOF, SHAPE, DIMENSIONS AND PHYSICAL FEATURES,\nSHAPE OF THE LAND-\nDIMENSION OF THE PLOT-\nPHYSICAL FEATURES–';
  let q12Answer = 'AREA OF THE PLOT-\n';
  if (fields.plotAreaLines && fields.plotAreaLines.length > 0 && fields.plotAreaLines.some(l => l.trim().length > 0)) {
    q12Answer += fields.plotAreaLines.map(l => formatLandAreaWithSqft(l)).join('\n') + '\n';
  } else if (fields.landArea) {
    q12Answer += formatLandAreaWithSqft(`${fields.landArea} ${fields.landAreaUnit || 'DEC'}`) + '\n';
  }
  q12Answer += `• ${fields.landShape || 'RECTANGULAR SHAPE'}\n`;
  if (fields.landDimension) {
    q12Answer += `• DIMENSION: ${fields.landDimension}\n`;
  }
  q12Answer += `• ${fields.landLevel || 'FLAT AND HIGH LEVEL LAND'}`;
  drawQRow('12', q12Question, q12Answer);

  const cleanRoadAccess = fields.roadAccess ? fields.roadAccess.replace(/^13\s*ROADS,?\s*STREETS\s*OR\s*LANES\s*ON\s*WHICH\s*THE\s*LAND\s*IS\s*ABUTTING\.?\s*/i, '').trim() : '';
  drawQRow('13', 'ROADS, STREETS OR LANES ON WHICH THE LAND IS ABUTTING.', cleanRoadAccess);
  drawQRow('14', 'IS IT FREE HOLD OR LEASE HOLD LAND?', fields.landTenure);
  drawQRow('15', 'IF LEASE HOLD, THE NAME OF LEASER/LESSEE, NATURE OF LEASE, DATES OF COMMENCEMENT AND TERMINATION OF LEASE AND TERMS OF RENEWAL OF LEASE.', fields.leaseDetails);
  drawQRow('16', 'IS THERE ANY RESTRICTIVE COVENANT IN REGARD TO USE OF LAND? IF SO, ATTACH A COPY OF THE COVENANT.', fields.restrictiveCovenant);

  let q17Answer = fields.easements || 'NOT APPLICABLE';
  if (fields.easementAttached) {
    q17Answer = (fields.easements ? fields.easements + ' ' : '') + '(COPIES ATTACHED IN ANNEXURE)';
  }
  drawQRow('17', 'AGREEMENT OF EASEMENTS? IF SO, ATTACH COPIES.', q17Answer);
  drawQRow('18', 'HAS ANY CONTRIBUTION BEEN MADE TOWARDS DEVELOPMENT OR IS ANY DEMAND FOR SUCH CONTRIBUTION STILL OUT STANDING?', fields.developmentContribution);
  drawQRow('19', 'HAS THE WHOLE OR PART OF THE LAND BEEN NOTIFIED FOR ACQUISITION BY GOVERNMENT OR ANY STATUTORY BODY? GIVE DATE OF THE NOTIFICATION', 'NO SUCH PARTICULARS ARE OBSERVED BY US');
  drawQRow('20', 'ATTACH A DIMENSION SITE PLAN.', 'SITE PLAN IS ATTACHED (GPS LOCATION MAP ATTACHED)');
  advanceCursor(6);

  // TABLE C — IMPROVEMENT
  drawQHeader('IMPROVEMENT');
  drawQRow('21', 'ATTACH PLANS AND ELEVATIONS OF ALL STRUCTURES STANDING ON THE LAND AND LAY-OUT PLAN.', fields.plansAttached);
  drawQRow('22', 'FURNISH TECHNICAL DETAILS OF THE BUILDING ON A SEPARATE SHEET [THE ANNEXURE TO THIS FORM MAY BE USED]', fields.technicalDetails);
  drawQRow('23', 'IS THE BUILDING OWNER-OCCUPIED / TENANTED / BOTH? IF PARTLY OWNER OCCUPIED, SPECIFY PORTION AND EXTENT OF AREA UNDER OWNER OCCUPATION.', `(I) ${fields.tenancyStatus}\n(II) ${fields.tenancyPortionDetails || 'NOT APPLICABLE'}`);

  const fsiPerm = fields.fsiPermissible || fields.fsi || 'NOT APPLICABLE';
  const fsiUtil = fields.fsiUtilized || '';
  const q24Answer = `• FLOOR SPACE INDEX PERMISSIBLE: ${fsiPerm}\n• PERCENTAGE ACTUALLY UTILIZED: ${fsiUtil || 'NOT APPLICABLE'}`;
  drawQRow('24', 'WHAT IS THE FLOOR SPACE INDEX PERMISSIBLE AND PERCENTAGE ACTUALLY UTILIZED?', q24Answer);
  advanceCursor(6);

  // TABLE D — RENT
  drawQHeader('RENT');
  const q25Items = [
    { q: '(I) NAME OF TENANT/LESSEES/LICENSEES, ETC.', a: fields.tenantName || 'NOT APPLICABLE' },
    { q: '(II) PORTION IN THEIR OCCUPATION', a: fields.tenantPortion || 'NOT APPLICABLE' },
    { q: '(III) MONTHLY OR ANNUAL RENT/COMPENSATION/LICENSE FEE, ETC. PAID BY EACH.', a: fields.tenantRent || 'NOT APPLICABLE' },
    { q: '(IV) GROSS AMOUNT RECEIVED FOR THE WHOLE PROPERTY:', a: fields.tenantGrossAmount || 'NOT APPLICABLE' }
  ];
  drawQRowMulti('25', q25Items, { drawSubBorders: true });
  drawQRow('26', 'ARE ANY OF THE OCCUPANTS RELATED TO, OR CLOSE BUSINESS ASSOCIATES OF THE OWNER?', fields.relatedOccupants);
  drawQRow('27', 'IS SEPARATE AMOUNT BEING RECOVERED FOR THE USE OF FIXTURES LIKE FANS, GEYSERS, REFRIGERATORS, COOKING RANGES, BUILT IN WARDROBES, ETC., OR FOR SERVICE CHARGES? IF SO GIVE DETAILS.', fields.fixtures);
  drawQRow('28', 'DETAILS OF WATER AND ELECTRICITY CHARGES TO BE BORNE BY THE OWNER', fields.waterElectricCharges || 'NOT APPLICABLE');
  drawQRow('29', 'IF A PUMP IS INSTALLED, WHO HAS TO BEAR THE COST AND MAINTENANCE AND OPERATION--OWNER OR TENANT.', fields.pumpMaintenance || 'NOT APPLICABLE');
  drawQRow('30', 'WHO IS TO BEAR THE COST OF ELECTRICITY CHARGES FOR LIGHTING OF COMMON SPACE LIKE ENTRANCE HALL, STAIRS, PASSAGES, COMPOUND, ETC.--OWNER OR TENANT.', fields.commonElectricity || 'NOT APPLICABLE');
  drawQRow('31', 'WHAT IS THE AMOUNT OF PROPERTY TAX? WHO IS TO BEAR IT? GIVE DETAILS WITH DOCUMENTARY PROOF.', fields.propertyTax || 'NOT APPLICABLE');
  drawQRow('32', 'IS THE BUILDING INSURED? IF SO, GIVE THE POLICY NO., AMOUNT FOR WHICH IT IS INSURED AND ANNUAL PREMIUM.', fields.buildingInsured);
  drawQRow('33', 'IF ANY DISPUTE BETWEEN LAND LORD AND TENANT REGARDING RENT PENDING IN COURT OF LAW?', fields.landlordTenantDispute);
  drawQRow('34', 'HAS ANY STANDARD RENT BEEN FIXED FOR THE PREMISES UNDER ANY LAW RELATING TO CONTROL OF RENT?', fields.standardRent);
  advanceCursor(6);

  // TABLE E — SALES
  drawQHeader('SALES');
  let q35Answer = fields.saleInstances || 'NOT APPLICABLE';
  if (fields.saleInstancesLines && fields.saleInstancesLines.length > 0) {
    q35Answer = renderBulletLines(fields.saleInstancesLines);
  } else if (q35Answer && q35Answer !== 'NOT APPLICABLE') {
    q35Answer = renderBulletLines(q35Answer);
  }
  drawQRow('35', 'GIVE INSTANCES OF SALES OF IMMOVABLE PROPERTY IN THE LOCALITY ON A SEPARATE SHEET, INDICATING THE NAME AND ADDRESS OF THE PROPERTY, REGISTRATION NO., SALE PRICE AND AREA OF LAND SOLD:', q35Answer);

  let q36Text = '';
  if (fields.landRateMode === 'custom' && fields.landRateCustomText) {
    q36Text = fields.landRateCustomText;
  } else {
    const q36Rate = fields.landRatePerUnit ? parseNum(fields.landRatePerUnit).toLocaleString('en-IN') : '';
    const q36Unit = fields.landRateUnit || 'DEC';
    const q36LandArea = fields.landArea || '';
    const q36LandAreaUnit = fields.landAreaUnit || q36Unit;
    const calcVal = calculateLandValue(fields.landArea, fields.landAreaUnit, fields.landRatePerUnit, fields.landRateUnit);
    const q36TotalVal = calcVal || computedLandValue || parseNum(fields.totalLandValue);
    const q36TotalStr = q36TotalVal ? `${formatIndianCurrency(q36TotalVal)}/-` : '...';

    if (q36Rate) {
      let ratePhrase = `THE RATE IS ABOUT RS.${q36Rate}/- PER ${q36Unit}`;
      if (fields.landRateSecondaryPerUnit && fields.landRateSecondaryUnit) {
        const secRate = parseNum(fields.landRateSecondaryPerUnit).toLocaleString('en-IN');
        ratePhrase += ` I.E. RS.${secRate}/- PER ${fields.landRateSecondaryUnit}`;
      }
      q36Text = `${ratePhrase}. HENCE TOTAL VALUE OF THE LAND AS APPEARING IN THE ROR= ${q36LandArea} ${q36LandAreaUnit} @ RS.${q36Rate}/- PER ${q36Unit} = RS.${q36TotalStr}`;
    } else {
      q36Text = fields.landRate || 'NOT APPLICABLE';
    }
  }
  drawQRow('36', 'LAND RATE ADOPTED IN THIS VALUATION:', q36Text);
  drawQRow('37', 'IF SALE INSTANCES ARE NOT AVAILABLE OR NOT RELIED UPON, THE BASIS OF ARRIVING AT THE LAND RATE.', fields.landRateBasis);
  advanceCursor(6);

  // TABLE F — COST OF CONSTRUCTION
  drawQHeader('COST OF CONSTRUCTION');
  let q38Answer = 'NOT APPLICABLE';
  if (fields.constructionStartYear || fields.constructionEndYear) {
    const startStr = fields.constructionStartYear ? `COMMENCEMENT IN THE YEAR: ${fields.constructionStartYear}` : '';
    const endStr = fields.constructionEndYear ? `COMPLETED IN YEAR: ${fields.constructionEndYear}` : '';
    q38Answer = renderBulletLines([startStr, endStr].filter(Boolean));
  }
  drawQRow('38', 'YEAR OF COMMENCEMENT OF CONSTRUCTION AND YEAR OF COMPLETION:', q38Answer);
  drawQRow('39', 'WHAT WAS THE METHOD OF CONSTRUCTION--BY CONTRACT / BY EMPLOYING LABOUR DIRECTLY / BOTH?', fields.constructionMethod ? renderBulletLines(fields.constructionMethod) : 'NOT APPLICABLE');
  drawQRow('40', 'FOR ITEMS OF WORK DONE ON CONTRACT, PRODUCE COPIES OF AGREEMENTS.', fields.contractAgreements ? renderBulletLines(fields.contractAgreements) : 'NOT APPLICABLE');
  drawQRow('41', 'FOR ITEMS OF WORK DONE BY ENGAGING LABOUR DIRECTLY, GIVE BASIC RATES OF MATERIALS AND SUPPORTED BY DOCUMENTARY PROOF:', fields.materialRates ? renderBulletLines(fields.materialRates) : 'NOT APPLICABLE');
  drawQRow('42', 'BUILDING APPROVAL PLAN IF ANY', fields.buildingApproval ? renderBulletLines(fields.buildingApproval) : 'NOT APPLICABLE');
  advanceCursor(12);

  // ═══════════════════════════════════════════════════════
  // BLOCK 3 — PART II: VALUATION (ENCLOSED IN BORDER BOX)
  // ═══════════════════════════════════════════════════════
  const boxW = CW;
  const boxX = ML;
  const padX = 16;
  const padY = 14;
  const contentW = boxW - padX * 2;
  const p2Fs = 11;
  const p2Lh = p2Fs * LINE_H;

  const p2HeaderStr = 'PART II-VALUATION';
  const p2IntroStr = 'HERE THE REGISTERED VALUER SHOULD DISCUSS IN DETAIL HIS APPROACH TO VALUATION OF THE PROPERTY AND INDICATE HOW THE VALUE HAS BEEN ARRIVED AT, SUPPORTED BY NECESSARY CALCULATION.';
  const p2YearStr = fields.valuationYear
    ? `VALUATION HAS BEEN PROVIDED FOR THE YEAR ${fields.valuationYear} AT THE REQUEST OF THE CUSTOMER IN ORDER TO ACCESS THE VALUE OF PROPERTY POST COMPLETION OF CONSTRUCTION IN THE YEAR ${fields.completionYear || fields.valuationYear}.`
    : '';

  const p2IntroLines = wrapText(p2IntroStr, contentW, fontR, p2Fs);
  const p2YearLines = p2YearStr ? wrapText(p2YearStr, contentW, fontB, p2Fs) : [];
  
  const p2BulletItemLines: { lines: string[] }[] = [];
  for (const bullet of fields.valuationBullets || []) {
    const trimmed = bullet ? bullet.trim().replace(/^[-*•]\s*/, '') : '';
    if (trimmed) {
      const bText = `• ${trimmed}`;
      const wrapped = wrapText(bText, contentW - 12, fontR, p2Fs);
      p2BulletItemLines.push({ lines: wrapped });
    }
  }

  let p2BoxH = padY * 2;
  const headerFs = 13;
  p2BoxH += headerFs * LINE_H + 6;
  p2BoxH += 8;
  p2BoxH += p2IntroLines.length * p2Lh;
  if (p2YearLines.length > 0) {
    p2BoxH += 6 + p2YearLines.length * p2Lh;
  }
  if (p2BulletItemLines.length > 0) {
    p2BoxH += 8;
    for (const bItem of p2BulletItemLines) {
      p2BoxH += bItem.lines.length * p2Lh + 4;
    }
  }

  ensureSpace(p2BoxH + 10);
  const p2BoxStartY = cy;

  page.drawRectangle({
    x: boxX,
    y: pdfY(p2BoxStartY) - p2BoxH,
    width: boxW,
    height: p2BoxH,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
  });

  let curInnerY = p2BoxStartY + padY;

  const p2Hw = fontBI.widthOfTextAtSize(p2HeaderStr, headerFs);
  const p2Hx = boxX + (boxW - p2Hw) / 2;
  page.drawText(p2HeaderStr, {
    x: p2Hx,
    y: pdfY(curInnerY) - headerFs * 0.8,
    size: headerFs,
    font: fontBI,
    color: rgb(0, 0, 0),
  });
  page.drawLine({
    start: { x: p2Hx, y: pdfY(curInnerY) - headerFs * 0.8 - 2 },
    end: { x: p2Hx + p2Hw, y: pdfY(curInnerY) - headerFs * 0.8 - 2 },
    thickness: 1,
    color: rgb(0, 0, 0),
  });
  curInnerY += headerFs * LINE_H + 10;

  for (let i = 0; i < p2IntroLines.length; i++) {
    page.drawText(p2IntroLines[i], {
      x: boxX + padX,
      y: pdfY(curInnerY) - p2Fs * 0.8,
      size: p2Fs,
      font: fontR,
      color: rgb(0, 0, 0),
    });
    curInnerY += p2Lh;
  }

  if (p2YearLines.length > 0) {
    curInnerY += 6;
    for (let i = 0; i < p2YearLines.length; i++) {
      page.drawText(p2YearLines[i], {
        x: boxX + padX,
        y: pdfY(curInnerY) - p2Fs * 0.8,
        size: p2Fs,
        font: fontB,
        color: rgb(0, 0, 0),
      });
      curInnerY += p2Lh;
    }
  }

  if (p2BulletItemLines.length > 0) {
    curInnerY += 6;
    for (const bItem of p2BulletItemLines) {
      for (let i = 0; i < bItem.lines.length; i++) {
        page.drawText(bItem.lines[i], {
          x: boxX + padX + (i === 0 ? 10 : 22),
          y: pdfY(curInnerY) - p2Fs * 0.8,
          size: p2Fs,
          font: fontR,
          color: rgb(0, 0, 0),
        });
        curInnerY += p2Lh;
      }
      curInnerY += 4;
    }
  }

  cy += p2BoxH + 16;

  // ═══════════════════════════════════════════════════════
  // BLOCK 4 — PART III: DECLARATION (ENCLOSED IN BORDER BOX)
  // ═══════════════════════════════════════════════════════
  const p3Fs = 11;
  const p3Lh = p3Fs * LINE_H;

  const p3HeaderStr = 'PART III-DECLARATION';
  const p3IntroStr = 'I HERE BY DECLARE THAT-';
  const p3Bullet1 = '(A) THE INFORMATION FURNISHED IN PART I IS TRUE TO THE BEST OF MY KNOWLEDGE AND BELIEF.';
  const p3Bullet2 = '(B) I HAVE NO DIRECT OR INDIRECT INTEREST IN THE PROPERTY VALUED.';

  const b1Lines = wrapText(p3Bullet1, contentW - 20, fontR, p3Fs);
  const b2Lines = wrapText(p3Bullet2, contentW - 20, fontR, p3Fs);

  const formattedReportDate = fields.reportDate ? formatReportDate(fields.reportDate) : (fields.valuationDate ? formatReportDate(fields.valuationDate) : '');
  const dateLabel = `DATE–${formattedReportDate || '________'}`;
  const userPlace = (fields.valuationPlace || fields.place || 'BHUBANESWAR').toUpperCase().trim();
  const placeLabel = `PLACE–${userPlace}`;
  const valuerName = 'ER. SATYAJIT MOHANTY';
  const valuerTitle = 'SIGNATURE OF REGISTERED VALUER';

  let p3BoxH = padY * 2;
  p3BoxH += headerFs * LINE_H + 10;
  p3BoxH += p3Lh + 10;
  p3BoxH += b1Lines.length * p3Lh + 6;
  p3BoxH += b2Lines.length * p3Lh + 10;

  const totalBlockH = p3BoxH + 48;
  ensureSpace(totalBlockH);

  const p3BoxStartY = cy;

  // Box around header + items A & B
  page.drawRectangle({
    x: boxX,
    y: pdfY(p3BoxStartY) - p3BoxH,
    width: boxW,
    height: p3BoxH,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
  });

  let curP3Y = p3BoxStartY + padY + 4;

  // Centered Header (Bold, No Underline)
  const p3Hw = fontB.widthOfTextAtSize(p3HeaderStr, headerFs);
  const p3Hx = boxX + (boxW - p3Hw) / 2;
  page.drawText(p3HeaderStr, {
    x: p3Hx,
    y: pdfY(curP3Y) - headerFs * 0.8,
    size: headerFs,
    font: fontB,
    color: rgb(0, 0, 0),
  });
  curP3Y += headerFs * LINE_H + 10;

  // Intro line
  page.drawText(p3IntroStr, {
    x: boxX + padX,
    y: pdfY(curP3Y) - p3Fs * 0.8,
    size: p3Fs,
    font: fontB,
    color: rgb(0, 0, 0),
  });
  curP3Y += p3Lh + 8;

  // Items (A) and (B)
  const allP3Bullets = [b1Lines, b2Lines];
  for (const bLines of allP3Bullets) {
    for (let i = 0; i < bLines.length; i++) {
      page.drawText(bLines[i], {
        x: boxX + padX + (i === 0 ? 0 : 18),
        y: pdfY(curP3Y) - p3Fs * 0.8,
        size: p3Fs,
        font: fontR,
        color: rgb(0, 0, 0),
      });
      curP3Y += p3Lh;
    }
    curP3Y += 6;
  }

  // Position cy past box
  cy += p3BoxH + 14;

  // Date, Place, and Signature OUTSIDE the box below it
  const sigRightX = ML + CW;
  page.drawText(dateLabel, { x: ML, y: pdfY(cy) - 10, size: 11, font: fontB, color: rgb(0, 0, 0) });
  const valuerW = fontB.widthOfTextAtSize(valuerName, 11);
  page.drawText(valuerName, { x: sigRightX - valuerW, y: pdfY(cy) - 10, size: 11, font: fontB, color: rgb(0, 0, 0) });
  cy += 18;

  page.drawText(placeLabel, { x: ML, y: pdfY(cy) - 10, size: 11, font: fontB, color: rgb(0, 0, 0) });
  const sigTitleW = fontB.widthOfTextAtSize(valuerTitle, 11);
  page.drawText(valuerTitle, { x: sigRightX - sigTitleW, y: pdfY(cy) - 10, size: 11, font: fontB, color: rgb(0, 0, 0) });

  cy += 24;

  // ═══════════════════════════════════════════════════════
  // BLOCK 5 — ANNEXURE TABLES (Technical Details + Valuation)
  // ═══════════════════════════════════════════════════════
  if (!isLandOnly) {
    // TABLE E — ANNEXURE HEADER
    ensureSpace(60);
    const annxStr = 'ANNEXURE TO FORM 0-1';
    const annxFs = 14;
    const annxW = fontB.widthOfTextAtSize(annxStr, annxFs);
    const annxX = ML + (CW - annxW) / 2;
    page.drawText(annxStr, { x: annxX, y: pdfY(cy) - annxFs * 0.8, size: annxFs, font: fontB, color: rgb(0,0,0) });
    page.drawLine({ start: { x: annxX, y: pdfY(cy) - annxFs * 0.8 - 2 }, end: { x: annxX + annxW, y: pdfY(cy) - annxFs * 0.8 - 2 }, thickness: 1, color: rgb(0,0,0) });
    cy += annxFs * LINE_H + 12;

    // Technical Details Header Table — row 1 (labels, all same height, centered)
    const thCols = [CW * 0.20, CW * 0.20, CW * 0.15, CW * 0.15, CW * 0.15, CW * 0.15];
    const thH = 36; // tall enough for 2-line labels, all cols identical
    ensureSpace(thH * 2);

    let thX = ML;
    drawCell(thX, cy, thCols[0], thH, 'TECHNICAL\nDETAILS', { bold: true, align: 'center', vAlign: 'center', fillColor: LBL_BG });
    thX += thCols[0];
    drawCell(thX, cy, thCols[1], thH, 'MAIN\nBUILDING', { bold: true, align: 'center', vAlign: 'center', fillColor: LBL_BG });
    thX += thCols[1];
    drawCell(thX, cy, thCols[2], thH, 'ANNEXES', { bold: true, align: 'center', vAlign: 'center', fillColor: LBL_BG });
    thX += thCols[2];
    drawCell(thX, cy, thCols[3], thH, 'SERVANTS\nQUARTERS', { bold: true, align: 'center', vAlign: 'center', fillColor: LBL_BG });
    thX += thCols[3];
    drawCell(thX, cy, thCols[4], thH, 'GARAGE', { bold: true, align: 'center', vAlign: 'center', fillColor: LBL_BG });
    thX += thCols[4];
    drawCell(thX, cy, thCols[5], thH, 'PUMP\nHOUSE', { bold: true, align: 'center', vAlign: 'center', fillColor: LBL_BG });

    // Row 2 — values
    thX = ML;
    const cy2 = cy + thH;
    drawCell(thX, cy2, thCols[0], thH, '', { bold: true, align: 'center', vAlign: 'center', fillColor: LBL_BG, bgOpacity: 0.5 });
    thX += thCols[0];
    drawCell(thX, cy2, thCols[1], thH, fields.annexMainBuilding || '1 NOS', { bold: true, align: 'center', vAlign: 'center', fillColor: LBL_BG, bgOpacity: 0.5 });
    thX += thCols[1];
    drawCell(thX, cy2, thCols[2], thH, fields.annexAnnexes || 'NIL', { bold: true, align: 'center', vAlign: 'center', fillColor: LBL_BG, bgOpacity: 0.5 });
    thX += thCols[2];
    drawCell(thX, cy2, thCols[3], thH, fields.annexServantsQuarters || 'NIL', { bold: true, align: 'center', vAlign: 'center', fillColor: LBL_BG, bgOpacity: 0.5 });
    thX += thCols[3];
    drawCell(thX, cy2, thCols[4], thH, fields.annexGarage || 'NIL', { bold: true, align: 'center', vAlign: 'center', fillColor: LBL_BG, bgOpacity: 0.5 });
    thX += thCols[4];
    drawCell(thX, cy2, thCols[5], thH, fields.annexPumpHouse || 'NIL', { bold: true, align: 'center', vAlign: 'center', fillColor: LBL_BG, bgOpacity: 0.5 });

    cy += thH * 2;

    // Q01 Formatting
    let q01Floors = fields.techFloors ? fields.techFloors.trim().toUpperCase() : '';
    let q01Height = fields.techFloorHeight ? fields.techFloorHeight.trim().toUpperCase() : '';
    if (q01Height && !q01Height.startsWith('HEIGHT')) {
      q01Height = `HEIGHT–${q01Height}`;
    }
    const q01Ans = [
      q01Floors ? `- ${q01Floors}` : '',
      q01Height ? `- ${q01Height}` : ''
    ].filter(Boolean).join('\n');

    drawQRow('01.', 'NO. OF FLOORS AND HEIGHT OF EACH FLOOR:', q01Ans);

    // Q02 Formatting
    let q02ActualAns = renderBulletLines((fields.techPlinthAreaActual || '').split('\n'));
    if (fields.plinthAreaConsidered === 'ACTUAL') {
      q02ActualAns += '\n\nACTUAL PLINTH AREA IS CONSIDERED FOR VALUATION PURPOSE';
    }

    let q02ApprovedAns = renderBulletLines((fields.techPlinthAreaApproved || '').split('\n'));
    if (fields.plinthAreaConsidered === 'APPROVED') {
      q02ApprovedAns += '\n\nAPPROVED PLINTH AREA IS CONSIDERED FOR VALUATION PURPOSE';
    }

    let authority = 'PKDA';
    if (fields.buildingApproval) {
      const upperApproval = fields.buildingApproval.toUpperCase();
      if (upperApproval.includes('BDA')) authority = 'BDA';
      else if (upperApproval.includes('CDA')) authority = 'CDA';
      else if (upperApproval.includes('PKDA')) authority = 'PKDA';
      else if (upperApproval.includes('BMC')) authority = 'BMC';
    }

    if (fields.showPlinthActual) {
      drawQRow('02.', 'PLINTH AREA FLOOR-WISE(AS PER ISI3861-1966): (AS PER ACTUAL)', q02ActualAns);
    }
    if (fields.showPlinthApproved) {
      drawQRow(fields.showPlinthActual ? '' : '02.', `PLINTH AREA FLOOR-WISE(AS PER ISI3861-1966): (AS PER ${authority} APPROVAL PLAN)`, q02ApprovedAns);
    }
    if (!fields.showPlinthActual && !fields.showPlinthApproved) {
      drawQRow('02.', 'PLINTH AREA FLOOR-WISE(AS PER ISI3861-1966):', 'NOT APPLICABLE');
    }

    // Q03-Q06
    const constYear = fields.techYearConstruction ? fields.techYearConstruction.trim() : '';
    const compYear = fields.techYearCompletion ? fields.techYearCompletion.trim() : '';

    if (constYear && compYear) {
      drawQRow('03.', 'YEAR OF CONSTRUCTION\nYEAR OF COMPLETION', `${renderBulletLines(constYear)}\n${renderBulletLines(compYear)}`);
    } else if (constYear) {
      drawQRow('03.', 'YEAR OF CONSTRUCTION', renderBulletLines(constYear));
    } else if (compYear) {
      drawQRow('03.', 'YEAR OF COMPLETION', renderBulletLines(compYear));
    } else {
      drawQRow('03.', 'YEAR OF CONSTRUCTION', 'NOT APPLICABLE');
    }

    drawQRow('04.', 'ESTIMATED FUTURE LIFE:', fields.techFutureLife);
    drawQRow('05.', 'TYPE OF CONSTRUCTION:', fields.techConstructionType);
    drawQRow('06.', 'TYPE OF FOUNDATION:', fields.techFoundation);

    // Q07 Walls split
    const q07Items = [
      { q: '(A) BASEMENT AND PLINTH', a: fields.techWallsBasement || 'NOT APPLICABLE' },
      { q: '(B) GROUND FLOOR', a: fields.techWallsGround || 'NOT APPLICABLE' }
    ];
    drawQRowMulti('07.', q07Items);

    // Q08-Q20
    drawQRow('08.', 'PARTITIONS:', fields.techPartitions);
    drawQRow('09.', 'DOORS & WINDOWS:', fields.techDoorsWindows);
    drawQRow('10.', 'FLOORING:', fields.techFlooring);
    drawQRow('11.', 'FINISHING (INTERNAL/EXTERNAL):', fields.techFinishing);
    drawQRow('12.', 'ROOFING & TERRACING:\nARCHITECTURAL FEATURES:', `${fields.techRoofing}\n${fields.techArchitecturalFeatures}`);
    drawQRow('13.', 'TYPE OF WIRING:\nCLASS OF FITTINGS:', `${fields.techWiring}\n${fields.techFittings || 'SUPERIOR'}`);
    drawQRow('14.', 'SANITARY INSTALLATION:', renderBulletLines(fields.techSanitaryLines));
    
    // Q15 Compound Wall
    const q15Question = 'COMPOUND WALL (HEIGHT AND LENGTH):\nTYPE OF CONSTRUCTION:';
    const q15Ans1 = fields.techCompoundWall || 'NOT APPLICABLE';
    const q15Ans2 = fields.techCompoundWallType || 'NOT APPLICABLE';
    drawQRow('15.', q15Question, `${q15Ans1}\n${q15Ans2}`);

    drawQRow('16.', 'LIFTS:', fields.techLifts);
    drawQRow('17.', 'OVERHEAD WATER TANK:', fields.techOverheadTank);

    // Q18 Pump & Underground Sump
    const q18Question = 'PUMP NO. AND THEIR HORSE POWER\nUNDER GROUND SUMP-CAPACITY AND TYPE OF CONSTRUCTION.';
    const q18Ans1 = fields.techPump || 'NOT APPLICABLE';
    const q18Ans2 = fields.techUndergroundSump || 'NOT APPLICABLE';
    drawQRow('18.', q18Question, `${q18Ans1}\n${q18Ans2}`);

    drawQRow('19.', 'ROADS AND PAVING:', fields.techRoadsPaving);
    drawQRow('20.', 'SEWAGE DISPOSAL:', fields.techSewageDisposal);
    
    advanceCursor(12);

    // TABLE I — VALUATION CALCULATION
    drawText(`MODIFICATION IN THE ANNEXURE TO FORM NO–01 DETAILS OF VALUATION (AS ON ${fields.valuationCalcDate || fields.valuationDate})`, { bold: true });
    advanceCursor(6);

    // Header row
    const calcCols = [CW * 0.16, CW * 0.11, CW * 0.09, CW * 0.09, CW * 0.14, CW * 0.14, CW * 0.14, CW * 0.13];
    const calcHeaders = ['PARTICULARS OF ITEM', 'PLINTH AREA', 'ROOF HEIGHT', 'AGE OF THE BUILDING', 'ESTIMATED REPLACEMENT RATE', 'REPLACEMENT COST', `DEPRECIATION 1.5% P.A. (${fields.depreciationPct}%)`, 'NET VALUE AFTER DEP.'];
    const headerH = 45;
    let cx = ML;
    for (let i = 0; i < calcHeaders.length; i++) {
      drawCell(cx, cy, calcCols[i], headerH, calcHeaders[i], { bold: true, fontSize: 8, align: 'center', fillColor: LBL_BG });
      cx += calcCols[i];
    }
    cy += headerH;

    // Data rows (show default "--" row if no floors entered)
    if (computedFloorRows.length === 0) {
      const rowH = 20;
      ensureSpace(rowH);
      cx = ML;
      for (let i = 0; i < calcCols.length; i++) {
        drawCell(cx, cy, calcCols[i], rowH, '--', { fontSize: 8, align: 'center', fillColor: LBL_BG, bgOpacity: 0.5 });
        cx += calcCols[i];
      }
      cy += rowH;
    } else {
      for (const fr of computedFloorRows) {
        const rowH = 20;
        ensureSpace(rowH);
        cx = ML;
        const vals = [
          fr.name,
          `${fr.plinthArea} SQFT`,
          fr.roofHeight,
          fr.age,
          `RS.${formatIndianCurrency(parseNum(fr.ratePerSqft))}/-`,
          `RS.${formatIndianCurrency(fr.replacementCost)}/-`,
          `RS.${formatIndianCurrency(fr.depAmt)}/-`,
          `RS.${formatIndianCurrency(fr.netValue)}/-`,
        ];
        for (let i = 0; i < vals.length; i++) {
          drawCell(cx, cy, calcCols[i], rowH, vals[i], { fontSize: 8, align: 'center', fillColor: LBL_BG, bgOpacity: 0.5 });
          cx += calcCols[i];
        }
        cy += rowH;
      }
    }

    // Building value summary row
    ensureSpace(22);
    drawCell(ML, cy, CW, 22, `VALUE OF THE BUILDING: RS.${formatIndianCurrency(computedBuildingValue)}/-`, { bold: true, fontSize: 10, align: 'center', fillColor: LBL_BG, bgOpacity: 0.5 });
    cy += 22;
    advanceCursor(8);
  }

  // TABLE J — EXTRA ITEMS
  ensureSpace(40);
  drawCell(ML, cy, CW, 20, 'EXTRA ITEM', { bold: true, align: 'center', fillColor: LBL_BG, bgOpacity: 0.5 });
  cy += 20;
  drawCell(ML, cy, CW * 0.7, 18, 'PARTICULARS', { bold: true, fillColor: LBL_BG, bgOpacity: 0.5 });
  drawCell(ML + CW * 0.7, cy, CW * 0.3, 18, 'AMOUNT', { bold: true, align: 'center', fillColor: LBL_BG, bgOpacity: 0.5 });
  cy += 18;
  for (const item of fields.extraItems) {
    ensureSpace(18);
    drawCell(ML, cy, CW * 0.7, 18, item.description, { fillColor: LBL_BG, bgOpacity: 0.5 });
    drawCell(ML + CW * 0.7, cy, CW * 0.3, 18, `RS.${formatIndianCurrency(item.amount)}/-`, { align: 'center', fillColor: LBL_BG, bgOpacity: 0.5 });
    cy += 18;
  }
  drawCell(ML, cy, CW * 0.7, 20, 'TOTAL', { bold: true, fillColor: LBL_BG, bgOpacity: 0.5 });
  drawCell(ML + CW * 0.7, cy, CW * 0.3, 20, `RS.${formatIndianCurrency(computedExtraTotal)}/-`, { bold: true, align: 'center', fillColor: LBL_BG, bgOpacity: 0.5 });
  cy += 20;
  advanceCursor(8);

  // TABLE K — TOTAL ABSTRACT
  ensureSpace(100);
  drawCell(ML, cy, CW, 22, 'TOTAL ABSTRACT FOR THE ENTIRE PROPERTY', { bold: true, align: 'center', fillColor: LBL_BG, bgOpacity: 0.5 });
  cy += 22;
  const absRows = [
    ['LAND', `RS.${formatIndianCurrency(computedLandValue)}/-`],
    ['BUILDING', `RS.${formatIndianCurrency(computedBuildingValue)}/-`],
    ['EXTRA ITEMS', `RS.${formatIndianCurrency(computedExtraTotal)}/-`],
    ['TOTAL', `RS.${formatIndianCurrency(computedTotalProperty)}/-`],
  ];
  for (const [label, val] of absRows) {
    drawCell(ML, cy, CW * 0.65, 20, label, { bold: true, fillColor: LBL_BG, bgOpacity: 0.5 });
    drawCell(ML + CW * 0.65, cy, CW * 0.35, 20, val, { bold: true, align: 'center', fillColor: LBL_BG, bgOpacity: 0.5 });
    cy += 20;
  }
  advanceCursor(12);

  // ═══════════════════════════════════════════════════════
  // BLOCK 6 — VALUE SUMMARY PARAGRAPH
  // ═══════════════════════════════════════════════════════
  drawText(`THE VALUE OF THE PROPERTY AS ON ${fields.valuationDate || fields.valuationCalcDate || '________'} IS RS.${formatIndianCurrency(computedTotalProperty)}/- (${rupeesInWords(computedTotalProperty).toUpperCase()}).`, { bold: true });
  advanceCursor(8);

  // ═══════════════════════════════════════════════════════
  // BLOCK 7 — REMARKS (conditional)
  // ═══════════════════════════════════════════════════════
  if (fields.hasRemarks && fields.remarks) {
    drawText('REMARKS', { bold: true });
    advanceCursor(4);
    drawText(fields.remarks.toUpperCase(), { bold: true });
    advanceCursor(8);
  }

  // ═══════════════════════════════════════════════════════
  // BLOCK 8 — VALUATION CERTIFICATE
  // ═══════════════════════════════════════════════════════
  ensureSpace(140);
  drawText('VALUATION CERTIFICATE', { bold: true, align: 'center', underline: true, fontSize: 13 });
  advanceCursor(10);

  const valDateText = fields.valuationDate ? `AS ON ${fields.valuationDate}` : 'AS ON ________';
  const amountWords = rupeesInWords(computedTotalProperty).toUpperCase();

  drawRichParagraph([
    {
      text: `AS A RESULT OF MY APPRAISAL AND ANALYSIS IT IS MY CONSIDERED OPINION THAT THE ESTIMATED FAIR MARKET VALUE OF THE PROPERTY (${fields.propertyType.toUpperCase()}) BY ${fields.ownerName.toUpperCase()} BEARING ${fields.propertyDescription ? fields.propertyDescription.toUpperCase().substring(0, 250) : '________'} ${valDateText} `,
      bold: false,
    },
    {
      text: `IS RS.${formatIndianCurrency(computedTotalProperty)}/- (${amountWords})`,
      bold: true,
    },
  ], { fontSize: 11 });
  advanceCursor(14);

  // ═══════════════════════════════════════════════════════
  // BLOCK 9 — APPENDICES (Images)
  // ═══════════════════════════════════════════════════════
  const embedImage = async (bytes: Uint8Array | null, label: string, maxW: number, maxH: number) => {
    if (!bytes || bytes.length === 0) return;
    addPageNum(page, pageNum);
    pageNum++;
    page = doc.addPage([A4_W, A4_H]);
    drawBackground(page);
    cy = MT;
    drawText(label, { bold: true });
    advanceCursor(8);
    try {
      let img;
      try { img = await doc.embedPng(bytes); } catch { img = await doc.embedJpg(bytes); }
      const scale = Math.min(maxW / img.width, maxH / img.height, 1);
      const drawW = img.width * scale;
      const drawH = img.height * scale;
      const drawX = ML + (CW - drawW) / 2;
      page.drawImage(img, { x: drawX, y: pdfY(cy) - drawH, width: drawW, height: drawH });
      cy += drawH + 8;
    } catch (e) {
      console.warn('Failed to embed image:', e);
    }
  };

  // Property photos
  if (propImageBytes.length > 0) {
    addPageNum(page, pageNum);
    pageNum++;
    page = doc.addPage([A4_W, A4_H]);
    drawBackground(page);
    cy = MT;
    drawText('PROPERTY PHOTOGRAPHS', { bold: true });
    advanceCursor(8);

    for (const imgBytes of propImageBytes) {
      try {
        let img;
        try { img = await doc.embedPng(imgBytes); } catch { img = await doc.embedJpg(imgBytes); }
        const maxW = CW * 0.7;
        const maxH = 200;
        const scale = Math.min(maxW / img.width, maxH / img.height, 1);
        const drawW = img.width * scale;
        const drawH = img.height * scale;
        if (avail() < drawH + 20) {
          addPageNum(page, pageNum);
          pageNum++;
          page = doc.addPage([A4_W, A4_H]);
          drawBackground(page);
          cy = MT;
        }
        const drawX = ML + (CW - drawW) / 2;
        page.drawImage(img, { x: drawX, y: pdfY(cy) - drawH, width: drawW, height: drawH });
        cy += drawH + 12;
      } catch (e) {
        console.warn('Failed to embed photo:', e);
      }
    }
  }

  // Easement Document Copies Annexure
  if (easementImageBytes.length > 0) {
    for (let i = 0; i < easementImageBytes.length; i++) {
      await embedImage(easementImageBytes[i], `ANNEXURE — EASEMENT AGREEMENT COPY${easementImageBytes.length > 1 ? ` (${i + 1})` : ''}`, CW, 600);
    }
  }

  // Location Map
  await embedImage(locationBytes, 'LOCATION MAP WITH GPA CO-ORDINATE', CW, 350);

  // CII Table or BDA Map
  if (ciiBytes) await embedImage(ciiBytes, 'COST INFLATION INDEX (CII) TABLE', CW, 400);
  if (bdaBytes) await embedImage(bdaBytes, 'BDA MAP', CW, 400);

  // Benchmark Value
  await embedImage(benchmarkBytes, 'BENCHMARK VALUE', CW, 600);

  // Sketch Map
  if (sketchBytesList && sketchBytesList.length > 0) {
    for (let i = 0; i < sketchBytesList.length; i++) {
      const sBytes = sketchBytesList[i];
      if (sBytes) {
        await embedImage(sBytes, `SKETCH MAP${sketchBytesList.length > 1 ? ` ${i + 1}` : ''}`, CW, 600);
      }
    }
  }

  const trimEmptyGrid = (
    allRows: string[][],
    merges: { sr: number; sc: number; er: number; ec: number }[],
    colWidths?: number[]
  ) => {
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
  };

  // ═══════════════════════════════════════════════════════
  // BLOCK 10 — ANNEXURES (Multi-Plot / Schedule)
  // ═══════════════════════════════════════════════════════
  const annexuresToRender = (fields.annexures || []).filter(
    (a: any) => a.parsedData && a.parsedData.headers && a.parsedData.headers.length > 0
  );
  for (const annexure of annexuresToRender) {
    const pd = annexure.parsedData!;
    ensureSpace(60);
    const annxTitleStr = annexure.title
      ? `ANNEXURE ${annexure.label} \u2014 ${annexure.title.toUpperCase()}`
      : `ANNEXURE ${annexure.label}`;
    const annxHeaderFs = 13;
    const annxHeaderW = fontB.widthOfTextAtSize(annxTitleStr, annxHeaderFs);
    const annxHeaderX = ML + (CW - annxHeaderW) / 2;
    page.drawText(annxTitleStr, { x: annxHeaderX, y: pdfY(cy) - annxHeaderFs * 0.8, size: annxHeaderFs, font: fontB, color: rgb(0, 0, 0) });
    page.drawLine({ start: { x: annxHeaderX, y: pdfY(cy) - annxHeaderFs * 0.8 - 2 }, end: { x: annxHeaderX + annxHeaderW, y: pdfY(cy) - annxHeaderFs * 0.8 - 2 }, thickness: 1, color: rgb(0, 0, 0) });
    cy += annxHeaderFs * LINE_H + 12;

    const { allRows, merges, colWidths } = trimEmptyGrid(
      pd.allRows || [pd.headers, ...pd.rows],
      pd.merges || [],
      pd.colWidths || []
    );
    if (!allRows || allRows.length === 0) continue;

    const numCols = allRows[0]?.length || 0;
    const FONT_SZ = 9;
    const PAD_Y = 4;
    const PAD_X = 4;
    const DEF_ROW_H = FONT_SZ * LINE_H + PAD_Y * 2 + 2;

    let colPx: number[];
    if (colWidths && colWidths.length === numCols) {
      const totalNorm = colWidths.reduce((s: number, w: number) => s + w, 0) || 1;
      colPx = colWidths.map((w: number) => (w / totalNorm) * CW);
    } else {
      colPx = Array(numCols).fill(CW / (numCols || 1));
    }
    const pxSum = colPx.reduce((s, w) => s + w, 0);
    if (pxSum > 0) {
      const scale = CW / pxSum;
      colPx = colPx.map(w => w * scale);
    }

    const covered = new Set<string>();
    const spanMap = new Map<string, { er: number; ec: number }>();
    for (const m of merges) {
      spanMap.set(`${m.sr},${m.sc}`, { er: m.er, ec: m.ec });
      for (let r = m.sr; r <= m.er; r++)
        for (let c = m.sc; c <= m.ec; c++)
          if (r !== m.sr || c !== m.sc) covered.add(`${r},${c}`);
    }

    // Pre-compute row heights using exact text wrapping
    const rowHeights: number[] = allRows.map((row, ri) => {
      let h = DEF_ROW_H;
      for (let ci = 0; ci < numCols; ci++) {
        if (covered.has(`${ri},${ci}`)) continue;
        const span = spanMap.get(`${ri},${ci}`);
        if (span && span.er > ri) continue;
        const colSpan = span ? span.ec - ci + 1 : 1;
        const cellW = colPx.slice(ci, ci + colSpan).reduce((s, w) => s + w, 0);
        const text = row[ci] || '';
        const isHeader = ri === 0;
        const font = isHeader ? fontB : fontR;
        const lines = wrapText(text, cellW - PAD_X * 2, font, FONT_SZ);
        const needed = lines.length * FONT_SZ * LINE_H + PAD_Y * 2 + 2;
        if (needed > h) h = needed;
      }
      return h;
    });

    for (let ri = 0; ri < allRows.length; ri++) {
      const row = allRows[ri];
      ensureSpace(rowHeights[ri]);
      let cx = ML;
      for (let ci = 0; ci < numCols; ci++) {
        const cw = colPx[ci] || (CW / numCols);
        if (covered.has(`${ri},${ci}`)) { cx += cw; continue; }

        const span = spanMap.get(`${ri},${ci}`);
        const colSpan = span ? span.ec - ci + 1 : 1;
        const rowSpan = span ? span.er - ri + 1 : 1;
        const cellW = colPx.slice(ci, ci + colSpan).reduce((s, w) => s + w, 0);
        const cellH = rowSpan > 1
          ? rowHeights.slice(ri, ri + rowSpan).reduce((s, h) => s + h, 0)
          : rowHeights[ri];

        const isHeader = ri === 0;
        const isSpannedHeader = colSpan === numCols;
        drawCell(cx, cy, cellW, cellH, row[ci] || '', {
          bold: isHeader || isSpannedHeader,
          fontSize: FONT_SZ,
          align: 'center',
          vAlign: 'middle',
          fillColor: LBL_BG,
          bgOpacity: 0.45,
        });
        cx += cw;
      }
      cy += rowHeights[ri];
    }
    advanceCursor(12);
  }

  // Add page number to last page
  addPageNum(page, pageNum);

  // Generate blob
  const pdfBytes = await doc.save();
  return new Blob([pdfBytes] as any, { type: 'application/pdf' });
}
