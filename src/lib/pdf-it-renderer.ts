import { PDFDocument, PDFPage, PDFImage, StandardFonts, rgb } from 'pdf-lib';
import { formatIndianCurrency, rupeesInWords } from './numberToWords';

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
  ciiTableImage: string;
  bdaMapImage: string;
  benchmarkImage: string;
  sketchMapImages: string[];
  extraItems: ExtraItem[];
  showLandAnnexure: boolean;
  landAnnexureRows: {
    id: string;
    slNo: string;
    khataNo: string;
    plotNo: string;
    area: string;
    mouza: string;
  }[];
  plinthAreaConsidered: string;
  techFloors: string;
  techFloorHeight: string;
  techPlinthAreaActual: string;
  techPlinthAreaApproved: string;
  techYearConstruction: string;
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
  techSanitary: string;
  techCompoundWall: string;
  techLifts: string;
  techOverheadTank: string;
  techPump: string;
  techUndergroundSump: string;
  techRoadsPaving: string;
  techSewageDisposal: string;
}

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
  const allImageUrls = [
    '/templates/letterhead.png',
    ...propImgs,
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
  const locationBytes = fields.locationMapImage ? allImageBytes[imgIdx++] : null;
  const ciiBytes = fields.ciiTableImage ? allImageBytes[imgIdx++] : null;
  const bdaBytes = fields.bdaMapImage ? allImageBytes[imgIdx++] : null;
  const benchmarkBytes = fields.benchmarkImage ? allImageBytes[imgIdx++] : null;
  const sketchBytesList = fields.sketchMapImages?.length ? allImageBytes.slice(imgIdx, imgIdx + fields.sketchMapImages.length) : null;
  if (fields.sketchMapImages?.length) imgIdx += fields.sketchMapImages.length;

  let letterheadImage: PDFImage | null = null;
  if (letterheadBytes && letterheadBytes.length > 0) {
    try {
      letterheadImage = await doc.embedPng(letterheadBytes);
    } catch {
      try {
        letterheadImage = await doc.embedJpg(letterheadBytes);
      } catch {
        letterheadImage = null;
      }
    }
  }

  const drawBackground = (p: PDFPage) => {
    if (letterheadImage) {
      p.drawImage(letterheadImage, {
        x: 0,
        y: 0,
        width: A4_W,
        height: A4_H,
      });
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
    p.drawText(numStr, { x: (A4_W - tw) / 2, y: MB / 2, size: 12, font: fontR, color: rgb(0, 0, 0) });
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
      .replace(/[\u2022\u2023\u25E6\u2043\u2219\u25CF]/g, '-') // bullets -> dash
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
      .replace(/[^\x20-\x7E]/g, '');                      // strip any other unsupported non-ASCII
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

  const drawText = (text: string, opts?: { bold?: boolean; italic?: boolean; fontSize?: number; align?: 'left' | 'center' | 'right'; x?: number; maxW?: number }) => {
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
      if (opts?.align === 'center') {
        const tw = font.widthOfTextAtSize(lines[i], fs);
        dx = x + (maxW - tw) / 2;
      } else if (opts?.align === 'right') {
        const tw = font.widthOfTextAtSize(lines[i], fs);
        dx = x + maxW - tw;
      }
      page.drawText(lines[i], {
        x: dx,
        y: pdfY(cy + i * lh) - fs * 0.8,
        size: fs,
        font,
        color: rgb(0, 0, 0),
      });
    }
    cy += totalH;
  };

  const advanceCursor = (pts: number) => { cy += pts; };

  // Helper to format report date nicely like '22TH OCT 2025'
  const formatReportDate = (dStr: string): string => {
    if (!dStr) return '';
    const trimmed = dStr.trim();
    if (/[A-Za-z]{3}/.test(trimmed)) return trimmed.toUpperCase();
    const parts = trimmed.split(/[-/.]/);
    let d: Date | null = null;
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      } else if (parts[2].length === 4) {
        d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      }
    }
    if (!d || isNaN(d.getTime())) d = new Date(trimmed);
    if (isNaN(d.getTime())) return trimmed.toUpperCase();

    const day = d.getDate();
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const mStr = months[d.getMonth()];
    const yStr = d.getFullYear();
    let suffix = 'TH';
    if (day === 1 || day === 21 || day === 31) suffix = 'ST';
    else if (day === 2 || day === 22) suffix = 'ND';
    else if (day === 3 || day === 23) suffix = 'RD';
    return `${day}${suffix} ${mStr} ${yStr}`;
  };

  // Render bullet lines: plain text for 1 non-empty entry, bullet-prefixed for 2+, 'NOT APPLICABLE' if none entered
  const renderBulletLines = (lines: string | string[]): string => {
    if (typeof lines === 'string') return lines.trim() ? lines : 'NOT APPLICABLE';
    const filled = lines.filter(l => l && l.trim());
    if (filled.length === 0) return 'NOT APPLICABLE';
    if (filled.length === 1) return filled[0];
    return filled.map(l => `- ${l.trim()}`).join('\n');
  };

  // Render multi-line answer in Q-row (supports \n line-breaks in answer text)
  const wrapMultiLineText = (text: string, maxW: number, font: any, fs: number): string[] => {
    const paragraphs = String(text ?? '').split('\n');
    const result: string[] = [];
    for (const para of paragraphs) {
      const wrapped = wrapText(para, maxW, font, fs);
      result.push(...wrapped);
    }
    return result;
  };

  // Table cell primitive
  const drawCell = (x: number, topY: number, w: number, h: number, text: string, opts?: { bold?: boolean; fontSize?: number; align?: 'left' | 'center' | 'right' }) => {
    const fs = opts?.fontSize || 12;
    const font = opts?.bold ? fontB : fontR;
    // Border
    page.drawRectangle({ x, y: pdfY(topY) - h, width: w, height: h, borderColor: rgb(0, 0, 0), borderWidth: 0.5 });
    // Text
    const padX = 4;
    const padY = 3;
    const textW = w - padX * 2;
    const lines = wrapText(text, textW, font, fs);
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
        y: pdfY(topY + padY + i * fs * LINE_H) - fs * 0.8,
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

  const drawQRow = (qNo: string, question: string, answer: string, opts?: { qBold?: boolean; headerRow?: boolean }) => {
    const fs = 12;
    const h1 = cellHeight(qNo, qColW[0], { bold: true, fontSize: fs });
    const h2 = cellHeight(question, qColW[1], { fontSize: fs });
    // For multi-line answers (containing \n), compute height correctly
    const answerLines = wrapMultiLineText(answer, qColW[2] - 8, fontR, fs);
    const h3 = Math.max(answerLines.length * fs * LINE_H + 6, fs * LINE_H + 6);
    const rowH = Math.max(h1, h2, h3);
    ensureSpace(rowH);
    let x = ML;
    drawCell(x, cy, qColW[0], rowH, qNo, { bold: true, fontSize: fs, align: 'center' });
    x += qColW[0];
    drawCell(x, cy, qColW[1], rowH, question, { fontSize: fs, bold: opts?.headerRow });
    x += qColW[1];
    // Draw answer cell with multi-line support
    page.drawRectangle({ x, y: pdfY(cy) - rowH, width: qColW[2], height: rowH, borderColor: rgb(0, 0, 0), borderWidth: 0.5 });
    const padX = 4; const padY = 3;
    for (let i = 0; i < answerLines.length; i++) {
      page.drawText(answerLines[i], {
        x: x + padX,
        y: pdfY(cy + padY + i * fs * LINE_H) - fs * 0.8,
        size: fs,
        font: fontR,
        color: rgb(0, 0, 0),
      });
    }
    cy += rowH;
  };

  const drawQHeader = (title: string) => {
    const fs = 12;
    const rowH = fs * LINE_H + 6;
    ensureSpace(rowH);
    // Spanning full table width with merged header
    drawCell(ML, cy, CW, rowH, title, { bold: true, fontSize: fs, align: 'center' });
    cy += rowH;
  };

  const drawQRowMulti = (qNo: string, items: { q: string, a: string }[]) => {
    const fs = 12;
    const h1 = cellHeight(qNo, qColW[0], { bold: true, fontSize: fs });
    let totalH = 0;
    const subHeights = items.map(item => {
      const qLines = wrapMultiLineText(item.q, qColW[1] - 8, fontR, fs);
      const aLines = wrapMultiLineText(item.a, qColW[2] - 8, fontR, fs);
      const rowH = Math.max(qLines.length * fs * LINE_H + 6, aLines.length * fs * LINE_H + 6);
      return { rowH, qLines, aLines };
    });
    subHeights.forEach(sh => totalH += sh.rowH);
    totalH = Math.max(totalH, h1);
    
    ensureSpace(totalH);
    const startY = cy;
    
    page.drawRectangle({ x: ML, y: pdfY(startY) - totalH, width: qColW[0], height: totalH, borderColor: rgb(0,0,0), borderWidth: 0.5 });
    page.drawRectangle({ x: ML + qColW[0], y: pdfY(startY) - totalH, width: qColW[1], height: totalH, borderColor: rgb(0,0,0), borderWidth: 0.5 });
    page.drawRectangle({ x: ML + qColW[0] + qColW[1], y: pdfY(startY) - totalH, width: qColW[2], height: totalH, borderColor: rgb(0,0,0), borderWidth: 0.5 });

    const tw = fontB.widthOfTextAtSize(qNo, fs);
    page.drawText(qNo, { x: ML + (qColW[0] - tw) / 2, y: pdfY(startY + 3 + (h1 - fs * LINE_H) / 2) - fs * 0.8, size: fs, font: fontB, color: rgb(0,0,0) });

    let currY = startY;
    const padX = 4; const padY = 3;
    items.forEach((item, idx) => {
      const { rowH, qLines, aLines } = subHeights[idx];
      if (idx > 0) {
        page.drawLine({ start: { x: ML + qColW[0], y: pdfY(currY) }, end: { x: ML + CW, y: pdfY(currY) }, thickness: 0.5, color: rgb(0,0,0) });
      }
      for (let i = 0; i < qLines.length; i++) {
        page.drawText(qLines[i], { x: ML + qColW[0] + padX, y: pdfY(currY + padY + i * fs * LINE_H) - fs * 0.8, size: fs, font: fontR, color: rgb(0,0,0) });
      }
      for (let i = 0; i < aLines.length; i++) {
        page.drawText(aLines[i], { x: ML + qColW[0] + qColW[1] + padX, y: pdfY(currY + padY + i * fs * LINE_H) - fs * 0.8, size: fs, font: fontR, color: rgb(0,0,0) });
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
  ensureSpace(secFs * LINE_H + 12);
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
  drawQRow('02', '(A) DATE ON WHICH THE VALUATION IS MADE:', fields.valuationDate);
  drawQRow('', '(B) DATE OF INSPECTION:', fields.inspectionDate);
  drawQRow('', '(C) DATE OF VALUATION REPORT', fields.reportDate);
  const cleanIdentified = fields.identifiedBy ? fields.identifiedBy.replace(/^\(?D\)?\s*IDENTIFIED BY WHOM:?\s*/i, '').trim() : '';
  drawQRow('', '(D) IDENTIFIED BY WHOM:', cleanIdentified);
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
  drawQRow('12', 'AREA OF THE LAND SUPPORTED BY DOCUMENTARY PROOF, SHAPE, DIMENSIONS AND PHYSICAL FEATURES:', `${fields.landArea} ${fields.landAreaUnit}, ${fields.landShape}, ${fields.landLevel}`);
  const cleanRoadAccess = fields.roadAccess ? fields.roadAccess.replace(/^13\s*ROADS,?\s*STREETS\s*OR\s*LANES\s*ON\s*WHICH\s*THE\s*LAND\s*IS\s*ABUTTING\.?\s*/i, '').trim() : '';
  drawQRow('13', 'ROADS, STREETS OR LANES ON WHICH THE LAND IS ABUTTING.', cleanRoadAccess);
  drawQRow('14', 'IS IT FREE HOLD OR LEASE HOLD LAND?', fields.landTenure);
  drawQRow('15', 'IF LEASE HOLD, THE NAME OF LEASER/LESSEE, NATURE OF LEASE, DATES OF COMMENCEMENT AND TERMINATION OF LEASE AND TERMS OF RENEWAL OF LEASE.', fields.leaseDetails);
  drawQRow('16', 'IS THERE ANY RESTRICTIVE COVENANT IN REGARD TO USE OF LAND? IF SO, ATTACH A COPY OF THE COVENANT.', fields.restrictiveCovenant);
  drawQRow('17', 'ARE THERE ANY AGREEMENT OF EASEMENTS? IF SO, ATTACH COPIES.', fields.easements);
  drawQRow('18', 'HAS ANY CONTRIBUTION BEEN MADE TOWARDS DEVELOPMENT OR IS ANY DEMAND FOR SUCH CONTRIBUTION STILL OUT STANDING?', fields.developmentContribution);
  drawQRow('19', 'HAS THE WHOLE OR PART OF THE LAND BEEN NOTIFIED FOR ACQUISITION BY GOVERNMENT OR ANY STATUTORY BODY? GIVE DATE OF THE NOTIFICATION', 'NO SUCH PARTICULARS ARE OBSERVED BY US');
  drawQRow('20', 'ATTACH A DIMENSION SITE PLAN.', 'SITE PLAN IS ATTACHED (GPS LOCATION MAP ATTACHED)');
  advanceCursor(6);

  // TABLE C — IMPROVEMENT
  drawQHeader('IMPROVEMENT');
  drawQRow('21', 'ATTACH PLANS AND ELEVATIONS OF ALL STRUCTURES STANDING ON THE LAND AND LAY-OUT PLAN.', fields.plansAttached);
  drawQRow('22', 'FURNISH TECHNICAL DETAILS OF THE BUILDING ON A SEPARATE SHEET [THE ANNEXURE TO THIS FORM MAY BE USED]', fields.technicalDetails);
  drawQRow('23', 'IS THE BUILDING OWNER-OCCUPIED / TENANTED / BOTH? IF PARTLY OWNER OCCUPIED, SPECIFY PORTION AND EXTENT OF AREA UNDER OWNER OCCUPATION.', `(I) ${fields.tenancyStatus}\n(II) ${fields.tenancyPortionDetails || 'NOT APPLICABLE'}`);
  drawQRow('24', 'WHAT IS THE FLOOR SPACE INDEX PERMISSIBLE AND PERCENTAGE ACTUALLY UTILIZED?', fields.fsi);
  advanceCursor(6);

  // TABLE D — RENT
  drawQHeader('RENT');
  const q25Items = [
    { q: '(I) NAME OF TENANT/LESSEES/LICENSEES, ETC.', a: fields.tenantName || 'NOT APPLICABLE' },
    { q: '(II) PORTION IN THEIR OCCUPATION', a: fields.tenantPortion || 'NOT APPLICABLE' },
    { q: '(III) MONTHLY OR ANNUAL RENT/COMPENSATION/LICENSE FEE, ETC. PAID BY EACH.', a: fields.tenantRent || 'NOT APPLICABLE' },
    { q: '(IV) GROSS AMOUNT RECEIVED FOR THE WHOLE PROPERTY:', a: fields.tenantGrossAmount || 'NOT APPLICABLE' }
  ];
  drawQRowMulti('25', q25Items);
  drawQRow('26', 'ARE ANY OF THE OCCUPANTS RELATED TO, OR CLOSE BUSINESS ASSOCIATES OF THE OWNER?', fields.relatedOccupants);
  drawQRow('27', 'IS SEPARATE AMOUNT BEING RECOVERED FOR THE USE OF FIXTURES LIKE FANS, GEYSERS, REFRIGERATORS, COOKING RANGES, BUILT IN WARDROBES, ETC., OR FOR SERVICE CHARGES? IF SO GIVE DETAILS.', fields.fixtures);
  drawQRow('28', 'GIVE DETAILS OF WATER AND ELECTRICITY CHARGES, IF ANY, TO BE BORNE BY THE OWNER.', fields.waterElectricCharges);
  drawQRow('29', 'IF A PUMP IS INSTALLED, WHO HAS TO BEAR THE COST AND MAINTENANCE AND OPERATION--OWNER OR TENANT.', fields.pumpMaintenance);
  drawQRow('30', 'WHO IS TO BEAR THE COST OF ELECTRICITY CHARGES FOR LIGHTING OF COMMON SPACE LIKE ENTRANCE HALL, STAIRS, PASSAGES, COMPOUND, ETC.--OWNER OR TENANT.', fields.commonElectricity);
  drawQRow('31', 'WHAT IS THE AMOUNT OF PROPERTY TAX? WHO IS TO BEAR IT? GIVE DETAILS WITH DOCUMENTARY PROOF.', fields.propertyTax || 'NOT APPLICABLE');
  drawQRow('32', 'IS THE BUILDING INSURED? IF SO, GIVE THE POLICY NO., AMOUNT FOR WHICH IT IS INSURED AND ANNUAL PREMIUM.', fields.buildingInsured);
  drawQRow('33', 'IF ANY DISPUTE BETWEEN LAND LORD AND TENANT REGARDING RENT PENDING IN COURT OF LAW?', fields.landlordTenantDispute);
  drawQRow('34', 'HAS ANY STANDARD RENT BEEN FIXED FOR THE PREMISES UNDER ANY LAW RELATING TO CONTROL OF RENT?', fields.standardRent);
  advanceCursor(6);

  // TABLE E — SALES
  drawQHeader('SALES');
  drawQRow('35', 'GIVE INSTANCES OF SALES OF IMMOVABLE PROPERTY IN THE LOCALITY ON A SEPARATE SHEET, INDICATING THE NAME AND ADDRESS OF THE PROPERTY, REGISTRATION NO., SALE PRICE AND AREA OF LAND SOLD:', fields.saleInstances);

  // Build Q36 formatted sentence from structured rate inputs
  const q36Rate = fields.landRatePerUnit ? Number(fields.landRatePerUnit).toLocaleString('en-IN') : '';
  const q36Unit = fields.landRateUnit || 'DEC';
  const q36LandArea = fields.landArea || '';
  const q36LandAreaUnit = fields.landAreaUnit || q36Unit;
  const q36Total = computedLandValue ? formatIndianCurrency(computedLandValue) : (fields.totalLandValue || '');
  const q36Text = q36Rate
    ? `THE RATE IS ABOUT RS.${q36Rate}/-PER ${q36Unit}. HENCE TOTAL VALUE OF THE LAND AS APPEARING IN THE ROR= ${q36LandArea} ${q36LandAreaUnit} @ RS.${q36Rate}/-PER ${q36Unit} =RS.${q36Total}/-`
    : (fields.landRate || '');
  drawQRow('36', 'LAND RATE ADOPTED IN THIS VALUATION:', q36Text);
  drawQRow('37', 'IF SALE INSTANCES ARE NOT AVAILABLE OR NOT RELIED UPON, THE BASIS OF ARRIVING AT THE LAND RATE.', fields.landRateBasis);
  advanceCursor(6);

  // TABLE F — COST OF CONSTRUCTION
  drawQHeader('COST OF CONSTRUCTION');
  drawQRow('38', 'YEAR OF COMMENCEMENT OF CONSTRUCTION AND YEAR OF COMPLETION:', fields.constructionStartYear ? `COMMENCEMENT IN THE YEAR: ${fields.constructionStartYear}, COMPLETED IN YEAR: ${fields.constructionEndYear}` : 'NOT APPLICABLE');
  drawQRow('39', 'WHAT WAS THE METHOD OF CONSTRUCTION--BY CONTRACT / BY EMPLOYING LABOUR DIRECTLY / BOTH?', fields.constructionMethod);
  drawQRow('40', 'FOR ITEMS OF WORK DONE ON CONTRACT, PRODUCE COPIES OF AGREEMENTS.', fields.contractAgreements);
  drawQRow('41', 'FOR ITEMS OF WORK DONE BY ENGAGING LABOUR DIRECTLY, GIVE BASIC RATES OF MATERIALS AND SUPPORTED BY DOCUMENTARY PROOF:', fields.materialRates);
  drawQRow('42', 'BUILDING APPROVAL PLAN IF ANY', fields.buildingApproval || 'NOT APPLICABLE');
  advanceCursor(12);

  // ═══════════════════════════════════════════════════════
  // BLOCK 3 — PART II: VALUATION
  // ═══════════════════════════════════════════════════════
  drawText('PART II-VALUATION', { bold: true, fontSize: 14 });
  advanceCursor(6);
  drawText('HERE THE REGISTERED VALUER SHOULD DISCUSS IN DETAIL HIS APPROACH TO VALUATION OF THE PROPERTY AND INDICATE HOW THE VALUE HAS BEEN ARRIVED AT, SUPPORTED BY NECESSARY CALCULATION.');
  advanceCursor(6);
  if (fields.valuationYear) {
    drawText(`VALUATION HAS BEEN PROVIDED FOR THE YEAR ${fields.valuationYear} AT THE REQUEST OF THE CUSTOMER IN ORDER TO ACCESS THE VALUE OF PROPERTY POST COMPLETION OF CONSTRUCTION IN THE YEAR ${fields.completionYear || fields.valuationYear}.`);
  }
  advanceCursor(4);
  for (const bullet of fields.valuationBullets) {
    if (bullet.trim()) {
      drawText(`• ${bullet.trim()}`);
      advanceCursor(2);
    }
  }
  advanceCursor(12);

  // ═══════════════════════════════════════════════════════
  // BLOCK 4 — PART III: DECLARATION
  // ═══════════════════════════════════════════════════════
  drawText('PART III-DECLARATION', { bold: true, fontSize: 14 });
  advanceCursor(6);
  drawText('I HEREBY DECLARE THAT-');
  drawText(`• THE INFORMATION FURNISHED IN PART I IS TRUE TO THE BEST OF MY KNOWLEDGE AND BELIEF.`);
  drawText(`• I HAVE NO DIRECT OR INDIRECT INTEREST IN THE PROPERTY VALUED.`);
  drawText(`• I HAVE PERSONALLY INSPECTED THE PROPERTY ON ${fields.inspectionDate}`);
  advanceCursor(12);

  // Date + Signature
  ensureSpace(40);
  const dateStr = `DATE–${fields.reportDate}`;
  const sigStr = 'ER. SATYAJIT MOHANTY';
  page.drawText(dateStr, { x: ML, y: pdfY(cy) - 10, size: 12, font: fontR, color: rgb(0, 0, 0) });
  const sigW = fontR.widthOfTextAtSize(sigStr, 12);
  page.drawText(sigStr, { x: A4_W - MR - sigW, y: pdfY(cy) - 10, size: 12, font: fontR, color: rgb(0, 0, 0) });
  cy += 18;
  page.drawText('PLACE–BHUBANESWAR', { x: ML, y: pdfY(cy) - 10, size: 12, font: fontR, color: rgb(0, 0, 0) });
  const sigLabel = 'SIGNATURE OF REGISTERED VALUER';
  const sigLW = fontR.widthOfTextAtSize(sigLabel, 12);
  page.drawText(sigLabel, { x: A4_W - MR - sigLW, y: pdfY(cy) - 10, size: 12, font: fontR, color: rgb(0, 0, 0) });
  cy += 18;
  advanceCursor(16);

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

    // Technical Details Header Table
    const thCols = [CW * 0.20, CW * 0.20, CW * 0.15, CW * 0.15, CW * 0.15, CW * 0.15];
    const thH = 20;
    ensureSpace(thH * 2);
    
    // Draw cells for row 1
    let thX = ML;
    drawCell(thX, cy, thCols[0], thH * 2, 'TECHNICAL\nDETAILS', { bold: true });
    thX += thCols[0];
    drawCell(thX, cy, thCols[1], thH, 'MAIN\nBUILDING', { bold: true });
    thX += thCols[1];
    drawCell(thX, cy, thCols[2], thH, 'ANNEXES', { bold: true });
    thX += thCols[2];
    drawCell(thX, cy, thCols[3], thH, 'SERVANTS\nQUARTERS', { bold: true });
    thX += thCols[3];
    drawCell(thX, cy, thCols[4], thH, 'GARAGE', { bold: true });
    thX += thCols[4];
    drawCell(thX, cy, thCols[5], thH, 'PUMP\nHOUSE', { bold: true });
    
    // Draw cells for row 2
    thX = ML + thCols[0];
    const cy2 = cy + thH;
    drawCell(thX, cy2, thCols[1], thH, fields.annexMainBuilding || '1 NOS', { bold: true });
    thX += thCols[1];
    drawCell(thX, cy2, thCols[2], thH, fields.annexAnnexes || 'NIL', { bold: true });
    thX += thCols[2];
    drawCell(thX, cy2, thCols[3], thH, fields.annexServantsQuarters || 'NIL', { bold: true });
    thX += thCols[3];
    drawCell(thX, cy2, thCols[4], thH, fields.annexGarage || 'NIL', { bold: true });
    thX += thCols[4];
    drawCell(thX, cy2, thCols[5], thH, fields.annexPumpHouse || 'NIL', { bold: true });
    
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

    drawQRow('01', 'NO. OF FLOORS AND HEIGHT OF EACH FLOOR:', q01Ans);

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

    drawQRow('02', 'PLINTH AREA FLOOR-WISE(AS PER ISI3861-1966): (AS PER ACTUAL)', q02ActualAns);
    drawQRow('', `PLINTH AREA FLOOR-WISE(AS PER ISI3861-1966): (AS PER ${authority} APPROVAL PLAN)`, q02ApprovedAns);

    // Q03-Q06
    drawQRow('03', 'YEAR OF CONSTRUCTION:', fields.techYearConstruction);
    drawQRow('04', 'ESTIMATED FUTURE LIFE:', fields.techFutureLife);
    drawQRow('05', 'TYPE OF CONSTRUCTION:', fields.techConstructionType);
    drawQRow('06', 'TYPE OF FOUNDATION:', fields.techFoundation);

    // Q07 Walls split
    const q07Items = [
      { q: '(A) BASEMENT AND PLINTH', a: fields.techWallsBasement || 'NOT APPLICABLE' },
      { q: '(B) GROUND FLOOR', a: fields.techWallsGround || 'NOT APPLICABLE' }
    ];
    drawQRowMulti('07', q07Items);

    // Q08-Q20
    drawQRow('08', 'PARTITIONS:', fields.techPartitions);
    drawQRow('09', 'DOORS & WINDOWS:', fields.techDoorsWindows);
    drawQRow('10', 'FLOORING:', fields.techFlooring);
    drawQRow('11', 'FINISHING (INTERNAL/EXTERNAL):', fields.techFinishing);
    drawQRow('12', 'ROOFING & TERRACING:\nARCHITECTURAL FEATURES:', `${fields.techRoofing}\n${fields.techArchitecturalFeatures}`);
    drawQRow('13', 'TYPE OF WIRING AND CLASS:', fields.techWiring);
    drawQRow('14', 'SANITARY INSTALLATION:', fields.techSanitary);
    drawQRow('15', 'COMPOUND WALL:', fields.techCompoundWall);
    drawQRow('16', 'LIFTS:', fields.techLifts);
    drawQRow('17', 'OVERHEAD WATER TANK:', fields.techOverheadTank);
    drawQRow('18', 'PUMP:\nUNDERGROUND SUMP:', `${fields.techPump}\n${fields.techUndergroundSump}`);
    drawQRow('19', 'ROADS AND PAVING:', fields.techRoadsPaving);
    drawQRow('20', 'SEWAGE DISPOSAL:', fields.techSewageDisposal);
    
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
      drawCell(cx, cy, calcCols[i], headerH, calcHeaders[i], { bold: true, fontSize: 8, align: 'center' });
      cx += calcCols[i];
    }
    cy += headerH;

    // Data rows
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
        drawCell(cx, cy, calcCols[i], rowH, vals[i], { fontSize: 8, align: 'center' });
        cx += calcCols[i];
      }
      cy += rowH;
    }

    // Building value summary row
    ensureSpace(22);
    drawCell(ML, cy, CW * 0.6, 22, `VALUE OF THE BUILDING: RS.${formatIndianCurrency(computedBuildingValue)}/-`, { bold: true, fontSize: 10, align: 'center' });
    drawCell(ML + CW * 0.6, cy, CW * 0.4, 22, `RS.${formatIndianCurrency(computedBuildingValue)}/-`, { bold: true, fontSize: 10, align: 'center' });
    cy += 22;
    advanceCursor(8);
  }

  // TABLE J — EXTRA ITEMS
  ensureSpace(40);
  drawCell(ML, cy, CW, 20, 'EXTRA ITEM', { bold: true, align: 'center' });
  cy += 20;
  drawCell(ML, cy, CW * 0.7, 18, 'PARTICULARS', { bold: true });
  drawCell(ML + CW * 0.7, cy, CW * 0.3, 18, 'AMOUNT', { bold: true, align: 'center' });
  cy += 18;
  for (const item of fields.extraItems) {
    ensureSpace(18);
    drawCell(ML, cy, CW * 0.7, 18, item.description);
    drawCell(ML + CW * 0.7, cy, CW * 0.3, 18, `RS.${formatIndianCurrency(item.amount)}/-`, { align: 'center' });
    cy += 18;
  }
  drawCell(ML, cy, CW * 0.7, 20, 'TOTAL', { bold: true });
  drawCell(ML + CW * 0.7, cy, CW * 0.3, 20, `RS.${formatIndianCurrency(computedExtraTotal)}/-`, { bold: true, align: 'center' });
  cy += 20;
  advanceCursor(8);

  // TABLE K — TOTAL ABSTRACT
  ensureSpace(100);
  drawCell(ML, cy, CW, 22, 'TOTAL ABSTRACT FOR THE ENTIRE PROPERTY', { bold: true, align: 'center' });
  cy += 22;
  const absRows = [
    ['LAND', `RS.${formatIndianCurrency(computedLandValue)}/-`],
    ['BUILDING', `RS.${formatIndianCurrency(computedBuildingValue)}/-`],
    ['EXTRA ITEMS', `RS.${formatIndianCurrency(computedExtraTotal)}/-`],
    ['TOTAL', `RS.${formatIndianCurrency(computedTotalProperty)}/-`],
  ];
  for (const [label, val] of absRows) {
    drawCell(ML, cy, CW * 0.65, 20, label, { bold: true });
    drawCell(ML + CW * 0.65, cy, CW * 0.35, 20, val, { bold: true, align: 'center' });
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
  drawText('VALUATION CERTIFICATE', { bold: true });
  advanceCursor(6);
  drawText(`AS A RESULT OF MY APPRAISAL AND ANALYSIS IT IS MY CONSIDERED OPINION THAT THE ESTIMATED FAIR MARKET VALUE OF THE PROPERTY (${fields.propertyType}) BY ${fields.ownerName.toUpperCase()} BEARING ${fields.propertyDescription ? fields.propertyDescription.toUpperCase().substring(0, 200) : '________'} AS ON ${fields.valuationDate || '________'} IS RS.${formatIndianCurrency(computedTotalProperty)}/- (${rupeesInWords(computedTotalProperty).toUpperCase()})`);
  advanceCursor(12);

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

  // ═══════════════════════════════════════════════════════
  // BLOCK 10 — LAND ANNEXURE (Multi-Plot Properties)
  // ═══════════════════════════════════════════════════════
  if (fields.showLandAnnexure && fields.landAnnexureRows && fields.landAnnexureRows.length > 0) {
    ensureSpace(60);
    const annxHeaderStr = 'ANNEXURE (LAND DETAILS)';
    const annxHeaderFs = 14;
    const annxHeaderW = fontB.widthOfTextAtSize(annxHeaderStr, annxHeaderFs);
    const annxHeaderX = ML + (CW - annxHeaderW) / 2;
    page.drawText(annxHeaderStr, { x: annxHeaderX, y: pdfY(cy) - annxHeaderFs * 0.8, size: annxHeaderFs, font: fontB, color: rgb(0,0,0) });
    page.drawLine({ start: { x: annxHeaderX, y: pdfY(cy) - annxHeaderFs * 0.8 - 2 }, end: { x: annxHeaderX + annxHeaderW, y: pdfY(cy) - annxHeaderFs * 0.8 - 2 }, thickness: 1, color: rgb(0,0,0) });
    cy += annxHeaderFs * LINE_H + 12;

    const annxCols = [CW * 0.1, CW * 0.2, CW * 0.2, CW * 0.2, CW * 0.3];
    const annxHeaders = ['SL NO', 'KHATA NO', 'PLOT NO', 'AREA', 'MOUZA'];
    const headerH = 20;
    ensureSpace(headerH);
    let cx = ML;
    for (let i = 0; i < annxHeaders.length; i++) {
      drawCell(cx, cy, annxCols[i], headerH, annxHeaders[i], { bold: true, fontSize: 10, align: 'center' });
      cx += annxCols[i];
    }
    cy += headerH;

    for (const row of fields.landAnnexureRows) {
      const rowH = 18;
      ensureSpace(rowH);
      cx = ML;
      const vals = [row.slNo, row.khataNo, row.plotNo, row.area, row.mouza];
      for (let i = 0; i < vals.length; i++) {
        drawCell(cx, cy, annxCols[i], rowH, vals[i] || '', { fontSize: 10, align: 'center' });
        cx += annxCols[i];
      }
      cy += rowH;
    }
    advanceCursor(12);
  }

  // Add page number to last page
  addPageNum(page, pageNum);

  // Generate blob
  const pdfBytes = await doc.save();
  return new Blob([pdfBytes] as any, { type: 'application/pdf' });
}
