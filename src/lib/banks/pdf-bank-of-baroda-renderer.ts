/**
 * pdf-bank-of-baroda-renderer.ts — Dedicated PDF renderer for Bank of Baroda.
 *
 * Section 1 (Cover Page): Double-border cover page with Property Owners, Address,
 * Value of Property, Purpose of Valuation, and Prepared By details.
 * Section 2 (Part I — GENERAL): Inspection details, ownership, location, classification, boundaries.
 * Section 3 (Part II — CHARACTERISTICS): Site environment, infrastructure, remarks.
 * Section 4 (Part A — Land Valuation): Land metrics and estimated value.
 * Section 5 (Part B — Building Valuation): Technical details, structural descriptions, specifications.
 * Section 6 (Valuation & Amenities): Building valuation table, amenities, miscellaneous, services.
 * Section 7 (Abstract & Remarks): Final values abstract table, sign-off.
 * Section 8 (Questionnaire): Declaration questionnaire table.
 * Section 9 (Affirmations): Declaration affirmation statements.
 * Section 10 (Code of Conduct): Model Code of Conduct for Valuers (30 items).
 */

import { rgb } from 'pdf-lib';
import {
  PDFBankRenderer,
  PAGE_W,
  PAGE_H,
  MARGIN_L,
  MARGIN_T,
  MARGIN_B,
  MARGIN_R,
  CONTENT_W,
  FONT_SIZE,
  FONT_SIZE_HEADER,
  FONT_SIZE_TITLE,
  FONT_SIZE_SMALL,
  hexToRgb,
  LINE_HEIGHT,
  formatReportDate
} from '../pdf-bank-renderer';

export class PDFBankOfBarodaRenderer extends PDFBankRenderer {
  private fields: any;
  private drawnCover = false;
  private isBobDrawing = false;

  constructor(fields?: any) {
    super();
    this.fields = fields || {};
  }

  // ── Helper: field value ──
  override drawKeyValueRow(items: any[]): void { if (this.isBobDrawing) super.drawKeyValueRow(items); }
  override drawTextBlock(text: string, opts?: any): void { if (this.isBobDrawing) super.drawTextBlock(text, opts); }
  override drawRichTextBlock(segments: any[]): void { if (this.isBobDrawing) super.drawRichTextBlock(segments); }

  private fv(key: string, defaultVal = ''): string {
    return String((this.fields as any)[key] ?? defaultVal).replace(/[\t\n\r]+/g, ' ').trim();
  }

  /** Extract Year of Construction: labeled pattern first, then smallest year */
  private extractYearOfConstruction(): number {
    const raw = this.fv('bobYearOfConstruction');
    if (!raw) return 0;
    const labeledMatch = raw.match(/year\s*of\s*construction\s*[-\u2013\u2014:]\s*(\d{4})/i);
    if (labeledMatch) return parseInt(labeledMatch[1]);
    const allYears = Array.from(raw.matchAll(/(\d{4})/g)).map(m => parseInt(m[1])).filter(y => y >= 1900 && y <= 2100);
    return allYears.length > 0 ? Math.min(...allYears) : 0;
  }

  // ── Helper: drawSimpleRow override for BOB 40/60 layout ──
  override drawSimpleRow(label: string, value: string, highlight?: boolean, bold?: boolean): void {
    if (!this.isBobDrawing) return;
    const labelW = Math.round(CONTENT_W * 0.40);
    const valueW = CONTENT_W - labelW;
    super.drawKeyValueRow([{
      label,
      value: value || 'NA',
      labelWidth: labelW,
      valueWidth: valueW,
      highlight,
      labelBold: true,
      valueBold: !!bold,
    }]);
  }

  /**
   * Override drawCenteredTitle to intercept the first call from BankReportBuilder
   * and draw the BOB cover page + all custom sections.
   */
  override drawCenteredTitle(title: string, fontSize?: number, underline?: boolean) {
    if (!this.drawnCover) {
      this.drawnCover = true;
      this.isBobDrawing = true;
      this.drawBobCoverPage();
      this.newPage();
      this.drawBobSection2();
      this.drawBobSection3();
      this.drawBobSection4();
      this.drawBobSection5();
      this.drawBobSection6();
      this.drawBobSection7();
      this.drawBobSection8();
      this.drawBobSection9();
      this.drawBobSection10();
      this.drawBobSection11();
      this.isBobDrawing = false;
      return;
    }

    if (this.isBobDrawing) {
      const isValuationReport = title.trim().toLowerCase() === 'valuation report';
      const finalTitle = isValuationReport
        ? 'VALUATION REPORT FOR BANK OF BARODA'
        : title;
      super.drawCenteredTitle(finalTitle, fontSize, isValuationReport ? true : underline);
    }
  }

