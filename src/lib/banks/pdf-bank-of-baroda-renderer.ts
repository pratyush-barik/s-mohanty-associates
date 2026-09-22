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

  constructor(fields?: any) {
    super();
    this.fields = fields || {};
  }

  // ── Helper: field value ──
  private fv(key: string, defaultVal = ''): string {
    return String((this.fields as any)[key] ?? defaultVal).replace(/[\t\n\r]+/g, ' ').trim();
  }

  // ── BOB Specific Plain Table Drawing Primitives ──
  
  private drawBobSectionTitle(title: string, addSpaceBefore = true) {
    if (addSpaceBefore && this.cursorY > 10) this.cursorY += 15;
    this.drawTable([], [[title]], [CONTENT_W], [], [], [0]);
    this.cursorY += 5; // Extra spacing after title
  }

  private drawBob2ColRow(label: string, value: string, boldLabel = false) {
    const labelW = Math.round(CONTENT_W * 0.40);
    const valueW = CONTENT_W - labelW;
    this.drawTable([], [[label, value || 'NA']], [labelW, valueW], [], [], boldLabel ? [0] : []);
  }

  private drawBob3ColRow(index: string, label: string, value: string, boldLabel = false) {
    const idxW = 35;
    const labelW = Math.round((CONTENT_W - idxW) * 0.40);
    const valueW = CONTENT_W - idxW - labelW;
    // drawTable with empty arrays for highlights ensures plain black borders with no backgrounds
    this.drawTable([], [[index, label, value || 'NA']], [idxW, labelW, valueW], [], [], boldLabel ? [1] : []);
  }

  // ── Helper: drawSimpleRow override for BOB 40/60 layout ──
  override drawSimpleRow(label: string, value: string, highlight?: boolean, bold?: boolean): void {
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
      this.drawBobCoverPage();
      this.newPage();
      this.drawBobSection2();
      this.drawBobSection3();
      this.drawBobSection4();
      this.drawBobSection5();
      this.drawBobSection6();
      this.drawBobSection7();
      this.drawBobSection9(); // Affirmations come first
      this.drawBobSection8(); // Then Questionnaire
      this.drawBobSection10();
      return;
    }

    const isValuationReport = title.trim().toLowerCase() === 'valuation report';
    const finalTitle = isValuationReport
      ? 'VALUATION REPORT FOR BANK OF BARODA'
      : title;
    super.drawCenteredTitle(finalTitle, fontSize, isValuationReport ? true : underline);
  }

  override drawSectionHeader(title: string, addSpaceBefore?: boolean, preserveCase?: boolean) {
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

    const bmx = 20; // Decreased margin to expand the box
    const bmyTop = MARGIN_T + 10;   // padding from top header
    const bmyBot = MARGIN_B + 10;   // padding from bottom footer
    const borderColor = rgb(0, 0, 0); // Solid black border to match strict styling

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

    // Helper: Add horizontal space between characters
    const spread = (text: string) => text.split('').join(' ');

    // Helper: draw centered bold text with optional underline on EVERY line
    const drawCenteredBold = (text: string, size: number, ySpaceAfter: number, underline: boolean = false, doSpread: boolean = true) => {
      let cleanText = this.sanitizeText(text);
      if (doSpread) cleanText = spread(cleanText);
      
      const maxWidth = PAGE_W - 2 * bmx - 20;
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
    drawCenteredBold('REPORT ON VALUATION OF', FONT_SIZE_TITLE + 3, 25, false);
    drawCenteredBold('IMMOVABLE PROPERTIES', FONT_SIZE_TITLE + 3, 30, true);

    // ── 2a. Bank & Branch Details ──
    const bankBranch = this.fv('bobBankBranchDetails');
    if (bankBranch) {
      drawCenteredBold(bankBranch.toUpperCase(), FONT_SIZE, 20);
    }

    // ── 2b. As On Date (Subheading style spacing) ──
    const asOnDate = this.fv('bobAsOnDate');
    if (asOnDate) {
      // 2x padding/margin only to the bottom of texts 'AS ON DATE' (96 instead of 48)
      drawCenteredBold(`AS ON DATE: ${formatReportDate(asOnDate)}`, FONT_SIZE_HEADER, 96); 
    }

    // ── 2c. Full Legal Property Description (no heading, just the value) ──
    const legalDesc = this.fv('bobFullLegalPropertyDescription');
    if (legalDesc) {
      drawCenteredBold(legalDesc.toUpperCase(), FONT_SIZE_SMALL + 1, 25);
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
      
      // Append address logic: Prevent duplicate "At:" and add if missing
      if (address) {
        // Remove any case-insensitive variations of "At:" or "At :" from the start
        const cleanAddr = address.trim().replace(/^At\s*:?\s*/i, '');
        ownersText += `, At: ${cleanAddr}`;
      }
      drawCenteredBold(ownersText.toUpperCase(), FONT_SIZE, 14);
    } else {
      drawCenteredBold('NA', FONT_SIZE, 14);
    }
    this.cursorY += 10;

    // ── 4b. Value of the Property (2-column grid) ──
    const formatVal = (valStr: string) => {
      if (!valStr || isNaN(Number(valStr))) return '0.00';
      return Number(valStr).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const valueLabels = [
      { label: 'PRESENT MARKET VALUE', field: 'bobPresentMarketValue' },
      { label: 'REALIZABLE VALUE', field: 'bobRealizableValue' },
      { label: 'FORCED SALE VALUE', field: 'bobForcedSaleValue' },
      { label: 'GOVT. VALUE', field: 'bobGovtValue' },
    ];

    const labelColW = Math.round(CONTENT_W * 0.42);
    const valueColW = Math.round(CONTENT_W * 0.42);
    const gridTotalW = labelColW + valueColW;
    const gridStartX = MARGIN_L + (CONTENT_W - gridTotalW) / 2;

    for (const item of valueLabels) {
      const valText = `RS.${formatVal(this.fv(item.field))}`;
      const labelY = this.pdfY(this.cursorY);
      this.page.drawText(spread(item.label), { x: gridStartX, y: labelY, size: FONT_SIZE, font: this.fontBold, color: rgb(0, 0, 0) });
      this.page.drawText(spread(valText), { x: gridStartX + labelColW, y: labelY, size: FONT_SIZE, font: this.fontBold, color: rgb(0, 0, 0) });
      this.cursorY += FONT_SIZE + 8;
    }
    this.cursorY += 16;

    // ── 5 & 6. Purpose of Valuation ──
    const purposeText = this.fv('bobPurposeOfValuation') || 'NA';
    drawCenteredBold(`PURPOSE : ${purposeText.toUpperCase()}`, FONT_SIZE_SMALL + 1, 35, false);

    // ── 7. Prepared By ──
    drawCenteredBold('PREPARED BY', FONT_SIZE_HEADER, 14, true);

    const prepLines = [
      this.fv('bobPreparedByValuerName'),
      this.fv('bobPreparedByGovtReg'),
      this.fv('bobPreparedByAcademicDegrees'),
      this.fv('bobPreparedByIoVMembership'),
      this.fv('bobPreparedByIoEMembership'),
      this.fv('bobPreparedByCharteredEng'),
      this.fv('bobPreparedByBankEmpanelment'),
      this.fv('bobPreparedByPlotNo'),
      this.fv('bobPreparedByStreet'),
      this.fv('bobPreparedByCity') + (this.fv('bobPreparedByState') ? `, ${this.fv('bobPreparedByState')}` : '') + (this.fv('bobPreparedByPinCode') ? ` - ${this.fv('bobPreparedByPinCode')}` : ''),
      this.fv('bobPreparedByMobile') ? `Ph: ${this.fv('bobPreparedByPhone')} / Mob: ${this.fv('bobPreparedByMobile')}` : ''
    ].filter(Boolean);

    for (const line of prepLines) {
      drawCenteredBold(line.toUpperCase(), FONT_SIZE_SMALL, 6, false, false); // Don't spread credential lines as they get too long
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SECTION 2: PART I — GENERAL
  // ═══════════════════════════════════════════════════════════════════════
  private drawBobSection2() {
    this.drawBobSectionTitle('I. GENERAL');

    const rows: string[][] = [];
    const add = (idx: string, label: string, val: string) => rows.push([idx, label, val]);

    add('1.', 'Purpose for which the valuation is made', this.fv('bobPurposeForValuation'));
    
    add('2.', 'a) Date of inspection', formatReportDate(this.fv('bobDateOfInspection')));
    add('', 'b) Date on which the valuation is made', formatReportDate(this.fv('bobDateOfValuationMade')));

    add('3.', 'List of documents produced for perusal', '');
    add('', 'i)', this.fv('bobDocumentI'));
    add('', 'ii)', this.fv('bobDocumentII'));
    add('', 'iii)', this.fv('bobDocumentIII'));

    add('4.', 'Name of the owner(s) and his / their address (es) with Phone no. (details of share of each owner incase of joint ownership)', this.fv('bobOwnerNamesAddresses'));
    add('5.', 'Brief description of the property (Including leasehold / freehold etc)', this.fv('bobBriefDescription'));

    add('6.', 'Location of property', '');
    add('', 'a) Plot No. / Survey No.', this.fv('bobPlotNo'));
    add('', 'b) Door No.', this.fv('bobDoorNo') || 'NA');
    add('', 'c) T.S. No. / Village', this.fv('bobTSNoVillage'));
    add('', 'd) Ward / Taluka', this.fv('bobWardTaluka'));
    add('', 'e) Mandal / District', this.fv('bobMandalDistrict'));

    add('7.', 'Postal address of the property', this.fv('bobPostalAddress'));
    
    add('8.', 'City / Town', this.fv('bobCityTown') || 'NA');
    add('', 'Residential Area', 'Not Applicable');
    add('', 'Commercial Area', 'Not Applicable');
    add('', 'Industrial Area', 'Not Applicable');

    add('9.', 'Classification of the area', '');
    add('', 'i) High / Middle / Poor', this.fv('bobClassHighMiddlePoor') || 'NA');
    add('', 'ii) Urban / Semi Urban / Rural', this.fv('bobClassUrbanRural') || 'NA');
    
    add('10.', 'Coming under Corporation limit / Village Panchayat / Municipality', this.fv('bobCorporationLimit') || 'NA');
    add('11.', 'Whether covered under any State / Central Govt. enactments (e.g. Urban Land Ceiling Act) or notified under agency area / scheduled area / cantonment area', this.fv('bobCoveredUnderEnactments') || 'NA');
    add('12.', 'In case it is an agricultural land, any conversion to house site plots is contemplated', this.fv('bobAgriculturalConversion') || 'NA');
    
    add('13.', 'Boundaries of the property', '');
    const boundaries = this.fields.bobBoundaries || {};
    add('', 'East', `As per Sketch Map: ${boundaries.sketchEast || 'NA'}\nAs per Verification: ${boundaries.verifyEast || 'NA'}`);
    add('', 'West', `As per Sketch Map: ${boundaries.sketchWest || 'NA'}\nAs per Verification: ${boundaries.verifyWest || 'NA'}`);
    add('', 'North', `As per Sketch Map: ${boundaries.sketchNorth || 'NA'}\nAs per Verification: ${boundaries.verifyNorth || 'NA'}`);
    add('', 'South', `As per Sketch Map: ${boundaries.sketchSouth || 'NA'}\nAs per Verification: ${boundaries.verifySouth || 'NA'}`);

    const dimensions = this.fields.bobDimensions || {};
    add('14.1', 'Dimensions of the site', '');
    add('', 'East', `As per the Deed: ${dimensions.deedEast || 'NA'}\nActual: ${dimensions.actualEast || 'NA'}`);
    add('', 'West', `As per the Deed: ${dimensions.deedWest || 'NA'}\nActual: ${dimensions.actualWest || 'NA'}`);
    add('', 'North', `As per the Deed: ${dimensions.deedNorth || 'NA'}\nActual: ${dimensions.actualNorth || 'NA'}`);
    add('', 'South', `As per the Deed: ${dimensions.deedSouth || 'NA'}\nActual: ${dimensions.actualSouth || 'NA'}`);

    add('14.2', 'Latitude, Longitude and Coordinates of the site', this.fv('bobLatLong'));
    add('15.', 'Extent of the site', this.fv('bobExtentOfSite'));

    const dNS = parseFloat(dimensions.deedNorth || '0') || parseFloat(dimensions.deedSouth || '0') || 0;
    const dEW = parseFloat(dimensions.deedEast || '0') || parseFloat(dimensions.deedWest || '0') || 0;
    const aNS = parseFloat(dimensions.actualNorth || '0') || parseFloat(dimensions.actualSouth || '0') || 0;
    const aEW = parseFloat(dimensions.actualEast || '0') || parseFloat(dimensions.actualWest || '0') || 0;
    const deedArea = dNS * dEW; const actualArea = aNS * aEW;
    const calcExtent = this.fields.bobExtentForValuationEditOn
      ? this.fv('bobExtentForValuation')
      : ((deedArea > 0 && actualArea > 0) ? Math.min(deedArea, actualArea).toFixed(2) : (deedArea || actualArea || 0).toFixed(2));
    
    add('16.', 'Extent considered for valuation', calcExtent);
    
    let occupancyStr = this.fv('bobOccupancy') || 'NA';
    if (this.fv('bobOccupancyDetails')) {
      occupancyStr += `\n${this.fv('bobOccupancyDetails')}`;
    }
    add('17.', 'Whether occupied by the owner / tenant? If occupied by tenant, since how long? Rent Received per month.', occupancyStr);

    const idxW = 25;
    const labelW = Math.round((CONTENT_W - idxW) * 0.45);
    const valueW = CONTENT_W - idxW - labelW;

    this.drawTable([], rows, [idxW, labelW, valueW], [], [], []);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SECTION 3: PART II — CHARACTERISTICS OF THE SITE
  // ═══════════════════════════════════════════════════════════════════════
  private drawBobSection3() {
    this.drawBobSectionTitle('PART II — CHARACTERISTICS OF THE SITE');

    const rows: string[][] = [];
    const add = (idx: string, label: string, val: string) => rows.push([idx, label, val]);

    add('1.', 'Classification of locality', this.fv('bobClassificationOfLocality') || 'NA');
    add('2.', 'Development of surrounding areas', this.fv('bobDevelopmentOfSurrounding'));
    add('3.', 'Possibility of frequent flooding / sub-merging', this.fv('bobFloodingPossibility') || 'NA');
    add('4.', 'Feasibility to the civic amenities like schools, hospitals, offices, markets etc.', this.fv('bobCivicAmenities'));
    add('5.', 'Level of land with topographical conditions', this.fv('bobLevelOfLand'));
    add('6.', 'Shape of land', this.fv('bobShapeOfLand'));
    add('7.', 'Type of use to which it can be put', this.fv('bobTypeOfUse'));
    add('8.', 'Any usage restriction', this.fv('bobUsageRestriction') || 'NA');
    add('9.', 'Is it in a town planning approved layout?', this.fv('bobTownPlanningApproved'));
    add('10.', 'Corner plot or Intermittent plot?', this.fv('bobCornerOrIntermittent'));
    add('11.', 'Road facilities', this.fv('bobRoadFacilities'));
    add('12.', 'Type of road', this.fv('bobTypeOfRoad'));
    add('13.', 'Width of road', this.fv('bobWidthOfRoad'));
    add('14.', 'Is it a land-locked land?', this.fv('bobLandLocked'));
    add('15.', 'Water potentiality', this.fv('bobWaterPotentiality'));
    add('16.', 'Underground sewerage system', this.fv('bobSewerage'));
    add('17.', 'Power supply is available in the site?', this.fv('bobPowerSupply'));
    add('18.', 'Advantage of the site', this.fv('bobAdvantageOfSite'));
    add('19.', 'Special remarks, if any, like threat of acquisition of land for public service purposes, road widening or applicability of CRZ provisions etc. (Distance from sea-coast / tidal level must be incorporated)', this.fv('bobSpecialRemarks') || 'NA');

    const idxW = 25;
    const labelW = Math.round((CONTENT_W - idxW) * 0.45);
    const valueW = CONTENT_W - idxW - labelW;

    this.drawTable([], rows, [idxW, labelW, valueW], [], [], []);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SECTION 4: PART A — VALUATION OF LAND
  // ═══════════════════════════════════════════════════════════════════════
  private drawBobSection4() {
    this.drawBobSectionTitle('PART A — VALUATION OF LAND');

    const rows: string[][] = [];
    const add = (idx: string, label: string, val: string) => rows.push([idx, label, val]);

    const sizeNS = parseFloat(this.fv('bobLandSizeNS', '0')) || 0;
    const sizeEW = parseFloat(this.fv('bobLandSizeEW', '0')) || 0;
    const calcTotalExtent = (sizeNS > 0 && sizeEW > 0) ? (sizeNS * sizeEW).toFixed(2) : '0.00';
    const totalExtent = this.fields.bobLandTotalExtentEditOn ? parseFloat(this.fv('bobLandTotalExtent', '0')) : parseFloat(calcTotalExtent);
    const adoptedRate = parseFloat(this.fv('bobAdoptedRate', '0')) || 0;
    const calcEstimatedValue = (totalExtent * adoptedRate).toFixed(2);

    add('1.', 'Size of plot (N&S)', this.fv('bobLandSizeNS'));
    add('', 'Size of plot (E&W)', this.fv('bobLandSizeEW'));
    add('2.', 'Total extent of the plot', this.fields.bobLandTotalExtentEditOn ? this.fv('bobLandTotalExtent') : calcTotalExtent);
    add('3.', 'Prevailing market rate of the property (supported by inquiries & evidences)', this.fv('bobPrevailingMarketRate'));
    add('4.', 'Guideline rate obtained from registrar\'s office', this.fv('bobGuidelineRate'));
    add('5.', 'Adopted rate of valuation', this.fv('bobAdoptedRate'));
    add('6.', 'Estimated value of land', this.fields.bobEstimatedLandValueEditOn ? this.fv('bobEstimatedLandValue') : calcEstimatedValue);

    const idxW = 25;
    const labelW = Math.round((CONTENT_W - idxW) * 0.45);
    const valueW = CONTENT_W - idxW - labelW;

    this.drawTable([], rows, [idxW, labelW, valueW], [], [], []);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SECTION 5: PART B — VALUATION OF BUILDING
  // ═══════════════════════════════════════════════════════════════════════
  // ═══════════════════════════════════════════════════════════════════════
  // SECTION 5: PART B — VALUATION OF BUILDING
  // ═══════════════════════════════════════════════════════════════════════
  private drawBobSection5() {
    this.drawBobSectionTitle('PART B — VALUATION OF BUILDING');

    const currentYear = new Date().getFullYear();
    const yearOfConstruction = parseInt(this.fv('bobYearOfConstruction', '0')) || 0;
    const calcAge = yearOfConstruction > 0 ? (currentYear - yearOfConstruction) : 0;

    const rows1: string[][] = [];
    const add1 = (idx: string, label: string, val: string) => rows1.push([idx, label, val]);

    add1('1.', 'a) Type of Building', this.fv('bobBuildingType'));
    add1('', 'b) Type of construction', this.fv('bobConstructionType'));
    add1('', 'c) Year of construction', this.fv('bobYearOfConstruction'));
    add1('', 'd) Number of Floors and height of each floor', this.fv('bobFloorsDescription'));
    add1('', 'e) Plinth area floor-wise', this.fv('bobPlinthArea'));
    add1('', 'f) Condition of the building', '');
    add1('', '   i)  Exterior', this.fv('bobConditionExterior'));
    add1('', '   ii) Interior', this.fv('bobConditionInterior'));
    add1('', 'g) Whether approved map/plan of the building is available?', this.fv('bobApprovedMapDate') || 'NA');
    add1('', 'h) By which authority map is approved, indicate the name.', this.fv('bobApprovedMapAuthority') || 'NA');
    add1('', 'i) Have you verified the authenticity of the approved map?', this.fv('bobApprovedMapVerified') || 'NA');
    add1('', 'j) Valuers comments about approval plan', this.fv('bobApprovedMapComments') || 'NA');
    add1('', 'k) Age of the Building', this.fields.bobBuildingAgeEditOn ? this.fv('bobBuildingAge') : (calcAge > 0 ? `${calcAge} Years` : 'New'));
    add1('', 'l) Residual life', this.fv('bobResidualLife'));

    const idxW = 25;
    const labelW = Math.round((CONTENT_W - idxW) * 0.45);
    const valueW = CONTENT_W - idxW - labelW;
    this.drawTable([], rows1, [idxW, labelW, valueW], [], [], []);

    // Structural Descriptions Table (Plain Black Borders)
    const structural = this.fields.bobStructuralDetails || {};
    const structKeys = ['foundation', 'basement', 'superstructure', 'joinery', 'rccWorks', 'plastering', 'flooring', 'specialFinish', 'roofing', 'drainage'];
    const structLabels = ['1. Foundation', '2. Basement', '3. Superstructure', '4. Joinery', '5. RCC works', '6. Plastering', '7. Flooring / Skirting', '8. Special finish', '9. Roofing', '10. Drainage'];
    
    // Add extra padding/space before the table
    this.cursorY += 10;
    
    this.drawTable(
      ['Type of construction', 'Ground Floor', 'Other Floors'],
      structKeys.map((key, idx) => [
        structLabels[idx],
        structural[`${key}_ground`] || structural[`${key}_groundCustom`] || '',
        this.fields.bobOtherFloorsNA ? '' : (structural[`${key}_other`] || structural[`${key}_otherCustom`] || ''),
      ]),
      [CONTENT_W * 0.35, CONTENT_W * 0.325, CONTENT_W * 0.325],
      [], [], [] // NO highlights, no bold columns except header
    );

    // Systems (Compound Wall, Electrical, Plumbing)
    const rows2: string[][] = [];
    const add2 = (idx: string, label: string, val: string) => rows2.push([idx, label, val]);
    
    this.cursorY += 10;

    add2('', 'Compound wall', this.fv('bobCompoundWall'));
    if (this.fv('bobCompoundWall') === 'Yes') {
      add2('', '  Height', this.fv('bobCompoundWallHeight') || '');
      add2('', '  Length', this.fv('bobCompoundWallLength') || '');
      add2('', '  Type', this.fv('bobCompoundWallType') || '');
    }

    add2('', 'Electrical installation', '');
    add2('', '  Type of wiring', this.fv('bobElectricalWiring') || '');
    add2('', '  Class of fittings (superior / ordinary / poor)', this.fv('bobElectricalFittings') || '');
    add2('2.', 'Number of light points', this.fv('bobElectricalLightPoints') || '');
    add2('', '  Fan points', this.fv('bobElectricalFanPoints') || '');
    add2('', '  Spare plug points', this.fv('bobElectricalPlugPoints') || '');
    add2('', '  Any other item', '');

    add2('3.', 'Plumbing installation', this.fv('bobPlumbing'));
    if (this.fv('bobPlumbing') === 'Yes') {
      add2('', 'a) No. of water closets and their type', this.fv('bobWaterClosets') || '');
      add2('', 'b) No. of wash basins', this.fv('bobWashBasins') || '');
      add2('', 'c) No. of urinals', this.fv('bobUrinals') || '');
      add2('', 'd) No. of bath tubs', this.fv('bobBathTubs') || '');
      add2('', 'e) Water meter, taps, etc', this.fv('bobWaterMeterTaps') || '');
      add2('', 'f) Any other fixtures', this.fv('bobOtherFixtures') || '');
    }

    this.drawTable([], rows2, [idxW, labelW, valueW], [], [], []);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SECTION 6: DETAILS OF VALUATION & AMENITIES
  // ═══════════════════════════════════════════════════════════════════════
  private drawBobSection6() {
    // Details of Valuation is a left-aligned, underlined subheading
    this.cursorY += 10;
    const titleLines = this.wrapText('Details of Valuation', CONTENT_W, FONT_SIZE_HEADER - 1, true);
    for (const line of titleLines) {
      const tw = this.fontBold.widthOfTextAtSize(line, FONT_SIZE_HEADER - 1);
      this.page.drawText(line, { x: MARGIN_L, y: this.pdfY(this.cursorY), size: FONT_SIZE_HEADER - 1, font: this.fontBold, color: rgb(0, 0, 0) });
      this.page.drawLine({ start: { x: MARGIN_L, y: this.pdfY(this.cursorY) - 2 }, end: { x: MARGIN_L + tw, y: this.pdfY(this.cursorY) - 2 }, thickness: 1, color: rgb(0, 0, 0) });
      this.cursorY += FONT_SIZE_HEADER + 4;
    }
    this.cursorY += 5;

    const currentYear = new Date().getFullYear();
    const yearOfConstruction = parseInt(this.fv('bobYearOfConstruction', '0')) || 0;
    const buildingAge = this.fields.bobBuildingAgeEditOn ? (parseFloat(this.fv('bobBuildingAge', '0')) || 0) : (yearOfConstruction > 0 ? currentYear - yearOfConstruction : 0);

    // Building Valuation Table (Plain Black Borders)
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
        ['PARTICULARS OF ITEMS', 'PLINTH AREA IN SQFT', 'ROOF HEIGHT', 'AGE OF THE BUILDING IN YEARS', 'REPLACEMENT RATE OF CONSTRUCTION', 'ESTIMATED REPLACEMENT COST OF CONSTRUCTION', 'DEPRECIATION AMOUNT IN RS. 1% PER YEAR', 'NET VALUE AFTER DEPRECIATION'],
        tableRows,
        [CONTENT_W * 0.18, CONTENT_W * 0.10, CONTENT_W * 0.08, CONTENT_W * 0.07, CONTENT_W * 0.10, CONTENT_W * 0.16, CONTENT_W * 0.16, CONTENT_W * 0.15],
        [], [], [], // NO highlights
        [],
        [{ r: tableRows.length - 1, c: 0 }, { r: tableRows.length - 1, c: 7 }] // Bold the total row
      );
    }

    // Part D: Amenities
    const drawPartSubheading = (title: string) => {
      this.cursorY += 15;
      this.page.drawText(title, { x: MARGIN_L, y: this.pdfY(this.cursorY), size: FONT_SIZE_SMALL + 1, font: this.fontBold, color: rgb(0, 0, 0) });
      this.cursorY += FONT_SIZE_SMALL + 6;
    };

    const amenityItems = ['Wardrobes & Cupboard', 'Modular Kitchen', 'Extra sinks and bath tub', 'Marble / Ceramic tiles flooring', 'Interior decorations', 'Architectural elevation works', 'Paneling works', 'Aluminium works', 'Aluminium hand rails', 'False ceiling'];
    const amenityRows: string[][] = [];
    let amenitiesTotal = 0;
    for (let i = 0; i < amenityItems.length; i++) {
      const val = parseFloat(this.fv(`bobAmenity_${i}`, '0')) || 0;
      amenitiesTotal += val;
      amenityRows.push([String(i + 1), amenityItems[i], val > 0 ? val.toFixed(2) : '']);
    }
    amenityRows.push(['', 'TOTAL :', amenitiesTotal.toFixed(2)]);
    
    drawPartSubheading('Part D- (Amenities)');
    this.drawTable(
      ['SL NO.', 'PARTICULARS OF ITEM', 'AMOUNT'],
      amenityRows,
      [CONTENT_W * 0.1, CONTENT_W * 0.6, CONTENT_W * 0.3],
      [], [], [], // NO highlights
      [],
      [{ r: amenityRows.length - 1, c: 1 }, { r: amenityRows.length - 1, c: 2 }]
    );

    // Part E: Miscellaneous
    const miscItems = ['Separate toilet room', 'Separate lumber room', 'Separate water tank/ sump', 'Trees, gardening'];
    const miscRows: string[][] = [];
    let miscTotal = 0;
    for (let i = 0; i < miscItems.length; i++) {
      const val = parseFloat(this.fv(`bobMisc_${i}`, '0')) || 0;
      miscTotal += val;
      miscRows.push([String(i + 1), miscItems[i], val > 0 ? val.toFixed(2) : '']);
    }
    miscRows.push(['', 'TOTAL', miscTotal.toFixed(2)]);
    
    drawPartSubheading('Part E- (Miscellaneous)');
    this.drawTable(
      ['SL NO.', 'PARTICULARS OF ITEM', 'AMOUNT'],
      miscRows,
      [CONTENT_W * 0.1, CONTENT_W * 0.6, CONTENT_W * 0.3],
      [], [], [], // NO highlights
      [],
      [{ r: miscRows.length - 1, c: 1 }, { r: miscRows.length - 1, c: 2 }]
    );

    // Part F: Services
    const serviceItems = ['Bore Well with Motor', 'Head Room, Parapet Wall, Grinding', 'Compound Wall', 'Marble Flooring in staircase & Steel Handrail', 'Add extra cost for 2 nos of Lifts with installation charges in LS'];
    const serviceRows: string[][] = [];
    let servicesTotal = 0;
    for (let i = 0; i < serviceItems.length; i++) {
      const val = parseFloat(this.fv(`bobService_${i}`, '0')) || 0;
      servicesTotal += val;
      serviceRows.push([String(i + 1), serviceItems[i], val > 0 ? val.toFixed(2) : '']);
    }
    serviceRows.push(['', 'TOTAL', servicesTotal.toFixed(2)]);
    
    drawPartSubheading('Part F- (Services)');
    this.drawTable(
      ['SL NO.', 'PARTICULARS OF ITEM', 'AMOUNT'],
      serviceRows,
      [CONTENT_W * 0.1, CONTENT_W * 0.6, CONTENT_W * 0.3],
      [], [], [], // NO highlights
      [],
      [{ r: serviceRows.length - 1, c: 1 }, { r: serviceRows.length - 1, c: 2 }]
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SECTION 7: TOTAL ABSTRACT & REMARKS
  // ═══════════════════════════════════════════════════════════════════════
  private drawBobSection7() {
    this.drawBobSectionTitle('TOTAL ABSTRACT FOR THE ENTIRE PROPERTY');

    // Compute prefill values
    const sizeNS = parseFloat(this.fv('bobLandSizeNS', '0')) || 0;
    const sizeEW = parseFloat(this.fv('bobLandSizeEW', '0')) || 0;
    const totalExtent = this.fields.bobLandTotalExtentEditOn ? parseFloat(this.fv('bobLandTotalExtent', '0')) : sizeNS * sizeEW;
    const adoptedRate = parseFloat(this.fv('bobAdoptedRate', '0')) || 0;
    const landMarketValue = this.fields.bobEstimatedLandValueEditOn ? parseFloat(this.fv('bobEstimatedLandValue', '0')) : totalExtent * adoptedRate;

    const currentYear = new Date().getFullYear();
    const yearOfConst = parseInt(this.fv('bobYearOfConstruction', '0')) || 0;
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

    const abstractRows: { label: string; key: string; prefillMarket: number | null }[] = [
      { label: 'LAND', key: 'land', prefillMarket: landMarketValue },
      { label: 'BUILDING', key: 'building', prefillMarket: buildingMarketValue },
      { label: 'EXTRA ITEMS', key: 'extraItems', prefillMarket: null },
      { label: 'AMENITIES', key: 'amenities', prefillMarket: amenitiesMarketValue },
      { label: 'MISCELLANEOUS', key: 'miscellaneous', prefillMarket: miscMarketValue },
      { label: 'SERVICES', key: 'services', prefillMarket: servicesMarketValue },
    ];

    const tableRows: string[][] = [];
    let totalGovt = 0, totalMarket = 0, totalRealizable = 0, totalDistress = 0;

    for (const row of abstractRows) {
      const govtVal = parseFloat(this.fv(`bobAbstract_${row.key}_govt`, '0')) || 0;
      const marketVal = row.prefillMarket !== null ? row.prefillMarket : (parseFloat(this.fv(`bobAbstract_${row.key}_market`, '0')) || 0);
      const realizableVal = this.fields[`bobAbstract_${row.key}_realizableEditOn`]
        ? (parseFloat(this.fv(`bobAbstract_${row.key}_realizable`, '0')) || 0)
        : marketVal * 0.95;
      const distressVal = this.fields[`bobAbstract_${row.key}_distressEditOn`]
        ? (parseFloat(this.fv(`bobAbstract_${row.key}_distress`, '0')) || 0)
        : marketVal * 0.85;

      totalGovt += govtVal;
      totalMarket += marketVal;
      totalRealizable += realizableVal;
      totalDistress += distressVal;

      tableRows.push([
        row.label,
        govtVal > 0 ? `Rs. ${govtVal.toFixed(2)}` : 'Rs. 0.00',
        marketVal > 0 ? `Rs. ${marketVal.toFixed(2)}` : 'Rs. 0.00',
        realizableVal > 0 ? `Rs. ${realizableVal.toFixed(2)}` : 'Rs. 0.00',
        distressVal > 0 ? `Rs. ${distressVal.toFixed(2)}` : 'Rs. 0.00',
      ]);
    }

    // TOTAL row — use edit switch overrides if enabled
    const finalTotalGovt = this.fields.bobAbstractTotalGovtEditOn ? (parseFloat(this.fv('bobAbstractTotalGovt', '0')) || 0) : totalGovt;
    const finalTotalMarket = this.fields.bobAbstractTotalMarketEditOn ? (parseFloat(this.fv('bobAbstractTotalMarket', '0')) || 0) : totalMarket;
    const finalTotalRealizable = this.fields.bobAbstractTotalRealizableEditOn ? (parseFloat(this.fv('bobAbstractTotalRealizable', '0')) || 0) : totalRealizable;
    const finalTotalDistress = this.fields.bobAbstractTotalDistressEditOn ? (parseFloat(this.fv('bobAbstractTotalDistress', '0')) || 0) : totalDistress;
    tableRows.push([
      'TOTAL',
      `Rs. ${finalTotalGovt.toFixed(2)}`,
      `Rs. ${finalTotalMarket.toFixed(2)}`,
      `Rs. ${finalTotalRealizable.toFixed(2)}`,
      `Rs. ${finalTotalDistress.toFixed(2)}`
    ]);

    // OR SAY row
    tableRows.push([
      'OR SAY',
      `Rs. ${this.fv('bobAbstractOrSayGovt') || '0.00'}`,
      `Rs. ${this.fv('bobAbstractOrSayMarket') || '0.00'}`,
      `Rs. ${this.fv('bobAbstractOrSayRealizable') || '0.00'}`,
      `Rs. ${this.fv('bobAbstractOrSayDistress') || '0.00'}`,
    ]);

    this.drawTable(
      ['PARTICULARS', 'GOVT. VALUE IN RS.', 'MARKET VALUE IN RS.', 'REALIZABLE VALUE (95%)', 'DISTRESS VALUE (85%)'],
      tableRows,
      [CONTENT_W * 0.22, CONTENT_W * 0.195, CONTENT_W * 0.195, CONTENT_W * 0.195, CONTENT_W * 0.195],
      [], [], [], // NO HIGHLIGHTS
      [ // Bold the TOTAL and OR SAY rows
        { r: tableRows.length - 2, c: 0 }, { r: tableRows.length - 2, c: 1 }, { r: tableRows.length - 2, c: 2 }, { r: tableRows.length - 2, c: 3 }, { r: tableRows.length - 2, c: 4 },
        { r: tableRows.length - 1, c: 0 }, { r: tableRows.length - 1, c: 1 }, { r: tableRows.length - 1, c: 2 }, { r: tableRows.length - 1, c: 3 }, { r: tableRows.length - 1, c: 4 },
      ]
    );

    // Remarks (Plain text block, not boxed)
    this.cursorY += 15;
    const remarks = this.fv('bobRemarks');
    if (remarks) {
      this.page.drawText('REMARKS :', { x: MARGIN_L, y: this.pdfY(this.cursorY), size: FONT_SIZE_SMALL + 1, font: this.fontBold, color: rgb(0, 0, 0) });
      this.cursorY += FONT_SIZE_SMALL + 2;

      const lines = this.wrapText(remarks.toUpperCase(), CONTENT_W, FONT_SIZE_SMALL + 1, true);
      for (const line of lines) {
        this.page.drawText(line, { x: MARGIN_L, y: this.pdfY(this.cursorY), size: FONT_SIZE_SMALL + 1, font: this.fontBold, color: rgb(0, 0, 0) });
        this.cursorY += FONT_SIZE_SMALL + 5;
      }
    }

    // Sign-off
    this.cursorY += 25;
    const placeStr = `Place: ${this.fv('bobSignOffPlace')}`;
    const dateStr = `Date: ${formatReportDate(this.fv('bobDateOfValuationMade'))}`;
    const signatureStr = `Signature\n(Name and Official seal of the Approved Valuer)`;

    this.page.drawText(placeStr, { x: MARGIN_L, y: this.pdfY(this.cursorY), size: FONT_SIZE_SMALL + 1, font: this.fontBold, color: rgb(0, 0, 0) });
    this.cursorY += FONT_SIZE_SMALL + 4;
    
    this.page.drawText(dateStr, { x: MARGIN_L, y: this.pdfY(this.cursorY), size: FONT_SIZE_SMALL + 1, font: this.fontBold, color: rgb(0, 0, 0) });
    
    // Right align signature
    const sigLines = signatureStr.split('\n');
    let sigY = this.pdfY(this.cursorY - (FONT_SIZE_SMALL + 4));
    for (const line of sigLines) {
      const tw = this.fontBold.widthOfTextAtSize(line, FONT_SIZE_SMALL + 1);
      this.page.drawText(line, { x: MARGIN_L + CONTENT_W - tw, y: sigY, size: FONT_SIZE_SMALL + 1, font: this.fontBold, color: rgb(0, 0, 0) });
      sigY -= FONT_SIZE_SMALL + 4;
    }
    this.cursorY += 40;

    // Additional branch manager inspect lines
    const bottomText = `The undersigned has inspected the property detailed in the Valuation Report on\ndated_______________. We are satisfied that the fair and reasonable market value of the property is\nRs________________________ (Rupees_____________________________________________________________ only)`;
    const botLines = bottomText.split('\n');
    for (const line of botLines) {
      this.page.drawText(line, { x: MARGIN_L, y: this.pdfY(this.cursorY), size: FONT_SIZE_SMALL + 1, font: this.fontRegular, color: rgb(0, 0, 0) });
      this.cursorY += FONT_SIZE_SMALL + 6;
    }
    
    this.cursorY += 25;
    this.page.drawText('Date:', { x: MARGIN_L, y: this.pdfY(this.cursorY), size: FONT_SIZE_SMALL + 1, font: this.fontBold, color: rgb(0, 0, 0) });
    
    // Right align branch manager signature
    const branchSig = `Signature\n(Name of the Branch Manager with Official seal)`;
    const bsLines = branchSig.split('\n');
    let bsY = this.pdfY(this.cursorY - 10);
    for (const line of bsLines) {
      const tw = this.fontBold.widthOfTextAtSize(line, FONT_SIZE_SMALL + 1);
      this.page.drawText(line, { x: MARGIN_L + CONTENT_W - tw, y: bsY, size: FONT_SIZE_SMALL + 1, font: this.fontBold, color: rgb(0, 0, 0) });
      bsY -= FONT_SIZE_SMALL + 4;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SECTION 8: DECLARATION FROM VALUERS (Questionnaire)
  // ═══════════════════════════════════════════════════════════════════════
  private drawBobSection8() {
    // In BOB, Questionnaire continues under DECLARATION FROM VALUERS but since Affirmations are first, we just draw the table.
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
      qAnswers[idx] || 'Not Applicable',
    ]);

    this.drawTable(
      ['Sl No.', 'Particulars', "Valuer's Comment"],
      tableRows,
      [CONTENT_W * 0.08, CONTENT_W * 0.47, CONTENT_W * 0.45],
      [], [], [], [], [] // NO highlights
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SECTION 9: DECLARATION FROM VALUERS (Affirmations)
  // ═══════════════════════════════════════════════════════════════════════
  private drawBobSection9() {
    this.newPage(); // Ensure it starts on a new page like the reference
    
    // Draw centered, bold, underlined title
    this.cursorY += 10;
    const title = 'DECLARATION FROM VALUERS';
    const tw = this.fontBold.widthOfTextAtSize(title, FONT_SIZE_HEADER);
    this.page.drawText(title, { x: PAGE_W / 2 - tw / 2, y: this.pdfY(this.cursorY), size: FONT_SIZE_HEADER, font: this.fontBold, color: rgb(0, 0, 0) });
    this.page.drawLine({ start: { x: PAGE_W / 2 - tw / 2, y: this.pdfY(this.cursorY) - 2 }, end: { x: PAGE_W / 2 + tw / 2, y: this.pdfY(this.cursorY) - 2 }, thickness: 1, color: rgb(0, 0, 0) });
    this.cursorY += 20;

    const name = this.fv('bobAffirmationName') || '___________';
    const father = this.fv('bobAffirmationFatherName') || '___________';
    
    const introText = `I, Mr. ${name}, S/o Mr. ${father}, do hereby solemnly affirm and declare that :`;
    this.page.drawText(introText, { x: MARGIN_L, y: this.pdfY(this.cursorY), size: FONT_SIZE_SMALL + 1, font: this.fontRegular, color: rgb(0, 0, 0) });
    this.cursorY += FONT_SIZE_SMALL + 6;

    const affirmationItems: { key: string; text: string }[] = [
      { key: 'a', text: 'I am citizen of India.' },
      { key: 'b', text: 'I will not undertake valuation of any assets in which I have a direct or indirect interest or becomes so interested at any time before submission of the report.' },
      { key: 'c', text: 'The information furnished in my valuation report is true & correct to the best of my knowledge and belief and I have made no material misstatement or concealed any material facts.' },
      { key: 'd', text: 'I have personally inspected the property. The work is not sub-contracted to any other valuer and carried out by myself.' },
      { key: 'e', text: 'Valuation report is submitted in the format prescribed by the bank.' },
      { key: 'f', text: 'I have not been depanelled by any other bank / FI / RBI / IBA.' },
      { key: 'g', text: 'I have not been removed / dismissed from service/ employment earlier.' },
      { key: 'h', text: 'I have not been convicted of any offence and sentenced to a term of imprisonment.' },
      { key: 'i', text: 'I have not been found guilty of misconduct in my professional capacity.' },
      { key: 'j', text: 'I am not an undischarged bankrupt, or has not applied to be adjudicated as a bankrupt.' },
      { key: 'k', text: 'I am not an undischarged insolvent.' },
      { key: 'l', text: 'I have not been convicted of an offence connected with any proceeding under the Income Tax Act 1961, Wealth Tax Act 1957 or Gift Tax Act 1958.' },
      { key: 'm', text: 'I have not been levied a penalty under section 271J of Income-Tax Act, 1961.' },
      { key: 'n', text: `My PAN Card number is: ${this.fv('bobAffirmationPAN')}` },
      { key: 'o', text: 'I undertake to keep you informed of any events or happenings which would make me ineligible for empanelment as a valuer.' },
      { key: 'p', text: 'I have not concealed or suppressed any material information, facts and record and I have made a complete and full disclosure.' },
      { key: 'q', text: 'I have read the Handbook on Policy, standards and procedures for real estate valuation by banks and HFI in India 2011 of the IBA and this report is in conformity with the same.' },
      { key: 'r', text: 'I have read the International Valuation Standards (IVS) and the report is in conformity with the same.' },
      { key: 's', text: 'I abide by the Model Code of Conduct for empaneled valuers.' },
      { key: 't', text: 'I am registered under Section 34 AB of the Wealth Tax Act, 1957.' },
      { key: 'u', text: 'I am valuer registered with IBBI.' },
      { key: 'v', text: "My CIBIL Score is as per Bank's guidelines." },
      { key: 'w', text: 'I am the authorized official competent to sign this valuation report.' },
      { key: 'x', text: 'I will undertake valuation work on receipt of letter of Engagement only.' },
      { key: 'y', text: 'Further, I hereby provide the following information.' },
    ];

    for (const item of affirmationItems) {
      const lineText = `${item.key}) ${item.text}`;
      const wrapped = this.wrapText(lineText, CONTENT_W, FONT_SIZE_SMALL + 1, false);
      for (const line of wrapped) {
        this.page.drawText(line, { x: MARGIN_L, y: this.pdfY(this.cursorY), size: FONT_SIZE_SMALL + 1, font: this.fontRegular, color: rgb(0, 0, 0) });
        this.cursorY += FONT_SIZE_SMALL + 5;
      }
      this.cursorY += 2; // small gap between items
      
      // Prevent running off the page
      if (this.cursorY > PAGE_H - MARGIN_B - 20) {
        this.newPage();
        this.cursorY = MARGIN_T + 20;
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SECTION 10: MODEL CODE OF CONDUCT FOR VALUERS
  // ═══════════════════════════════════════════════════════════════════════
  private drawBobSection10() {
    this.drawBobSectionTitle('MODEL CODE OF CONDUCT FOR VALUERS');

    // Render as text paragraphs with headings
    const fontSize = FONT_SIZE_SMALL + 1;
    const pad = 4;

    const renderParagraph = (text: string, isBold: boolean = false, isHeading: boolean = false) => {
      const font = isBold || isHeading ? this.fontBold : this.fontRegular;
      const size = isHeading ? FONT_SIZE_HEADER - 1 : fontSize;
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
        const cocValues = this.fields.bobCodeOfConductValues || {};
        const displayText = cocValues[`item_${item.num}`] || item.text;
        renderParagraph(`${item.num}. ${displayText}`);
      }
    }

    // Acknowledgment
    this.cursorY += 10;
    const acknowledged = this.fields.bobCodeOfConductAcknowledged ? 'Yes' : 'No';
    this.page.drawText(`Acknowledged (Items 1-30) : ${acknowledged}`, { x: MARGIN_L, y: this.pdfY(this.cursorY), size: FONT_SIZE_SMALL + 1, font: this.fontBold, color: rgb(0, 0, 0) });
    this.cursorY += 25;

    // Sign-off
    const placeStr = `Place: ${this.fv('bobCodeOfConductPlace')}`;
    const dateStr = `Date: ${formatReportDate(this.fv('bobDateOfValuationMade'))}`;
    const signatureStr = `Signature\n(Name and Official seal of the Approved Valuer)`;

    this.page.drawText(placeStr, { x: MARGIN_L, y: this.pdfY(this.cursorY), size: FONT_SIZE_SMALL + 1, font: this.fontBold, color: rgb(0, 0, 0) });
    this.cursorY += FONT_SIZE_SMALL + 4;
    
    this.page.drawText(dateStr, { x: MARGIN_L, y: this.pdfY(this.cursorY), size: FONT_SIZE_SMALL + 1, font: this.fontBold, color: rgb(0, 0, 0) });
    
    // Right align signature
    const sigLines = signatureStr.split('\n');
    let sigY = this.pdfY(this.cursorY - (FONT_SIZE_SMALL + 4));
    for (const line of sigLines) {
      const tw = this.fontBold.widthOfTextAtSize(line, FONT_SIZE_SMALL + 1);
      this.page.drawText(line, { x: MARGIN_L + CONTENT_W - tw, y: sigY, size: FONT_SIZE_SMALL + 1, font: this.fontBold, color: rgb(0, 0, 0) });
      sigY -= FONT_SIZE_SMALL + 4;
    }
  }
}