  override drawSectionHeader(title: string, addSpaceBefore?: boolean, preserveCase?: boolean) {
    if (!this.isBobDrawing) return;
    if (title.toUpperCase() === 'CASE DETAILS & REPORT METADATA') {
      if (this.doc.getPages().length === 1) {
        this.newPage();
      }
      super.drawCenteredTitle('VALUATION REPORT', FONT_SIZE_TITLE, false);
      super.drawCenteredTitle('FOR BANK OF BARODA', FONT_SIZE_TITLE, true);
      this.cursorY += 15;
    }
    super.drawSectionHeader(title, addSpaceBefore, preserveCase);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SECTION 1: COVER PAGE
  // ═══════════════════════════════════════════════════════════════════════
  private drawBobCoverPage() {
    const fields = this.fields;

    this.cursorY = 60;

    const bmx = 36;
    const bmyTop = MARGIN_T + 4;   // just below the letterhead header
    const bmyBot = MARGIN_B + 4;   // just above the letterhead footer
    const borderColor = hexToRgb('#8B6914'); // dark goldenrod — matches reference doc border

    // Outer border (thick)
    this.page.drawRectangle({
      x: bmx, y: bmyBot,
      width: PAGE_W - 2 * bmx, height: PAGE_H - bmyBot - bmyTop,
      borderColor: borderColor, borderWidth: 3,
    });
    // Inner border (thin) — 5pt inset from outer
    this.page.drawRectangle({
      x: bmx + 5, y: bmyBot + 5,
      width: PAGE_W - 2 * bmx - 10, height: PAGE_H - bmyBot - bmyTop - 10,
      borderColor: borderColor, borderWidth: 1,
    });

    // Helper: draw centered bold text with optional underline on EVERY line
    const drawCenteredBold = (text: string, size: number, ySpaceAfter: number, underline: boolean = false) => {
      const cleanText = this.sanitizeText(text);
      const maxWidth = PAGE_W - 2 * bmx - 140;
      const lines = this.wrapText(cleanText, maxWidth, size, true);

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const tw = this.fontBold.widthOfTextAtSize(line, size);
        const startX = MARGIN_L + (CONTENT_W - tw) / 2;
        const startY = this.pdfY(this.cursorY);
        this.page.drawText(line, { x: startX, y: startY, size, font: this.fontBold, color: rgb(0, 0, 0) });
        if (underline) {
          this.page.drawLine({
            start: { x: startX, y: startY - 2 },
            end: { x: startX + tw, y: startY - 2 },
            thickness: 1, color: rgb(0, 0, 0)
          });
        }
        if (i < lines.length - 1) {
          this.cursorY += size + 4;
        } else {
          this.cursorY += ySpaceAfter;
        }
      }
    };

    // ── 1. Main Title ──
    // "REPORT ON VALUATION OF" — bold, NO underline
    drawCenteredBold('REPORT ON VALUATION OF', FONT_SIZE_TITLE + 3, 25, false);
    // "IMMOVABLE PROPERTIES" — bold, underlined
    drawCenteredBold('IMMOVABLE PROPERTIES', FONT_SIZE_TITLE + 3, 30, true);

    // ── 2a. Bank & Branch Details ──
    const bankBranch = this.fv('bobBankBranchDetails');
    if (bankBranch) {
      drawCenteredBold(bankBranch, FONT_SIZE, 20); // increased bottom space before AS ON DATE
    }

    // ── 2b. As On Date (Subheading style spacing) ──
    const asOnDate = this.fv('bobAsOnDate');
    if (asOnDate) {
      drawCenteredBold(`AS ON DATE: ${formatReportDate(asOnDate)}`, FONT_SIZE_HEADER - 1, 48); // larger font, larger bottom space
    }

    // ── 2c. Full Legal Property Description (no heading, just the value) ──
    const legalDesc = this.fv('bobFullLegalPropertyDescription');
    if (legalDesc) {
      drawCenteredBold(legalDesc, FONT_SIZE_SMALL + 1, 25);
    }

    // ── 3. NAME OF THE OWNER (underlined subheading) ──
    drawCenteredBold('NAME OF THE OWNER', FONT_SIZE_HEADER, 14, true);

    // ── 4a. Owner details with address ──
    const owners = Array.isArray(fields.bobPropertyOwners) && fields.bobPropertyOwners.length > 0
      ? fields.bobPropertyOwners
      : [{ name: '', relationship: 'S/O', relativeName: '', fatherName: '' }];
    const validOwners = owners.filter((o: any) => o.name);
    const address = this.fv('bobAddressOfTheProperty');

    if (validOwners.length > 0) {
      const ownerStrings = validOwners.map((owner: any) => {
        const rel = owner.relationship || 'S/O';
        const relName = owner.relativeName || owner.fatherName;
        return relName ? `${owner.name}, ${rel}: ${relName}` : owner.name;
      });
      let ownersText = '';
      if (ownerStrings.length === 1) ownersText = ownerStrings[0];
      else if (ownerStrings.length === 2) ownersText = ownerStrings.join(' & ');
      else { const last = ownerStrings.pop(); ownersText = ownerStrings.join(', ') + ' & ' + last; }
      
      // Append address logic: Prevent duplicate "At:"
      if (address) {
        const cleanAddr = address.trim();
        if (/^at\s*:/i.test(cleanAddr)) {
          ownersText += `, ${cleanAddr}`;
        } else {
          ownersText += `, At: ${cleanAddr}`;
        }
      }
      drawCenteredBold(ownersText, FONT_SIZE, 14);
    } else {
      drawCenteredBold('NA', FONT_SIZE, 14);
    }
    this.cursorY += 10;

    // ── 4b. Value of the Property (2-column grid) ──
    const dimensions = this.fields.bobDimensions || {};
    const deedArea = (parseFloat(dimensions.deedEast || '0') || 0) + (parseFloat(dimensions.deedWest || '0') || 0) + (parseFloat(dimensions.deedNorth || '0') || 0) + (parseFloat(dimensions.deedSouth || '0') || 0);
    const actualArea = (parseFloat(dimensions.actualEast || '0') || 0) + (parseFloat(dimensions.actualWest || '0') || 0) + (parseFloat(dimensions.actualNorth || '0') || 0) + (parseFloat(dimensions.actualSouth || '0') || 0);
    const minArea = (deedArea > 0 && actualArea > 0) ? Math.min(deedArea, actualArea) : (deedArea || actualArea || 0);
    const areaSft = minArea * 43560;

    const acreValue = parseFloat(this.fv('bobGovtBenchmarkPerAcre', '0')) || 0;
    const sftRate = acreValue > 0 ? Math.round(acreValue / 43560) : 0;
    const landGovtValue = areaSft > 0 && sftRate > 0 ? Math.round(areaSft * sftRate) : 0;

    const adoptedRate = parseFloat(this.fv('bobAdoptedRate', '0')) || 0;
    const calculatedLandMarketValue = areaSft > 0 && adoptedRate > 0 ? Math.round(areaSft * adoptedRate) : 0;
    const landMarketValue = this.fields.bobEstimatedLandValueEditOn
      ? (parseFloat(this.fv('bobEstimatedLandValue', '0')) || 0)
      : calculatedLandMarketValue;

    const currentYear = new Date().getFullYear();
    const yearOfConstStr = this.fv('bobYearOfConstruction', '');
    const yearMatch = yearOfConstStr.match(/\d{4}/);
    const yearOfConst = yearMatch ? parseInt(yearMatch[0], 10) : 0;
    const bAge = this.fields.bobBuildingAgeEditOn ? (parseFloat(this.fv('bobBuildingAge', '0')) || 0) : (yearOfConst > 0 ? currentYear - yearOfConst : 0);
    
    const buildingRows: any[] = this.fields.bobBuildingValuationRows || [];
    const buildingMarketValue = buildingRows.reduce((sum: number, row: any) => {
      const p = parseFloat(row.plinthArea || '0') || 0;
      const r = parseFloat(row.replacementRate || '0') || 0;
      const est = row.estCostEditOn ? (parseFloat(row.estCost || '0') || 0) : p * r;
      const dep = row.depreciationEditOn ? (parseFloat(row.depreciation || '0') || 0) : est * 0.01 * bAge;
      const net = row.netValueEditOn ? (parseFloat(row.netValue || '0') || 0) : est - dep;
      return sum + net;
    }, 0);

    const amenitiesMarketValue = Array.from({ length: 10 }, (_, i) => parseFloat(this.fv(`bobAmenity_${i}`, '0')) || 0).reduce((a, b) => a + b, 0);
    const miscMarketValue = Array.from({ length: 4 }, (_, i) => parseFloat(this.fv(`bobMisc_${i}`, '0')) || 0).reduce((a, b) => a + b, 0);
    const servicesMarketValue = Array.from({ length: 5 }, (_, i) => parseFloat(this.fv(`bobService_${i}`, '0')) || 0).reduce((a, b) => a + b, 0);

    const calcTotalGovt = landGovtValue + amenitiesMarketValue + miscMarketValue + servicesMarketValue;
    const calcTotalMarket = landMarketValue + buildingMarketValue + amenitiesMarketValue + miscMarketValue + servicesMarketValue;
    const calcTotalRealizable = calcTotalMarket * 0.95;
    const calcTotalDistress = calcTotalMarket * 0.85;

    const presentMarketValue = Math.round(calcTotalMarket / 1000) * 1000;
    const realizableValue = Math.round(calcTotalRealizable / 1000) * 1000;
    const forcedSaleValue = Math.round(calcTotalDistress / 1000) * 1000;
    const govtValue = Math.round(calcTotalGovt / 1000) * 1000;

    const formatVal = (val: number) => {
      return val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const valueLabels = [
      { label: 'PRESENT MARKET VALUE', val: presentMarketValue },
      { label: 'REALIZABLE VALUE', val: realizableValue },
      { label: 'FORCED SALE VALUE', val: forcedSaleValue },
      { label: 'GOVT. VALUE', val: govtValue },
    ];

    const labelColW = Math.round(CONTENT_W * 0.42);
    const valueColW = Math.round(CONTENT_W * 0.42);
    const gridTotalW = labelColW + valueColW;
    const gridStartX = MARGIN_L + (CONTENT_W - gridTotalW) / 2;

    for (const item of valueLabels) {
      const valText = `RS. ${formatVal(item.val)}`;
      const labelY = this.pdfY(this.cursorY);
      this.page.drawText(item.label, { x: gridStartX, y: labelY, size: FONT_SIZE, font: this.fontBold, color: rgb(0, 0, 0) });
      this.page.drawText(valText, { x: gridStartX + labelColW, y: labelY, size: FONT_SIZE, font: this.fontBold, color: rgb(0, 0, 0) });
      this.cursorY += FONT_SIZE + 8;
    }
    this.cursorY += 16;

    // ── 5 & 6. Purpose of Valuation ──
    const purposeText = this.fv('bobPurposeOfValuation') || 'NA';
    // Render as italic bold: "PURPOSE : <value>"
    const purposeStr = `PURPOSE : ${purposeText.toUpperCase()}`;
    const purposeClean = this.sanitizeText(purposeStr);
    const purposeMaxW = PAGE_W - 2 * bmx - 140;
    const purposeLines = this.wrapText(purposeClean, purposeMaxW, FONT_SIZE_SMALL + 1, true);
    for (let i = 0; i < purposeLines.length; i++) {
      const line = purposeLines[i];
      const tw = this.fontBold.widthOfTextAtSize(line, FONT_SIZE_SMALL + 1);
      const startX = MARGIN_L + (CONTENT_W - tw) / 2;
      const startY = this.pdfY(this.cursorY);
      this.page.drawText(line, { x: startX, y: startY, size: FONT_SIZE_SMALL + 1, font: this.fontBold, color: rgb(0, 0, 0) });
      if (i < purposeLines.length - 1) {
        this.cursorY += FONT_SIZE_SMALL + 5;
      } else {
        this.cursorY += 30;
      }
    }

    // ── 7. Prepared By (underlined subheading) ──
    drawCenteredBold('Prepared By', FONT_SIZE_HEADER - 1, 14, true);

    // ── 8. Valuer credential lines ──
    if (this.fv('bobPreparedByValuerName')) drawCenteredBold(this.fv('bobPreparedByValuerName'), FONT_SIZE_SMALL + 1, 16);
    if (this.fv('bobPreparedByGovtReg')) drawCenteredBold(this.fv('bobPreparedByGovtReg'), FONT_SIZE_SMALL + 1, 16);
    if (this.fv('bobPreparedByAcademicDegrees')) drawCenteredBold(this.fv('bobPreparedByAcademicDegrees'), FONT_SIZE_SMALL + 1, 16);
    if (this.fv('bobPreparedByIoVMembership')) drawCenteredBold(this.fv('bobPreparedByIoVMembership'), FONT_SIZE_SMALL + 1, 16);
    if (this.fv('bobPreparedByIoEMembership')) drawCenteredBold(this.fv('bobPreparedByIoEMembership'), FONT_SIZE_SMALL + 1, 16);
    if (this.fv('bobPreparedByCharteredEng')) drawCenteredBold(this.fv('bobPreparedByCharteredEng'), FONT_SIZE_SMALL + 1, 16);
    if (this.fv('bobPreparedByBankEmpanelment')) drawCenteredBold(this.fv('bobPreparedByBankEmpanelment'), FONT_SIZE_SMALL + 1, 16);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SECTION 2: PART I — GENERAL
  // ═══════════════════════════════════════════════════════════════════════
  private drawBobSection2() {
    const addressee = this.fv('bobAddressee') || 'TO,\nTHE BRANCH MANAGER,';
    const bankDetails = this.fv('bobBankBranchDetails') || 'BANK OF BARODA, BARAMUNDA BRANCH, BHUBANESWAR, DIST: KHURDA, ODISHA';
    const reportTitle = this.fv('bobReportTitle') || 'VALUATION REPORT (IN RESPECT OF LAND / SITE AND BUILDING)';
    const refNo = this.fv('bobRefNo') || '';
    const asOnDate = formatReportDate(this.fv('bobAsOnDate') || '');

    // Address block (left-aligned, bold)
    const addressBlock = `${addressee}\n${bankDetails}`.replace(/\\n/g, '\n');
    const addressH = this.drawWrappedTextAt(addressBlock, MARGIN_L, this.cursorY, CONTENT_W, { fontSize: 9, bold: true });
    this.cursorY += addressH + 15;

    // Title Block (centered, bold)
    super.drawCenteredTitle(reportTitle, 10, false);
    this.cursorY += 10;

    // Ref No & Date (bold)
    this.drawTextAt(`REF. NO: ${refNo}`, MARGIN_L, this.cursorY, { fontSize: 9, bold: true });
    const dateStr = `DATE: ${asOnDate}`;
    const dateFont = this.getFont(true);
    const dateW = dateFont.widthOfTextAtSize(dateStr, 9);
    this.drawTextAt(dateStr, PAGE_W - MARGIN_R - dateW, this.cursorY, { fontSize: 9, bold: true });
    this.cursorY += 20;

    this.drawSectionHeader('PART I — GENERAL');
    this.drawSimpleRow('1. Purpose for which the valuation is made', this.fv('bobPurposeForValuation'));
    this.drawKeyValueRow([
      { label: '2a. Date of inspection', value: formatReportDate(this.fv('bobDateOfInspection')), labelWidth: 120, valueWidth: CONTENT_W / 2 - 120 },
      { label: '2b. Date of valuation', value: formatReportDate(this.fv('bobDateOfValuationMade')), labelWidth: 120, valueWidth: CONTENT_W / 2 - 120 },
    ]);
    this.drawSimpleRow('3. Documents produced', [
      this.fv('bobDocumentI') ? `i) ${this.fv('bobDocumentI')}` : '',
      this.fv('bobDocumentII') ? `ii) ${this.fv('bobDocumentII')}` : '',
      this.fv('bobDocumentIII') ? `iii) ${this.fv('bobDocumentIII')}` : '',
    ].filter(Boolean).join(', ') || 'NA');
    this.drawSimpleRow('4. Name & address of owner(s)', this.fv('bobOwnerNamesAddresses'));
    this.drawSimpleRow('5. Brief description of property', this.fv('bobBriefDescription'));

    // Location
    this.drawSimpleRow('6a. Plot No. / Survey No.', this.fv('bobPlotNo'));
    this.drawSimpleRow('6b. Door No.', this.fv('bobDoorNo') || 'NA');
    this.drawSimpleRow('6c. T.S. No. / Village', this.fv('bobTSNoVillage'));
    this.drawSimpleRow('6d. Ward / Taluka', this.fv('bobWardTaluka'));
    this.drawSimpleRow('6e. Mandal / District', this.fv('bobMandalDistrict'));
    const postalAddress = this.fv('bobPostalAddress') || '';
    const pinCode = this.fv('bobPinCode');
    const finalPostal = pinCode ? (postalAddress ? `${postalAddress}. Pin: ${pinCode}` : `Pin: ${pinCode}`) : postalAddress;
    this.drawSimpleRow('7. Postal address', finalPostal);
    this.drawSimpleRow('8a. City / Town', this.fv('bobCityTown') || 'NA');
    this.drawSimpleRow('8b. Residential Area', this.fv('bobResidentialArea') || 'NA');
    this.drawSimpleRow('8c. Commercial Area', this.fv('bobCommercialArea') || 'NA');
    this.drawSimpleRow('8d. Industrial Area', this.fv('bobIndustrialArea') || 'NA');
    this.drawSimpleRow('9i. Classification (High/Middle/Poor)', this.fv('bobClassHighMiddlePoor') || 'NA');
    this.drawSimpleRow('9ii. Classification (Urban/Rural)', this.fv('bobClassUrbanRural') || 'NA');
    this.drawSimpleRow('10. Corporation / Municipality', this.fv('bobCorporationLimit') || 'NA');
    this.drawSimpleRow('11. Covered under enactments', this.fv('bobCoveredUnderEnactments') || 'NA');
    this.drawSimpleRow('12. Agricultural conversion', this.fv('bobAgriculturalConversion') || 'NA');

    // Boundaries table
    const boundaries = this.fields.bobBoundaries || {};
    this.drawTable(
      ['Direction', 'As per Sketch Map', 'As per Verification'],
      [
        ['East', boundaries.sketchEast || '', boundaries.verifyEast || ''],
        ['West', boundaries.sketchWest || '', boundaries.verifyWest || ''],
        ['North', boundaries.sketchNorth || '', boundaries.verifyNorth || ''],
        ['South', boundaries.sketchSouth || '', boundaries.verifySouth || ''],
      ],
      [CONTENT_W * 0.2, CONTENT_W * 0.4, CONTENT_W * 0.4],
      [], [0]
    );

    // Dimensions table
    const dimensions = this.fields.bobDimensions || {};
    this.drawTable(
      ['Direction', 'As per the Deed', 'Actual'],
      [
        ['East', dimensions.deedEast || '', dimensions.actualEast || ''],
        ['West', dimensions.deedWest || '', dimensions.actualWest || ''],
        ['North', dimensions.deedNorth || '', dimensions.actualNorth || ''],
        ['South', dimensions.deedSouth || '', dimensions.actualSouth || ''],
      ],
      [CONTENT_W * 0.2, CONTENT_W * 0.4, CONTENT_W * 0.4],
      [], [0]
    );

    const lat = this.fv('latitude');
    const lon = this.fv('longitude');
    const coords = this.fv('bobCoordinates');
    const latLongStr = [
      lat ? `Latitude: ${lat}` : '',
      lon ? `Longitude: ${lon}` : '',
      coords ? `Coordinates: ${coords}` : ''
    ].filter(Boolean).join(', ');
    this.drawSimpleRow('14.2 Latitude, Longitude and Coordinates of the site', latLongStr || 'NA');
    this.drawSimpleRow('15. Extent of the site', this.fv('bobExtentOfSite'));

    // Calc extent for valuation — SUM all four directional measurements
    const deedArea = (parseFloat(dimensions.deedEast || '0') || 0)
      + (parseFloat(dimensions.deedWest || '0') || 0)
      + (parseFloat(dimensions.deedNorth || '0') || 0)
      + (parseFloat(dimensions.deedSouth || '0') || 0);
    const actualArea = (parseFloat(dimensions.actualEast || '0') || 0)
      + (parseFloat(dimensions.actualWest || '0') || 0)
      + (parseFloat(dimensions.actualNorth || '0') || 0)
      + (parseFloat(dimensions.actualSouth || '0') || 0);
    const minArea = (deedArea > 0 && actualArea > 0) ? Math.min(deedArea, actualArea) : (deedArea || actualArea || 0);
    const sftValue = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(minArea * 43560);
    const calcExtent = minArea > 0 
      ? `Total Area: Ac. ${minArea} Dec i.e. ${sftValue} Sft` 
      : 'Total Area: Ac. 0.00 Dec i.e. 0.00 Sft';
    this.drawSimpleRow('16. Extent considered for valuation', calcExtent);
    this.drawSimpleRow('17. Occupancy', this.fv('bobOccupancy') || 'NA');
    if (this.fv('bobOccupancyDetails')) {
      this.drawSimpleRow('    Tenant details', this.fv('bobOccupancyDetails'));
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SECTION 3: PART II — CHARACTERISTICS OF THE SITE
  // ═══════════════════════════════════════════════════════════════════════
  private drawBobSection3() {
    this.drawSectionHeader('PART II — CHARACTERISTICS OF THE SITE');

    this.drawSimpleRow('1. Classification of locality', this.fv('bobClassificationOfLocality') || 'NA');
    this.drawSimpleRow('2. Development of surrounding areas', this.fv('bobDevelopmentOfSurrounding'));
    this.drawSimpleRow('3. Flooding / sub-merging possibility', this.fv('bobFloodingPossibility') || 'NA');
    this.drawSimpleRow('4. Civic amenities (school, hospital etc.)', this.fv('bobCivicAmenities'));
    this.drawSimpleRow('5. Level of land', this.fv('bobLevelOfLand'));
    this.drawSimpleRow('6. Shape of land', this.fv('bobShapeOfLand'));
    this.drawSimpleRow('7. Type of use', this.fv('bobTypeOfUse'));
    this.drawSimpleRow('8. Usage restriction', this.fv('bobUsageRestriction') || 'NA');
    this.drawSimpleRow('9. Town planning approved layout', this.fv('bobTownPlanningApproved'));
    this.drawSimpleRow('10. Corner / Intermittent plot', this.fv('bobCornerOrIntermittent'));
    this.drawSimpleRow('11. Road facilities', this.fv('bobRoadFacilities'));
    this.drawSimpleRow('12. Type of road', this.fv('bobTypeOfRoad'));
    this.drawSimpleRow('13. Width of road', this.fv('bobWidthOfRoad'));
    this.drawSimpleRow('14. Land-locked land', this.fv('bobLandLocked'));
    this.drawSimpleRow('15. Water potentiality', this.fv('bobWaterPotentiality'));
    this.drawSimpleRow('16. Underground sewerage', this.fv('bobSewerage'));
    this.drawSimpleRow('17. Power supply', this.fv('bobPowerSupply'));
    this.drawSimpleRow('18. Advantage of the site', this.fv('bobAdvantageOfSite'));
    this.drawSimpleRow('19. Special remarks', this.fv('bobSpecialRemarks') || 'NA');
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SECTION 4: PART A — VALUATION OF LAND
  // ═══════════════════════════════════════════════════════════════════════
  private drawBobSection4() {
    this.drawSectionHeader('PART A — VALUATION OF LAND');

    const dimensions = this.fields.bobDimensions || {};

    // Field 1: Size of plot — prefill from 14.1
    const deedNorth = dimensions.deedNorth || '';
    const deedSouth = dimensions.deedSouth || '';
    const deedEast = dimensions.deedEast || '';
    const deedWest = dimensions.deedWest || '';
    const calcNS = (deedNorth && deedSouth && deedNorth !== deedSouth) ? `${deedNorth} & ${deedSouth}` : (deedNorth || deedSouth || '');
    const calcEW = (deedEast && deedWest && deedEast !== deedWest) ? `${deedEast} & ${deedWest}` : (deedEast || deedWest || '');
    const displayNS = this.fields.bobLandSizeNSEditOn ? this.fv('bobLandSizeNS') : calcNS;
    const displayEW = this.fields.bobLandSizeEWEditOn ? this.fv('bobLandSizeEW') : calcEW;

    // Field 2: Total extent — mirror Field 16
    const deedArea = (parseFloat(deedEast || '0') || 0) + (parseFloat(deedWest || '0') || 0) + (parseFloat(deedNorth || '0') || 0) + (parseFloat(deedSouth || '0') || 0);
    const actualArea = (parseFloat(dimensions.actualEast || '0') || 0) + (parseFloat(dimensions.actualWest || '0') || 0) + (parseFloat(dimensions.actualNorth || '0') || 0) + (parseFloat(dimensions.actualSouth || '0') || 0);
    const minArea = (deedArea > 0 && actualArea > 0) ? Math.min(deedArea, actualArea) : (deedArea || actualArea || 0);
    const areaSft = minArea * 43560;
    const areaSftFormatted = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(areaSft);
    const calcTotalExtent = minArea > 0
      ? `Total Area: Ac. ${minArea} Dec i.e. ${areaSftFormatted} Sft`
      : 'Total Area: Ac. 0.00 Dec i.e. 0.00 Sft';
    const displayTotalExtent = this.fields.bobLandTotalExtentEditOn ? this.fv('bobLandTotalExtent') : calcTotalExtent;

    // Field 4: Guideline rate
    const fmtINR = (v: number) => new Intl.NumberFormat('en-IN').format(v);
    const acreValue = parseFloat(this.fv('bobGovtBenchmarkPerAcre', '0')) || 0;
    const sftRate = acreValue > 0 ? Math.round(acreValue / 43560) : 0;
    const totalGuideline = areaSft > 0 && sftRate > 0 ? Math.round(areaSft * sftRate) : 0;
    const guidelineStr1 = acreValue > 0 ? `Govt. Benchmark Value: Rs.${fmtINR(acreValue)}/- Per Acre i.e. Rs.${fmtINR(sftRate)}/- Per Sft` : 'Govt. Benchmark Value: Rs.00.00/- Per Acre i.e. Rs.00.00/- Per Sft';
    const guidelineStr2 = totalGuideline > 0 ? `Guideline Value of Land= ${areaSftFormatted} Sft X Rs.${fmtINR(sftRate)}/- Per Sft = Rs.${fmtINR(totalGuideline)}/-` : 'Guideline Value of Land= 00.00 Sft X Rs.00.00/- Per Sft = Rs.00.00/-';

    // Field 6: Estimated value
    const adoptedRate = parseFloat(this.fv('bobAdoptedRate', '0')) || 0;
    const estimatedValue = areaSft > 0 && adoptedRate > 0 ? Math.round(areaSft * adoptedRate) : 0;
    const calcEstimatedStr = estimatedValue > 0
      ? `Total Market Value of Land: ${areaSftFormatted} Sft X Rs.${fmtINR(adoptedRate)}/- Per Sft = Rs.${fmtINR(estimatedValue)}/-`
      : 'Total Market Value of Land: 0.00 Sft X Rs.0/- Per Sft = Rs.0/-';

    this.drawSimpleRow('1. Size of plot (N&S)', displayNS || 'NA');
    this.drawSimpleRow('   Size of plot (E&W)', displayEW || 'NA');
    this.drawSimpleRow('2. Total extent of the plot', displayTotalExtent, true, true);
    this.drawSimpleRow('3. Prevailing market rate', this.fv('bobPrevailingMarketRate'));
    this.drawSimpleRow('4. Guideline rate', guidelineStr1);
    this.drawSimpleRow('   Guideline Value', guidelineStr2);
    this.drawSimpleRow('5. Adopted rate of valuation', this.fv('bobAdoptedRate'));
    this.drawSimpleRow('6. Estimated value of land', calcEstimatedStr, true, true);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SECTION 5: PART B — VALUATION OF BUILDING
  // ═══════════════════════════════════════════════════════════════════════
  private drawBobSection5() {
    this.drawSectionHeader('PART B — VALUATION OF BUILDING');

    const currentYear = new Date().getFullYear();
    const yearOfConstruction = this.extractYearOfConstruction();
    const calcAge = yearOfConstruction > 0 ? (currentYear - yearOfConstruction) : 0;

    const rawYoc = this.fv('bobYearOfConstruction');
    let displayYoc = 'NA';
    if (rawYoc) {
      displayYoc = rawYoc.toLowerCase().includes('year of construction') 
        ? rawYoc 
        : `Year of Construction-${rawYoc}`;
    }

    const plinthApproval = this.fv('bobPlinthAreaApproval');
    const plinthActual = this.fv('bobPlinthAreaActual');
    let plinthVal = '';
    if (plinthApproval || plinthActual) {
      const parts = [];
      if (plinthApproval) parts.push(`As Per Approval\n${plinthApproval}`);
      if (plinthActual) parts.push(`As Per Actual\n${plinthActual}`);
      plinthVal = parts.join('\n');
    } else {
      plinthVal = 'NA';
    }

    this.drawSimpleRow('1a. Type of Building', this.fv('bobBuildingType'));
    this.drawSimpleRow('1b. Type of construction', this.fv('bobConstructionType'));
    this.drawSimpleRow('1c. Year of construction', displayYoc);
    this.drawSimpleRow('1d. Floors & height', this.fv('bobFloorsDescription'));
    this.drawSimpleRow('1e. Plinth area floor-wise', plinthVal);
    this.drawSimpleRow('1f(i). Condition: Exterior', this.fv('bobConditionExterior'));
    this.drawSimpleRow('1f(ii). Condition: Interior', this.fv('bobConditionInterior'));
    this.drawSimpleRow('1g. Approved map/plan date', this.fv('bobApprovedMapDate') || 'NA');
    this.drawSimpleRow('1h. Approving authority', this.fv('bobApprovedMapAuthority') || 'NA');
    this.drawSimpleRow('1i. Map authenticity verified', this.fv('bobApprovedMapVerified') || 'NA');
    this.drawSimpleRow('1j. Valuer comments on plan', this.fv('bobApprovedMapComments') || 'NA');
    this.drawSimpleRow('1k. Age of the Building', this.fields.bobBuildingAgeEditOn ? this.fv('bobBuildingAge') : (calcAge > 0 ? `${calcAge} years` : '0'), true, true);
    this.drawSimpleRow('1l. Residual life', this.fv('bobResidualLife'));

    // Structural Descriptions Table
    const structural = this.fields.bobStructuralDetails || {};
    const structKeys = ['foundation', 'basement', 'superstructure', 'joinery', 'rccWorks', 'plastering', 'flooring', 'specialFinish', 'roofing', 'drainage'];
    const structLabels = ['1. Foundation', '2. Basement', '3. Superstructure', '4. Joinery', '5. RCC works', '6. Plastering', '7. Flooring/Skirting', '8. Special finish', '9. Roofing', '10. Drainage'];

    this.drawTable(
      ['Description', 'Ground Floor', 'Other Floors'],
      structKeys.map((key, idx) => [
        structLabels[idx],
        structural[`${key}_ground`] || structural[`${key}_groundCustom`] || '',
        this.fields.bobOtherFloorsNA ? 'NA' : (structural[`${key}_other`] || structural[`${key}_otherCustom`] || ''),
      ]),
      [CONTENT_W * 0.35, CONTENT_W * 0.325, CONTENT_W * 0.325],
      [], [0]
    );

    // Compound wall
    this.drawSimpleRow('Compound wall', this.fv('bobCompoundWall'));
    if (this.fv('bobCompoundWall') === 'Yes') {
      this.drawKeyValueRow([
        { label: 'Height', value: this.fv('bobCompoundWallHeight') || 'NA', labelWidth: CONTENT_W / 6, valueWidth: CONTENT_W / 6 },
        { label: 'Length', value: this.fv('bobCompoundWallLength') || 'NA', labelWidth: CONTENT_W / 6, valueWidth: CONTENT_W / 6 },
        { label: 'Type', value: this.fv('bobCompoundWallType') || 'NA', labelWidth: CONTENT_W / 6, valueWidth: CONTENT_W / 6 },
      ]);
    }

    // Electrical installation
    this.drawSimpleRow('Electrical: Wiring type', this.fv('bobElectricalWiring') || 'NA');
    this.drawSimpleRow('Electrical: Class of fittings (superior / ordinary / poor)', this.fv('bobElectricalFittings') || 'NA');
    this.drawKeyValueRow([
      { label: 'Light points', value: this.fv('bobElectricalLightPoints') || 'NA', labelWidth: CONTENT_W / 6, valueWidth: CONTENT_W / 6 },
      { label: 'Fan points', value: this.fv('bobElectricalFanPoints') || 'NA', labelWidth: CONTENT_W / 6, valueWidth: CONTENT_W / 6 },
      { label: 'Plug points', value: this.fv('bobElectricalPlugPoints') || 'NA', labelWidth: CONTENT_W / 6, valueWidth: CONTENT_W / 6 },
    ]);

    // Plumbing
    this.drawSimpleRow('Plumbing installation', this.fv('bobPlumbing'));
    if (this.fv('bobPlumbing') === 'Yes') {
      this.drawSimpleRow('  Water closets', this.fv('bobWaterClosets') || 'NA');
      this.drawSimpleRow('  Wash basins', this.fv('bobWashBasins') || 'NA');
      this.drawSimpleRow('  Urinals', this.fv('bobUrinals') || 'NA');
      this.drawSimpleRow('  Bath tubs', this.fv('bobBathTubs') || 'NA');
      this.drawSimpleRow('  Water meter/taps', this.fv('bobWaterMeterTaps') || 'NA');
      this.drawSimpleRow('  Other fixtures', this.fv('bobOtherFixtures') || 'NA');
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SECTION 6: DETAILS OF VALUATION & AMENITIES
  // ═══════════════════════════════════════════════════════════════════════
  private drawBobSection6() {
    this.drawSectionHeader('DETAILS OF VALUATION & AMENITIES');

    const currentYear = new Date().getFullYear();
    const yearOfConstruction = parseInt(this.fv('bobYearOfConstruction', '0')) || 0;
    const buildingAge = this.fields.bobBuildingAgeEditOn ? (parseFloat(this.fv('bobBuildingAge', '0')) || 0) : (yearOfConstruction > 0 ? currentYear - yearOfConstruction : 0);

    // Building Valuation Table
    if (this.fields.bobBuildingValuationMode === 'annexure') {
      const parsedData = this.fields.bobBuildingValuationMode_parsedData;
      if (parsedData && parsedData.headers && parsedData.rows) {
        this.cursorY += 5;
        this.drawDataTable(parsedData.headers, parsedData.rows);
        this.cursorY += 5;
      } else {
        this.drawSimpleRow('Building Valuation', 'No data uploaded.');
      }
    } else {
    const buildingRows: any[] = this.fields.bobBuildingValuationRows || [];
    if (buildingRows.length > 0) {
      const tableRows: string[][] = [];
      let totalNet = 0;
      for (const row of buildingRows) {
        const plinth = parseFloat(row.plinthArea || '0') || 0;
        const rate = parseFloat(row.replacementRate || '0') || 0;
        const estCost = row.estCostEditOn ? (parseFloat(row.estCost || '0') || 0) : plinth * rate;
        const depreciation = row.depreciationEditOn ? (parseFloat(row.depreciation || '0') || 0) : estCost * 0.01 * buildingAge;
        const netValue = row.netValueEditOn ? (parseFloat(row.netValue || '0') || 0) : estCost - depreciation;
        totalNet += netValue;
        tableRows.push([
          row.particulars || row.particularsCustom || '',
          plinth.toFixed(2),
          row.roofHeight || '',
          String(buildingAge),
          rate.toFixed(2),
          estCost.toFixed(2),
          depreciation.toFixed(2),
          netValue.toFixed(2),
        ]);
      }
      tableRows.push(['TOTAL', '', '', '', '', '', '', totalNet.toFixed(2)]);

      this.drawTable(
        ['PARTICULARS', 'PLINTH AREA', 'ROOF HT', 'AGE', 'RATE', 'EST. COST', 'DEPRECIATION', 'NET VALUE'],
        tableRows,
        [CONTENT_W * 0.18, CONTENT_W * 0.10, CONTENT_W * 0.08, CONTENT_W * 0.07, CONTENT_W * 0.10, CONTENT_W * 0.16, CONTENT_W * 0.16, CONTENT_W * 0.15],
        [7], [0], [],
        [{ r: tableRows.length - 1, c: 0 }, { r: tableRows.length - 1, c: 7 }],
        [{ r: tableRows.length - 1, c: 0 }, { r: tableRows.length - 1, c: 7 }]
      );
    }
    }

    // Part D: Amenities
    this.drawSectionHeader('PART D — AMENITIES', true, true);
    if (this.fields.bobAmenitiesMode === 'annexure') {
      const parsedData = this.fields.bobAmenitiesMode_parsedData;
      if (parsedData && parsedData.headers && parsedData.rows) {
        this.cursorY += 5;
        this.drawDataTable(parsedData.headers, parsedData.rows);
        this.cursorY += 5;
      } else {
        this.drawSimpleRow('Amenities', 'No data uploaded.');
      }
    } else {
    const amenityItems = ['Wardrobes & Cupboard', 'Modular Kitchen', 'Extra sinks and bath tub', 'Marble / Ceramic tiles flooring', 'Interior decorations', 'Architectural elevation works', 'Paneling works', 'Aluminium works', 'Aluminium hand rails', 'False ceiling'];
    const amenityRows: string[][] = [];
    let amenitiesTotal = 0;
    for (let i = 0; i < amenityItems.length; i++) {
      const val = parseFloat(this.fv(`bobAmenity_${i}`, '0')) || 0;
      amenitiesTotal += val;
      amenityRows.push([String(i + 1), amenityItems[i], val > 0 ? val.toFixed(2) : '']);
    }
    amenityRows.push(['', 'TOTAL', amenitiesTotal.toFixed(2)]);
    this.drawTable(
      ['SL NO.', 'ITEM', 'AMOUNT'],
      amenityRows,
      [CONTENT_W * 0.1, CONTENT_W * 0.6, CONTENT_W * 0.3],
      [2], [0], [],
      [{ r: amenityRows.length - 1, c: 1 }, { r: amenityRows.length - 1, c: 2 }],
      [{ r: amenityRows.length - 1, c: 1 }, { r: amenityRows.length - 1, c: 2 }]
    );
    }

    // Part E: Miscellaneous
    this.drawSectionHeader('PART E — MISCELLANEOUS', true, true);
    if (this.fields.bobMiscMode === 'annexure') {
      const parsedData = this.fields.bobMiscMode_parsedData;
      if (parsedData && parsedData.headers && parsedData.rows) {
        this.cursorY += 5;
        this.drawDataTable(parsedData.headers, parsedData.rows);
        this.cursorY += 5;
      } else {
        this.drawSimpleRow('Miscellaneous', 'No data uploaded.');
      }
    } else {
    const miscItems = ['Separate toilet room', 'Separate lumber room', 'Separate water tank/ sump', 'Trees, gardening'];
    const miscRows: string[][] = [];
    let miscTotal = 0;
    for (let i = 0; i < miscItems.length; i++) {
      const val = parseFloat(this.fv(`bobMisc_${i}`, '0')) || 0;
      miscTotal += val;
      miscRows.push([String(i + 1), miscItems[i], val > 0 ? val.toFixed(2) : '']);
    }
    miscRows.push(['', 'TOTAL', miscTotal.toFixed(2)]);
    this.drawTable(
      ['SL NO.', 'ITEM', 'AMOUNT'],
      miscRows,
      [CONTENT_W * 0.1, CONTENT_W * 0.6, CONTENT_W * 0.3],
      [2], [0], [],
      [{ r: miscRows.length - 1, c: 1 }, { r: miscRows.length - 1, c: 2 }],
      [{ r: miscRows.length - 1, c: 1 }, { r: miscRows.length - 1, c: 2 }]
    );
    }

    // Part F: Services
    this.drawSectionHeader('PART F — SERVICES', true, true);
    if (this.fields.bobServicesMode === 'annexure') {
      const parsedData = this.fields.bobServicesMode_parsedData;
      if (parsedData && parsedData.headers && parsedData.rows) {
        this.cursorY += 5;
        this.drawDataTable(parsedData.headers, parsedData.rows);
        this.cursorY += 5;
      } else {
        this.drawSimpleRow('Services', 'No data uploaded.');
      }
    } else {
    const serviceItems = ['Bore Well with Motor', 'Head Room, Parapet Wall, Grinding', 'Compound Wall', 'Marble Flooring in staircase & Steel Handrail', 'Extra cost for Lifts with installation'];
    const serviceRows: string[][] = [];
    let servicesTotal = 0;
    for (let i = 0; i < serviceItems.length; i++) {
      const val = parseFloat(this.fv(`bobService_${i}`, '0')) || 0;
      servicesTotal += val;
      serviceRows.push([String(i + 1), serviceItems[i], val > 0 ? val.toFixed(2) : '']);
    }
    serviceRows.push(['', 'TOTAL', servicesTotal.toFixed(2)]);
    this.drawTable(
      ['SL NO.', 'ITEM', 'AMOUNT'],
      serviceRows,
      [CONTENT_W * 0.1, CONTENT_W * 0.6, CONTENT_W * 0.3],
      [2], [0], [],
      [{ r: serviceRows.length - 1, c: 1 }, { r: serviceRows.length - 1, c: 2 }],
      [{ r: serviceRows.length - 1, c: 1 }, { r: serviceRows.length - 1, c: 2 }]
    );
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SECTION 7: TOTAL ABSTRACT & REMARKS
  // ═══════════════════════════════════════════════════════════════════════
  private drawBobSection7() {
    this.drawSectionHeader('TOTAL ABSTRACT');

    if (this.fields.bobAbstractMode === 'annexure') {
      const parsedData = this.fields.bobAbstractMode_parsedData;
      if (parsedData && parsedData.headers && parsedData.rows) {
        this.cursorY += 5;
        this.drawDataTable(parsedData.headers, parsedData.rows);
        this.cursorY += 5;
      } else {
        this.drawSimpleRow('Total Abstract', 'No data uploaded.');
      }
    } else {
    // Compute prefill values
    const dimensions = this.fields.bobDimensions || {};
    const deedArea = (parseFloat(dimensions.deedEast || '0') || 0) + (parseFloat(dimensions.deedWest || '0') || 0) + (parseFloat(dimensions.deedNorth || '0') || 0) + (parseFloat(dimensions.deedSouth || '0') || 0);
    const actualArea = (parseFloat(dimensions.actualEast || '0') || 0) + (parseFloat(dimensions.actualWest || '0') || 0) + (parseFloat(dimensions.actualNorth || '0') || 0) + (parseFloat(dimensions.actualSouth || '0') || 0);
    const minArea = (deedArea > 0 && actualArea > 0) ? Math.min(deedArea, actualArea) : (deedArea || actualArea || 0);
    const areaSft = minArea * 43560;

    const acreValue = parseFloat(this.fv('bobGovtBenchmarkPerAcre', '0')) || 0;
    const sftRate = acreValue > 0 ? Math.round(acreValue / 43560) : 0;
    const landGovtValue = areaSft > 0 && sftRate > 0 ? Math.round(areaSft * sftRate) : 0;

    const adoptedRate = parseFloat(this.fv('bobAdoptedRate', '0')) || 0;
    const calculatedLandMarketValue = areaSft > 0 && adoptedRate > 0 ? Math.round(areaSft * adoptedRate) : 0;
    const landMarketValue = this.fields.bobEstimatedLandValueEditOn
      ? (parseFloat(this.fv('bobEstimatedLandValue', '0')) || 0)
      : calculatedLandMarketValue;

    const currentYear = new Date().getFullYear();
    const yearOfConstStr = this.fv('bobYearOfConstruction', '');
    const yearMatch = yearOfConstStr.match(/\d{4}/);
    const yearOfConst = yearMatch ? parseInt(yearMatch[0], 10) : 0;
    const bAge = this.fields.bobBuildingAgeEditOn ? (parseFloat(this.fv('bobBuildingAge', '0')) || 0) : (yearOfConst > 0 ? currentYear - yearOfConst : 0);
    
    const buildingRows: any[] = this.fields.bobBuildingValuationRows || [];
    const buildingMarketValue = buildingRows.reduce((sum: number, row: any) => {
      const p = parseFloat(row.plinthArea || '0') || 0;
      const r = parseFloat(row.replacementRate || '0') || 0;
      const est = row.estCostEditOn ? (parseFloat(row.estCost || '0') || 0) : p * r;
      const dep = row.depreciationEditOn ? (parseFloat(row.depreciation || '0') || 0) : est * 0.01 * bAge;
      const net = row.netValueEditOn ? (parseFloat(row.netValue || '0') || 0) : est - dep;
      return sum + net;
    }, 0);

    const amenitiesMarketValue = Array.from({ length: 10 }, (_, i) => parseFloat(this.fv(`bobAmenity_${i}`, '0')) || 0).reduce((a, b) => a + b, 0);
    const miscMarketValue = Array.from({ length: 4 }, (_, i) => parseFloat(this.fv(`bobMisc_${i}`, '0')) || 0).reduce((a, b) => a + b, 0);
    const servicesMarketValue = Array.from({ length: 5 }, (_, i) => parseFloat(this.fv(`bobService_${i}`, '0')) || 0).reduce((a, b) => a + b, 0);

    const abstractRows = [
      { label: 'LAND', govtVal: landGovtValue, marketVal: landMarketValue },
      { label: 'BUILDING', govtVal: 0, marketVal: buildingMarketValue },
      { label: 'EXTRA ITEMS', govtVal: 0, marketVal: 0 },
      { label: 'AMENITIES', govtVal: 0, marketVal: amenitiesMarketValue },
      { label: 'MISCELLANEOUS', govtVal: 0, marketVal: miscMarketValue },
      { label: 'SERVICES', govtVal: 0, marketVal: servicesMarketValue },
    ].map(row => ({
      ...row,
      realizableVal: row.marketVal * 0.95,
      distressVal: row.marketVal * 0.85
    }));

    const fmtINR = (val: number) => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);

    const tableRows: string[][] = [];
    let totalGovt = 0, totalMarket = 0, totalRealizable = 0, totalDistress = 0;

    for (const row of abstractRows) {
      totalGovt += row.govtVal;
      totalMarket += row.marketVal;
      totalRealizable += row.realizableVal;
      totalDistress += row.distressVal;

      tableRows.push([
        row.label,
        row.govtVal > 0 ? `Rs. ${fmtINR(row.govtVal)}` : 'Rs. 0.00',
        `Rs. ${fmtINR(row.marketVal)}`,
        `Rs. ${fmtINR(row.realizableVal)}`,
        `Rs. ${fmtINR(row.distressVal)}`,
      ]);
    }

    // TOTAL row 
    tableRows.push([
      'TOTAL',
      `Rs. ${fmtINR(totalGovt)}`,
      `Rs. ${fmtINR(totalMarket)}`,
      `Rs. ${fmtINR(totalRealizable)}`,
      `Rs. ${fmtINR(totalDistress)}`
    ]);

    // OR SAY row
    const orSayGovt = Math.round(totalGovt / 1000) * 1000;
    const orSayMarket = Math.round(totalMarket / 1000) * 1000;
    const orSayRealizable = Math.round(totalRealizable / 1000) * 1000;
    const orSayDistress = Math.round(totalDistress / 1000) * 1000;

    tableRows.push([
      'OR SAY',
      `Rs. ${fmtINR(orSayGovt)}`,
      `Rs. ${fmtINR(orSayMarket)}`,
      `Rs. ${fmtINR(orSayRealizable)}`,
      `Rs. ${fmtINR(orSayDistress)}`,
    ]);

    this.drawTable(
      ['PARTICULARS', 'GOVT. VALUE', 'MARKET VALUE', 'REALIZABLE (95%)', 'DISTRESS (85%)'],
      tableRows,
      [CONTENT_W * 0.22, CONTENT_W * 0.195, CONTENT_W * 0.195, CONTENT_W * 0.195, CONTENT_W * 0.195],
      [1, 2, 3, 4], [0], [],
      // Bold the TOTAL and OR SAY rows
      [
        { r: tableRows.length - 2, c: 0 }, { r: tableRows.length - 2, c: 1 }, { r: tableRows.length - 2, c: 2 }, { r: tableRows.length - 2, c: 3 }, { r: tableRows.length - 2, c: 4 },
        { r: tableRows.length - 1, c: 0 },
      ],
      [
        { r: tableRows.length - 2, c: 0 }, { r: tableRows.length - 2, c: 1 }, { r: tableRows.length - 2, c: 2 }, { r: tableRows.length - 2, c: 3 }, { r: tableRows.length - 2, c: 4 },
      ]
    );
    }

    // Remarks
    this.drawRemarksBox('REMARKS', this.fv('bobRemarks'));

    // Sign-off
    this.cursorY += 10;
    this.drawKeyValueRow([
      { label: 'Place:', value: this.fv('bobSignOffPlace'), labelWidth: CONTENT_W * 0.15, valueWidth: CONTENT_W * 0.35 },
      { label: 'Date:', value: formatReportDate(this.fv('bobDateOfValuationMade')), labelWidth: CONTENT_W * 0.15, valueWidth: CONTENT_W * 0.35 },
    ]);
    this.cursorY += 5;
    this.drawSimpleRow('Signature of Approved Valuer', '(Signature & Official seal)');
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SECTION 9: DECLARATION FROM VALUERS (Questionnaire)
  // ═══════════════════════════════════════════════════════════════════════
  private drawBobSection9() {
    this.drawSectionHeader('DECLARATION FROM VALUERS (QUESTIONNAIRE)');

    const questionnaireItems = [
      'Background information of the asset being valued;',
      'Purpose of valuation and appointing authority',
      'Identity of the Valuers and any other experts involved in the valuation;',
      'Disclosure of Valuers interest or conflict, if any;',
      'Date of appointment, valuation date and date of report;',
      'Inspections and/or investigations undertaken;',
      'Nature and sources of the information used or relied upon;',
      'Procedures adopted in carrying out the valuation and valuation standards followed;',
      'Restrictions on use of the report, if any;',
      'Major factors that were taken into account during the valuation;',
      'Caveats, limitations and disclaimers to the extent they explain or elucidate the limitations faced by valuers.',
    ];

    const qAnswers: string[] = this.fields.bobDeclarationQuestionnaire || [];
    const tableRows: string[][] = questionnaireItems.map((item, idx) => [
      String(idx + 1),
      item,
      qAnswers[idx] || '',
    ]);

    this.drawTable(
      ['Sl No.', 'Particulars', "Valuer's Comment"],
      tableRows,
      [CONTENT_W * 0.08, CONTENT_W * 0.47, CONTENT_W * 0.45],
      [], [0], [], [], []
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SECTION 8: DECLARATION FROM VALUERS (Affirmations)
  // ═══════════════════════════════════════════════════════════════════════
  private drawBobSection8() {
    this.drawSectionHeader('DECLARATION FROM VALUERS (AFFIRMATIONS)');

    const name = this.fv('bobAffirmationName');
    const father = this.fv('bobAffirmationFatherName');
    this.cursorY += 2;
    const introText = `I Mr. ${name || '......................................'}, S/o: Mr. ${father || '......................................'} do hereby solemnly affirm and state that:`;
    const introH = this.drawWrappedTextAt(introText, MARGIN_L, this.cursorY, CONTENT_W, { fontSize: FONT_SIZE });
    this.cursorY += introH + 4;

    const formatDotDate = (dateStr?: string) => {
      if (!dateStr) return '________';
      const m = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
      if (m) return `${m[3]}.${m[2]}.${m[1]}`;
      return dateStr;
    };

    const affirmChecks = this.fields.bobAffirmationChecks || {};
    const affirmationItems: { key: string; text: string }[] = [
      { key: 'a', text: 'I am citizen of India.' },
      { key: 'b', text: 'I will not undertake valuation of any assets in which I have a direct or indirect interest or become so interested at any time during a period of three years prior to my appointments as valuer or three years after the valuation of assets was conducted by me.' },
      { key: 'c', text: `The information furnished in my valuation report dated ${formatDotDate(this.fv('bobAsOnDate'))} is true & correct to the best of my knowledge & belief & I have made an impartial & true valuation of the property.` },
      { key: 'd', text: `I have personally inspected the property on ${formatDotDate(this.fv('bobDateOfInspection'))} & I have valued the property which is identified by documents & help of customer. The work is not sub-contracted to any other valuer & carried out by myself.` },
      { key: 'e', text: 'Valuation report is submitted in the format as prescribed by the bank.' },
      { key: 'f', text: 'I have not been depanelled by any other bank and in case any such depanelment by other banks during my empanelment with you, I will inform you within three days of such depanelment.' },
      { key: 'g', text: 'I have not been removed from service earlier.' },
      { key: 'h', text: 'I have not been convicted of any offence & sentenced to a term of imprisonment' },
      { key: 'i', text: 'I have not been declared to be unsound mind.' },
      { key: 'j', text: 'I have not been found guilty of misconduct in my professional capacity.' },
      { key: 'k', text: 'I am not an undischarged bankrupt, or have not applied to be adjudicated as a bankrupt.' },
      { key: 'l', text: 'I have not undischarged insolvent.' },
      { key: 'm', text: 'I have not been levied a penalty under section 271J of Income-Tax Act, 1961 (43 of 1961) and time limit for filing appeal before commissioner of Income Tax (Appeals) or Income-Tax Appellate Tribunal, as the case may be has expired, or such penalty has been confirmed by Income-Tax Appellate Tribunal, and five years have not elapsed after levy of such penalty.' },
      { key: 'n', text: 'I have not been convicted of an offence connected with any proceeding under the Income-Tax Act 1961, wealth Tax Act 1957 or Gift Tax Act 1958.' },
      { key: 'o', text: `My PAN Card number as applicable is: ${this.fv('bobAffirmationPAN')}` },
      { key: 'p', text: 'I undertake to keep you informed of any events or happenings which would make me ineligible for empanelment as a valuer.' },
      { key: 'q', text: 'I have not concealed or suppressed any material information, facts and records and I have made a complete and full disclosure' },
      { key: 'r', text: 'I have read the hand book on policy, standards & procedure for real Estate valuation, 2011 of the IBA & this report is in conformity to the "Standards" enshrined for valuation in the part -B of the above handbook to the best of my knowledge.' },
      { key: 's', text: 'I have read the International Valuation Standards (IVS) & the report submitted to the Bank for the respective asset class is in conformity to the "Standards" enshrined for valuation in the IVS in "General Standards" & "Asset Standards" as applicable.' },
      { key: 't', text: 'I abide by the Model Code of Conduct for empanelment of valuer in the Bank.' },
      { key: 'u', text: 'I am registered under Section 34 AB of the Wealth Tax Act,1957.' },
      { key: 'v', text: 'I am valuer registered with Insolvency & Bankruptcy Board of India (IBBI)' },
      { key: 'w', text: "My CIBIL Score and credit worthiness is as per Bank's guidelines." },
      { key: 'x', text: 'I am the authorized official of the firm who is competent to sign this valuation report' },
      { key: 'y', text: 'I will undertake the valuation work on receipt of letter of Engagement generated from the System. (i.e. LLMS/LOS) only' },
      { key: 'z', text: 'Further, I hereby provide the following information.' },
    ];

    affirmationItems.forEach(item => {
      if (affirmChecks[item.key] === false) return;
      
      const bullet = `${item.key}.`;
      const text = item.text;
      
      this.drawTextAt(bullet, MARGIN_L, this.cursorY, { bold: true, fontSize: FONT_SIZE_SMALL });
      const textH = this.drawWrappedTextAt(text, MARGIN_L + 15, this.cursorY, CONTENT_W - 15, { fontSize: FONT_SIZE_SMALL });
      this.cursorY += textH + 4;
      this.checkPageBreak(20);
    });

    // Sign-off
    this.cursorY += 10;
    this.drawKeyValueRow([
      { label: 'Date:', value: formatReportDate(this.fv('bobDateOfValuationMade')), labelWidth: CONTENT_W * 0.15, valueWidth: CONTENT_W * 0.35 },
      { label: 'Place:', value: this.fv('bobAffirmationPlace'), labelWidth: CONTENT_W * 0.15, valueWidth: CONTENT_W * 0.35 },
    ]);
    this.cursorY += 5;
    this.drawSimpleRow('Signature of Approved Valuer', '(Signature & Official seal)');
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SECTION 10: MODEL CODE OF CONDUCT FOR VALUERS
  // ═══════════════════════════════════════════════════════════════════════
  private drawBobSection10() {
    this.drawSectionHeader('MODEL CODE OF CONDUCT FOR VALUERS');

    // Render as text paragraphs with headings
    const fontSize = FONT_SIZE_SMALL;
    const pad = 4;

    const renderParagraph = (text: string, isBold: boolean = false, isHeading: boolean = false) => {
      const font = isBold || isHeading ? this.fontBold : this.fontRegular;
      const size = isHeading ? FONT_SIZE_HEADER : fontSize;
      const lines = this.wrapText(this.sanitizeText(text), CONTENT_W - pad * 2, size, isBold || isHeading);
      const needed = lines.length * size * LINE_HEIGHT + (isHeading ? 10 : 4);
      this.checkPageBreak(needed);

      if (isHeading) this.cursorY += 6;

      for (const line of lines) {
        const y = this.pdfY(this.cursorY);
        this.page.drawText(line, { x: MARGIN_L + pad, y, size, font, color: rgb(0, 0, 0) });
        this.cursorY += size * LINE_HEIGHT;
      }

      if (isHeading) this.cursorY += 4;
      else this.cursorY += 2;
    };

    renderParagraph('Adopted in line with Companies (Registered Valuers and Valuation Rules, 2017)', true);
    renderParagraph('All Valuers empanelled with bank shall strictly adhere to the following code of conduct:');

    const sections: { heading: string; items: { num: number; text: string }[] }[] = [
      { heading: 'Integrity and Fairness', items: [
        { num: 1, text: 'A Valuer shall, in the conduct of his/its business, follow high standards of integrity and fairness in all his/its dealings with his/its clients and other Valuers.' },
        { num: 2, text: 'A Valuer shall maintain integrity by being honest, straightforward, and forthright in all professional relationships.' },
        { num: 3, text: 'A Valuer shall endeavor to ensure that he/it provides true and adequate information and shall not misrepresent any facts or situations.' },
        { num: 4, text: 'A Valuer shall refrain from being involved in any action that would bring disrepute to the profession.' },
        { num: 5, text: 'A Valuer shall keep public interest foremost while delivering his services.' },
      ]},
      { heading: 'Professional Competence and Due Care', items: [
        { num: 6, text: 'A Valuer shall render at all times high standards of service, exercise due diligence, ensure proper care and exercise independent professional judgment.' },
        { num: 7, text: 'A Valuer shall carry out professional services in accordance with the relevant technical and professional standards.' },
        { num: 8, text: 'A Valuer shall continuously maintain professional knowledge and skill to provide competent professional service.' },
        { num: 9, text: 'In the preparation of a valuation report, the Valuer shall not disclaim liability for his/its expertise or deny his/its duty of care.' },
        { num: 10, text: 'A Valuer shall not carry out any instruction of the client insofar as they are incompatible with integrity, objectivity and independence.' },
        { num: 11, text: 'A Valuer shall clearly state to his client the services that he would be competent to provide.' },
      ]},
      { heading: 'Independence and Disclosure of Interest', items: [
        { num: 12, text: 'A Valuer shall act with objectivity in his/its professional dealings.' },
        { num: 13, text: 'A Valuer shall not take up an assignment if he/it or any of his/its relatives or associates is not independent.' },
        { num: 14, text: 'A Valuer shall maintain complete independence in his/its professional relationships.' },
        { num: 15, text: 'A Valuer shall wherever necessary disclose to the clients, possible sources of conflicts.' },
        { num: 16, text: 'A Valuer shall not deal in securities of any subject company during valuation period.' },
        { num: 17, text: 'A Valuer shall not indulge in "mandate snatching" or offering "convenience valuations".' },
        { num: 18, text: 'As an independent Valuer, the Valuer shall not charge success fee.' },
        { num: 19, text: 'In any fairness opinion, prior engagement shall be declared.' },
      ]},
      { heading: 'Confidentiality', items: [
        { num: 20, text: 'A Valuer shall not use or divulge any confidential information about the subject company.' },
        { num: 21, text: 'A Valuer shall ensure maintenance of written contemporaneous records for decisions taken.' },
        { num: 22, text: 'A Valuer shall appear, co-operate and be available for inspections and investigations.' },
        { num: 23, text: 'A Valuer shall provide all information and records as may be required by the authority.' },
        { num: 24, text: 'A Valuer shall maintain proper working papers for a period of three years.' },
      ]},
      { heading: 'Gifts and Hospitality', items: [
        { num: 25, text: 'A Valuer or his/its relative shall not accept gifts or hospitality which undermines independence.' },
        { num: 26, text: 'A Valuer shall not offer gifts or hospitality to a public servant to obtain or retain work.' },
      ]},
      { heading: 'Remuneration and Costs', items: [
        { num: 27, text: 'A Valuer shall provide services for remuneration which is charged in a transparent manner.' },
        { num: 28, text: 'A Valuer shall not accept any fees other than those disclosed in a written contract.' },
      ]},
      { heading: 'Occupation, Employability and Restrictions', items: [
        { num: 29, text: 'A Valuer shall refrain from accepting too many assignments if unable to devote adequate time.' },
        { num: 30, text: 'A Valuer shall not conduct business which discredits the profession.' },
      ]},
    ];

    for (const section of sections) {
      renderParagraph(section.heading, false, true);
      for (const item of section.items) {
        // Use the user's prefilled value if it exists in fields, otherwise use the default text
        const cocValues = this.fields.bobCodeOfConductValues || {};
        const displayText = cocValues[`item_${item.num}`] || item.text;
        renderParagraph(`${item.num}. ${displayText}`);
      }
    }

    // Acknowledgment
    this.cursorY += 10;
    const acknowledged = this.fields.bobCodeOfConductAcknowledged ? 'Yes' : 'No';
    this.drawSimpleRow('Acknowledged (Items 1-30)', acknowledged);

    this.drawKeyValueRow([
      { label: 'Date:', value: formatReportDate(this.fv('bobDateOfValuationMade')), labelWidth: CONTENT_W * 0.15, valueWidth: CONTENT_W * 0.35 },
      { label: 'Place:', value: this.fv('bobCodeOfConductPlace'), labelWidth: CONTENT_W * 0.15, valueWidth: CONTENT_W * 0.35 },
    ]);
    this.cursorY += 5;
    this.drawSimpleRow('Signature of Approved Valuer', '(Signature & Official seal)');
  }
  // ═══════════════════════════════════════════════════════════════════════
  // SECTION 11: VALUER SIGN-OFF & BANK ENDORSEMENT
  // ═══════════════════════════════════════════════════════════════════════
  private drawBobSection11() {
    this.drawSectionHeader('VALUER SIGN-OFF & BANK ENDORSEMENT');

    const remarks = this.fv('bobValuerRemarks');
    if (remarks) {
      this.cursorY += 5;
      const remarksLines = this.wrapText(this.sanitizeText(remarks), CONTENT_W, FONT_SIZE);
      this.checkPageBreak(remarksLines.length * FONT_SIZE * LINE_HEIGHT);
      for (const line of remarksLines) {
        this.page.drawText(line, { x: MARGIN_L, y: this.pdfY(this.cursorY), size: FONT_SIZE, font: this.fontBold, color: rgb(0, 0, 0) });
        this.cursorY += FONT_SIZE * LINE_HEIGHT;
      }
    }

    this.cursorY += 10;
    this.drawKeyValueRow([
      { label: 'Date:', value: formatReportDate(this.fv('bobDateOfValuationMade')), labelWidth: CONTENT_W * 0.15, valueWidth: CONTENT_W * 0.35 },
      { label: 'Place:', value: this.fv('bobSignoffPlace') || 'Bhubaneswar', labelWidth: CONTENT_W * 0.15, valueWidth: CONTENT_W * 0.35 },
    ]);
    this.cursorY += 5;
    this.drawSimpleRow('Signature (Name and Official Seal of the Approved Valuer)', '(Signature & Official seal)');

    const endorsement = this.fv('bobBankEndorsement');
    if (endorsement) {
      this.cursorY += 15;
      const endLines = this.wrapText(this.sanitizeText(endorsement), CONTENT_W, FONT_SIZE);
      this.checkPageBreak(endLines.length * FONT_SIZE * LINE_HEIGHT);
      for (const line of endLines) {
        this.page.drawText(line, { x: MARGIN_L, y: this.pdfY(this.cursorY), size: FONT_SIZE, font: this.fontBold, color: rgb(0, 0, 0) });
        this.cursorY += FONT_SIZE * LINE_HEIGHT;
      }
    }

    this.cursorY += 10;
    this.drawKeyValueRow([
      { label: 'Date:', value: formatReportDate(this.fv('bobEndorsementDate')), labelWidth: CONTENT_W * 0.15, valueWidth: CONTENT_W * 0.35 },
      { label: '', value: '', labelWidth: CONTENT_W * 0.15, valueWidth: CONTENT_W * 0.35 },
    ]);
    this.cursorY += 5;
    this.drawSimpleRow('Signature (Branch Manager)', '(Signature & Official seal)');
  }
}
