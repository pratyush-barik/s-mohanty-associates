import { PDFBankRenderer } from '../pdf-bank-renderer';
import { rgb } from 'pdf-lib';
import {
  FONT_SIZE,
  FONT_SIZE_HEADER,
  FONT_SIZE_TITLE,
  LINE_HEIGHT,
  BORDER_W,
  LBL_BG,
  OPT_BG,
  BG_OPACITY,
  hexToRgb,
  MARGIN_L,
  CONTENT_W,
} from '../pdf-bank-renderer';
import { KotakHLLAPFields, parseNum, formatNum, KOTAK_DECLARATION_CLAUSES } from '@/app/portal/reports/[projectId]/banks/kotak/KotakHLLAPTypes';

export abstract class PDFKotakHLLAPBaseRenderer extends PDFBankRenderer {
  protected fields: KotakHLLAPFields;
  protected projectCode?: string;
  protected currentSection: string = '';

  constructor(opts: any = {}) {
    super();
    this.fields = opts || {};
    this.projectCode = opts.projectCode;
  }

  abstract render(): Promise<Uint8Array>;

  protected getF(key: keyof KotakHLLAPFields, defaultVal: any = ''): any {
    return this.fields[key] ?? defaultVal;
  }

  protected cleanStr(val: any, fallback = 'NA'): string {
    if (val === undefined || val === null || val === '') return fallback;
    return String(val).trim();
  }

  override drawSectionHeader(title: string, addSpaceBefore = true, preserveCase = false): void {
    if (addSpaceBefore && this.cursorY > 10) this.cursorY += 8;
    const match = title.match(/^([0-9]+)\.\s*([\s\S]*)/);
    let index = '';
    let text = title;
    if (match) {
      index = match[1];
      text = match[2];
      this.currentSection = index;
    }
    if (!preserveCase) text = text.toUpperCase();

    const w1 = index ? 28 : 0;
    const w2 = CONTENT_W - w1;
    const pad = 3;
    const fontSize = FONT_SIZE_HEADER;

    const iLines = index ? this.wrapText(index, w1 - pad * 2, fontSize, true) : [];
    const tLines = this.wrapText(text, w2 - pad * 2, fontSize, true);

    const maxLines = Math.max(iLines.length, tLines.length, 1);
    const rowH = Math.max(18 + (maxLines - 1) * 12, maxLines * fontSize * LINE_HEIGHT + pad * 2);

    this.checkPageBreak(rowH + 20);
    const y = this.pdfY(this.cursorY);

    this.page.drawRectangle({
      x: MARGIN_L,
      y: y - rowH,
      width: CONTENT_W,
      height: rowH,
      color: hexToRgb(OPT_BG),
      opacity: BG_OPACITY,
    });

    if (w1 > 0) {
      this.page.drawRectangle({
        x: MARGIN_L,
        y: y - rowH,
        width: w1,
        height: rowH,
        borderColor: rgb(0, 0, 0),
        borderWidth: BORDER_W,
      });
      let lineY = y - pad - fontSize * 0.85;
      for (const line of iLines) {
        this.page.drawText(line, {
          x: MARGIN_L + pad + 2,
          y: lineY,
          size: fontSize,
          font: this.fontBold,
          color: rgb(0, 0, 0),
        });
        lineY -= fontSize * LINE_HEIGHT;
      }
    }

    this.page.drawRectangle({
      x: MARGIN_L + w1,
      y: y - rowH,
      width: w2,
      height: rowH,
      borderColor: rgb(0, 0, 0),
      borderWidth: BORDER_W,
    });
    let lineY2 = y - pad - fontSize * 0.85;
    for (const line of tLines) {
      this.page.drawText(line, {
        x: MARGIN_L + w1 + pad + 4,
        y: lineY2,
        size: fontSize,
        font: this.fontBold,
        color: rgb(0, 0, 0),
      });
      lineY2 -= fontSize * LINE_HEIGHT;
    }

    this.cursorY += rowH;
  }

  override drawKeyValueRow(
    cols: {
      label: string;
      value: string;
      labelWidth?: number;
      valueWidth?: number;
      highlight?: boolean;
      bold?: boolean;
      labelBold?: boolean;
      valueBold?: boolean;
      hideTop?: boolean;
      hideBottom?: boolean;
    }[]
  ): void {
    const pad = 3;
    const fontSize = FONT_SIZE;

    // Single column header spanning row
    for (const c of cols) {
      if (c.valueWidth === 0) {
        const match = c.label.match(/^([a-z0-9]+)\.\s*([\s\S]*)/i);
        let index = '';
        let text = c.label;
        if (match) {
          index = match[1];
          text = match[2];
        }

        const w1 = index ? 28 : 0;
        const w2 = CONTENT_W - w1;

        const iLines = index ? this.wrapText(index, w1 - pad * 2, fontSize, true) : [];
        const tLines = this.wrapText(text, w2 - pad * 2, fontSize, c.labelBold !== false);
        const maxLines = Math.max(iLines.length, tLines.length, 1);
        const rowH = Math.max(16, maxLines * fontSize * LINE_HEIGHT + pad * 2);

        this.checkPageBreak(rowH);
        const y = this.pdfY(this.cursorY);

        if (w1 > 0) {
          this.page.drawRectangle({
            x: MARGIN_L,
            y: y - rowH,
            width: w1,
            height: rowH,
            borderColor: rgb(0, 0, 0),
            borderWidth: BORDER_W,
            color: hexToRgb(LBL_BG),
          });
          let lineY = y - pad - fontSize * 0.85;
          for (const line of iLines) {
            this.page.drawText(line, {
              x: MARGIN_L + pad + 2,
              y: lineY,
              size: fontSize,
              font: this.fontBold,
              color: rgb(0, 0, 0),
            });
            lineY -= fontSize * LINE_HEIGHT;
          }
        }

        this.page.drawRectangle({
          x: MARGIN_L + w1,
          y: y - rowH,
          width: w2,
          height: rowH,
          borderColor: rgb(0, 0, 0),
          borderWidth: BORDER_W,
          color: hexToRgb(LBL_BG),
        });
        let lineY2 = y - pad - fontSize * 0.85;
        for (const line of tLines) {
          this.page.drawText(line, {
            x: MARGIN_L + w1 + pad + 4,
            y: lineY2,
            size: fontSize,
            font: c.labelBold !== false ? this.fontBold : this.fontRegular,
            color: rgb(0, 0, 0),
          });
          lineY2 -= fontSize * LINE_HEIGHT;
        }

        this.cursorY += rowH;
        return;
      }
    }

    // Multi-column row layout
    let totalAssignedW = 0;
    let unspecifiedCount = 0;
    for (const c of cols) {
      if (c.labelWidth !== undefined && c.valueWidth !== undefined) {
        totalAssignedW += c.labelWidth + c.valueWidth;
      } else {
        unspecifiedCount++;
      }
    }

    const remainingW = CONTENT_W - totalAssignedW;
    const defaultColW = unspecifiedCount > 0 ? remainingW / unspecifiedCount : CONTENT_W / cols.length;

    const computedCols = cols.map((c) => {
      let lw = c.labelWidth;
      let vw = c.valueWidth;
      if (lw === undefined || vw === undefined) {
        lw = Math.floor(defaultColW * 0.45);
        vw = defaultColW - lw;
      }
      const lLines = this.wrapText(c.label || '', lw - pad * 2, fontSize, c.labelBold ?? true);
      const vLines = this.wrapText(c.value || '', vw - pad * 2, fontSize, c.valueBold ?? false);
      return {
        ...c,
        lw,
        vw,
        lLines,
        vLines,
        linesCount: Math.max(lLines.length, vLines.length, 1),
      };
    });

    const maxLines = Math.max(...computedCols.map((c) => c.linesCount), 1);
    const rowH = Math.max(16, maxLines * fontSize * LINE_HEIGHT + pad * 2);

    this.checkPageBreak(rowH);
    const y = this.pdfY(this.cursorY);

    let curX = MARGIN_L;
    for (const c of computedCols) {
      // Draw Label Cell
      this.page.drawRectangle({
        x: curX,
        y: y - rowH,
        width: c.lw,
        height: rowH,
        borderColor: rgb(0, 0, 0),
        borderWidth: BORDER_W,
        color: hexToRgb(LBL_BG),
      });

      let lineY = y - pad - fontSize * 0.85;
      for (const line of c.lLines) {
        this.page.drawText(line, {
          x: curX + pad,
          y: lineY,
          size: fontSize,
          font: c.labelBold !== false ? this.fontBold : this.fontRegular,
          color: rgb(0, 0, 0),
        });
        lineY -= fontSize * LINE_HEIGHT;
      }

      // Draw Value Cell
      this.page.drawRectangle({
        x: curX + c.lw,
        y: y - rowH,
        width: c.vw,
        height: rowH,
        borderColor: rgb(0, 0, 0),
        borderWidth: BORDER_W,
        color: c.highlight ? rgb(1, 0.98, 0.9) : undefined,
      });

      let lineY2 = y - pad - fontSize * 0.85;
      for (const line of c.vLines) {
        this.page.drawText(line, {
          x: curX + c.lw + pad,
          y: lineY2,
          size: fontSize,
          font: c.valueBold ? this.fontBold : this.fontRegular,
          color: rgb(0, 0, 0),
        });
        lineY2 -= fontSize * LINE_HEIGHT;
      }

      curX += c.lw + c.vw;
    }

    this.cursorY += rowH;
  }

  /**
   * Draws the Kotak Report Title, Method Indicator & Valuation Date
   */
  protected drawKotakHeader(methodName: string): void {
    const valDate = this.cleanStr(this.getF('dateOfValuation'));
    const pad = 4;
    const headerH = 34;

    this.checkPageBreak(headerH + 20);
    const y = this.pdfY(this.cursorY);

    // Outer bounding box
    this.page.drawRectangle({
      x: MARGIN_L,
      y: y - headerH,
      width: CONTENT_W,
      height: headerH,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
      color: hexToRgb(OPT_BG),
      opacity: BG_OPACITY,
    });

    // Title: REPORT FORMAT (KOTAK MAHINDRA BANK)
    this.page.drawText('REPORT FORMAT (KOTAK MAHINDRA BANK)', {
      x: MARGIN_L + pad + 2,
      y: y - 13,
      size: 11,
      font: this.fontBold,
      color: rgb(0, 0, 0),
    });

    // Sub-header method indicator
    this.page.drawText(`[ ${methodName} ]`, {
      x: MARGIN_L + pad + 2,
      y: y - 26,
      size: 9,
      font: this.fontBold,
      color: rgb(0.1, 0.2, 0.5),
    });

    // Date of Valuation (right-aligned)
    const dateText = `Date of Valuation: ${valDate}`;
    const dateW = this.fontBold.widthOfTextAtSize(dateText, 9);
    this.page.drawText(dateText, {
      x: MARGIN_L + CONTENT_W - dateW - pad - 4,
      y: y - 18,
      size: 9,
      font: this.fontBold,
      color: rgb(0, 0, 0),
    });

    this.cursorY += headerH;
  }

  /**
   * Section 1: GENERAL (Universal across all 5)
   */
  protected drawGeneralSection(isVacantLand = false): void {
    this.drawSectionHeader('1. GENERAL');

    this.drawKeyValueRow([
      { label: 'Purpose Of Loan', value: this.cleanStr(this.getF('purposeOfLoan')), labelWidth: 180, valueWidth: CONTENT_W - 180 },
    ]);
    this.drawKeyValueRow([
      { label: 'Customer Name and Contact No.', value: this.cleanStr(this.getF('customerNameAndContact')), labelWidth: 180, valueWidth: CONTENT_W - 180 },
    ]);
    this.drawKeyValueRow([
      { label: 'Name of document holder as per legal docs', value: this.cleanStr(this.getF('nameOfDocumentHolder')), labelWidth: 180, valueWidth: CONTENT_W - 180 },
    ]);
    this.drawKeyValueRow([
      { label: 'Date of Technical Visit', value: this.cleanStr(this.getF('dateOfTechnicalVisit')), labelWidth: 180, valueWidth: CONTENT_W - 180 },
    ]);

    if (!isVacantLand) {
      this.drawKeyValueRow([
        { label: 'Name of the Project/Building/Society', value: this.cleanStr(this.getF('nameOfProjectSociety')), labelWidth: 180, valueWidth: CONTENT_W - 180 },
      ]);
    }

    this.drawKeyValueRow([
      { label: 'Builder/Seller Name and RERA ID', value: this.cleanStr(this.getF('builderSellerNameAndRera')), labelWidth: 180, valueWidth: CONTENT_W - 180 },
    ]);
    this.drawKeyValueRow([
      { label: 'Person(s) Met on Site [Name & Designation]', value: this.cleanStr(this.getF('personMetOnSite')), labelWidth: 180, valueWidth: CONTENT_W - 180 },
    ]);
    this.drawKeyValueRow([
      { label: 'Postal Address', value: this.cleanStr(this.getF('postalAddress')), labelWidth: 180, valueWidth: CONTENT_W - 180 },
    ]);
  }

  /**
   * Section 2: PROPERTY
   */
  protected drawPropertySection(isVacantLand = false): void {
    this.drawSectionHeader('2. DETAILS OF THE PROPERTY');

    this.drawKeyValueRow([
      { label: 'Flat/House/Plot No.', value: this.cleanStr(this.getF('flatHousePlotNo')), labelWidth: 180, valueWidth: 120 },
      { label: 'Property Type', value: this.cleanStr(this.getF('propertyType')), labelWidth: 100, valueWidth: CONTENT_W - 400 },
    ]);
    this.drawKeyValueRow([
      { label: 'Valuation Method', value: this.cleanStr(this.getF('valuationMethod')), labelWidth: 180, valueWidth: CONTENT_W - 180 },
    ]);

    if (!isVacantLand) {
      this.drawKeyValueRow([
        { label: 'Construction Status', value: this.cleanStr(this.getF('constructionStatus')), labelWidth: 180, valueWidth: 120 },
        { label: 'Stage of construction (in %)', value: this.cleanStr(this.getF('stageOfConstructionPct')), labelWidth: 140, valueWidth: CONTENT_W - 440 },
      ]);
      this.drawKeyValueRow([
        { label: 'Year Built / Age of Property (in Years)', value: this.cleanStr(this.getF('yearBuiltAge')), labelWidth: 180, valueWidth: 120 },
        { label: 'Residual Age of the Property', value: this.cleanStr(this.getF('residualAge')), labelWidth: 140, valueWidth: CONTENT_W - 440 },
      ]);
      this.drawKeyValueRow([
        { label: 'Occupancy details', value: this.cleanStr(this.getF('occupancyDetails')), labelWidth: 180, valueWidth: 120 },
        { label: 'Vacancy/ Tenant Tenure', value: this.cleanStr(this.getF('vacancyTenantTenure')), labelWidth: 140, valueWidth: CONTENT_W - 440 },
      ]);
      this.drawKeyValueRow([
        { label: 'No. of Stories', value: this.cleanStr(this.getF('noOfStories')), labelWidth: 180, valueWidth: 120 },
        { label: 'Comment on No. of Stories', value: this.cleanStr(this.getF('commentOnNoOfStories')), labelWidth: 140, valueWidth: CONTENT_W - 440 },
      ]);
      this.drawKeyValueRow([
        { label: 'For Multi storey building: Total no of units', value: this.cleanStr(this.getF('totalUnitsMultiStorey')), labelWidth: 180, valueWidth: 120 },
        { label: 'No of Units on each floor', value: this.cleanStr(this.getF('noOfUnitsEachFloor')), labelWidth: 140, valueWidth: CONTENT_W - 440 },
      ]);
      this.drawKeyValueRow([
        { label: 'Unit Details', value: this.cleanStr(this.getF('unitDetails')), labelWidth: 180, valueWidth: CONTENT_W - 180 },
      ]);
    } else {
      // Vacant Land specifics
      this.drawKeyValueRow([
        { label: 'Amenities available', value: this.cleanStr(this.getF('amenitiesAvailable'), 'Roads'), labelWidth: 180, valueWidth: 120 },
        { label: 'Encroachment on public land', value: this.cleanStr(this.getF('encroachmentOnPublicLand'), 'No'), labelWidth: 140, valueWidth: CONTENT_W - 440 },
      ]);
    }

    // Physical Address Sub-Table
    const phys = this.fields.physicalAddress || ({} as any);
    this.drawKeyValueRow([
      { label: 'Physical Address (as per Site Visit)', value: '', labelWidth: CONTENT_W, valueWidth: 0, labelBold: true },
    ]);
    this.drawKeyValueRow([
      { label: 'Plot/Flat/Door No.', value: this.cleanStr(phys.plotOrFlatNo), labelWidth: 110, valueWidth: 155 },
      { label: 'Floor No.', value: this.cleanStr(phys.floorNo), labelWidth: 100, valueWidth: CONTENT_W - 365 },
    ]);
    this.drawKeyValueRow([
      { label: 'Wing No.', value: this.cleanStr(phys.wingNo), labelWidth: 110, valueWidth: 155 },
      { label: 'Building Name', value: this.cleanStr(phys.buildingName), labelWidth: 100, valueWidth: CONTENT_W - 365 },
    ]);
    this.drawKeyValueRow([
      { label: 'Sector / Locality', value: this.cleanStr(phys.sectorLocality), labelWidth: 110, valueWidth: 155 },
      { label: 'Landmark', value: this.cleanStr(phys.landmark), labelWidth: 100, valueWidth: CONTENT_W - 365 },
    ]);
    this.drawKeyValueRow([
      { label: 'City', value: this.cleanStr(phys.city), labelWidth: 110, valueWidth: 155 },
      { label: 'Pin Code', value: this.cleanStr(phys.pinCode), labelWidth: 100, valueWidth: CONTENT_W - 365 },
    ]);

    // Technical Address Sub-Table
    const tech = this.fields.technicalAddress || ({} as any);
    this.drawKeyValueRow([
      { label: 'Technical Address of Property', value: '', labelWidth: CONTENT_W, valueWidth: 0, labelBold: true },
    ]);
    this.drawKeyValueRow([
      { label: 'Khata No.', value: this.cleanStr(tech.khataNo), labelWidth: 110, valueWidth: 155 },
      { label: 'Plot No.', value: this.cleanStr(tech.plotNo), labelWidth: 100, valueWidth: CONTENT_W - 365 },
    ]);
    this.drawKeyValueRow([
      { label: 'Mouza', value: this.cleanStr(tech.mouza), labelWidth: 110, valueWidth: 155 },
      { label: 'Tahasil', value: this.cleanStr(tech.tahasil), labelWidth: 100, valueWidth: CONTENT_W - 365 },
    ]);
    this.drawKeyValueRow([
      { label: 'District', value: this.cleanStr(tech.district), labelWidth: 110, valueWidth: CONTENT_W - 110 },
    ]);

    // Legal Address & Permissible Use
    this.drawKeyValueRow([
      { label: 'Legal Address of Property', value: this.cleanStr(this.getF('legalAddressOfProperty')), labelWidth: 180, valueWidth: CONTENT_W - 180 },
    ]);
    if (!isVacantLand) {
      this.drawKeyValueRow([
        { label: 'Permissible use of building', value: this.cleanStr(this.getF('permissibleUseOfBuilding')), labelWidth: 180, valueWidth: CONTENT_W - 180 },
      ]);
    }
  }

  /**
   * Section 3: SURROUNDINGS, ACCESSIBILITY & PROXIMITY TO CIVIC AMENITIES
   */
  protected drawSurroundingsSection(): void {
    this.drawSectionHeader('3. SURROUNDINGS, ACCESSIBILITY & PROXIMITY TO CIVIC AMENITIES');

    this.drawKeyValueRow([
      { label: 'Nearest Railway Station (Distance & Name)', value: this.cleanStr(this.getF('nearestRailwayStation')), labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);
    this.drawKeyValueRow([
      { label: 'Nearest Bus Stand (Distance & Name)', value: this.cleanStr(this.getF('nearestBusStand')), labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);
    this.drawKeyValueRow([
      { label: 'Nearest Hospital (Distance & Name)', value: this.cleanStr(this.getF('nearestHospital')), labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);
    this.drawKeyValueRow([
      { label: 'Nearest Airport (Distance & Name)', value: this.cleanStr(this.getF('nearestAirport')), labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);
    this.drawKeyValueRow([
      { label: 'Conditions of Approach Road', value: this.cleanStr(this.getF('conditionOfApproachRoad')), labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);
    this.drawKeyValueRow([
      { label: 'Access to Property', value: this.cleanStr(this.getF('accessToProperty')), labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);
    this.drawKeyValueRow([
      { label: 'Nearby Landmark', value: this.cleanStr(this.getF('nearbyLandmark')), labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);
    this.drawKeyValueRow([
      { label: 'Classification of Area', value: this.cleanStr(this.getF('classificationOfArea')), labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);
    this.drawKeyValueRow([
      { label: 'Condition of the Locality', value: this.cleanStr(this.getF('conditionOfLocality')), labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);
    this.drawKeyValueRow([
      { label: 'Classification/ Type of locality', value: this.cleanStr(this.getF('classificationTypeOfLocality')), labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);
    this.drawKeyValueRow([
      { label: 'Development of surrounding areas', value: this.cleanStr(this.getF('developmentOfSurroundingAreas')), labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);
    this.drawKeyValueRow([
      { label: 'Does property fall within Municipal Corp Limits?', value: this.cleanStr(this.getF('withinMunicipalLimits')), labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);
    this.drawKeyValueRow([
      { label: 'Any board of other bank/finance indicating mortgage?', value: this.cleanStr(this.getF('boardOfOtherBankIndicatingMortgage')), labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);
    this.drawKeyValueRow([
      { label: 'Plot / Property Demarcated at Site Mandatory', value: this.cleanStr(this.getF('plotDemarcatedAtSite')), labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);
    this.drawKeyValueRow([
      { label: 'Property identified through', value: this.cleanStr(this.getF('propertyIdentifiedThrough')), labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);

    // Surroundings / Boundaries
    this.drawKeyValueRow([
      { label: 'Boundaries as per Site Visit', value: '', labelWidth: CONTENT_W, valueWidth: 0, labelBold: true },
    ]);
    this.drawKeyValueRow([
      { label: 'North', value: this.cleanStr(this.getF('surroundingsSiteNorth')), labelWidth: 60, valueWidth: 205 },
      { label: 'South', value: this.cleanStr(this.getF('surroundingsSiteSouth')), labelWidth: 60, valueWidth: CONTENT_W - 325 },
    ]);
    this.drawKeyValueRow([
      { label: 'East', value: this.cleanStr(this.getF('surroundingsSiteEast')), labelWidth: 60, valueWidth: 205 },
      { label: 'West', value: this.cleanStr(this.getF('surroundingsSiteWest')), labelWidth: 60, valueWidth: CONTENT_W - 325 },
    ]);

    // Boundary Legal Comparison Table
    const compRows = this.fields.boundaryComparison || [];
    if (compRows.length > 0) {
      this.drawKeyValueRow([
        { label: 'Legal Comparison (Sale Deed vs Sketch Map / Site)', value: '', labelWidth: CONTENT_W, valueWidth: 0, labelBold: true },
      ]);
      for (const row of compRows) {
        this.drawKeyValueRow([
          { label: `${row.direction}: Site`, value: this.cleanStr(row.asPerSite), labelWidth: 80, valueWidth: 100 },
          { label: 'Deed', value: this.cleanStr(row.asPerDeed), labelWidth: 50, valueWidth: 100 },
          { label: 'Sketch Map', value: this.cleanStr(row.asPerSketchMap), labelWidth: 70, valueWidth: CONTENT_W - 400 },
        ]);
      }
    }

    this.drawKeyValueRow([
      { label: 'Whether site boundaries are matching with legal', value: this.cleanStr(this.getF('boundariesMatchingWithLegal')), labelWidth: 220, valueWidth: 60 },
      { label: 'Discrepancy found, if any', value: this.cleanStr(this.getF('discrepancyInBoundaries')), labelWidth: 130, valueWidth: CONTENT_W - 410 },
    ]);
  }

  /**
   * Section 4: SURVEY OF CONSTRUCTION (Omitted 100% in Vacant Land)
   */
  protected drawConstructionSection(): void {
    this.drawSectionHeader('4. SURVEY OF CONSTRUCTION');

    this.drawKeyValueRow([
      { label: 'Nature of Soil', value: this.cleanStr(this.getF('natureOfSoil')), labelWidth: 180, valueWidth: 120 },
      { label: 'Type of Construction', value: this.cleanStr(this.getF('typeOfConstruction')), labelWidth: 120, valueWidth: CONTENT_W - 420 },
    ]);
    this.drawKeyValueRow([
      { label: 'Major Structural Irregularities/Cracks', value: this.cleanStr(this.getF('majorStructuralIrregularities')), labelWidth: 180, valueWidth: CONTENT_W - 180 },
    ]);
    this.drawKeyValueRow([
      { label: 'Improvement/Interior Decoration Done', value: this.cleanStr(this.getF('improvementInteriorDecoration')), labelWidth: 180, valueWidth: CONTENT_W - 180 },
    ]);
    this.drawKeyValueRow([
      { label: 'Nature of Water Supply', value: this.cleanStr(this.getF('natureOfWaterSupply')), labelWidth: 180, valueWidth: CONTENT_W - 180 },
    ]);
    this.drawKeyValueRow([
      { label: 'Quality of the Construction', value: this.cleanStr(this.getF('qualityOfConstruction')), labelWidth: 180, valueWidth: 120 },
      { label: 'Exteriors Finishing', value: this.cleanStr(this.getF('exteriorsFinishing')), labelWidth: 120, valueWidth: CONTENT_W - 420 },
    ]);
    this.drawKeyValueRow([
      { label: 'Interiors Finishing', value: this.cleanStr(this.getF('interiorsFinishing')), labelWidth: 180, valueWidth: 120 },
      { label: 'Type of finishing (Paint)', value: this.cleanStr(this.getF('typeOfFinishingPaint')), labelWidth: 120, valueWidth: CONTENT_W - 420 },
    ]);
    this.drawKeyValueRow([
      { label: 'Type of Specification used', value: this.cleanStr(this.getF('typeOfSpecificationUsed')), labelWidth: 180, valueWidth: CONTENT_W - 180 },
    ]);
    this.drawKeyValueRow([
      { label: 'Amenities provided in building/society', value: this.cleanStr(this.getF('amenitiesProvidedInBuilding')), labelWidth: 180, valueWidth: CONTENT_W - 180 },
    ]);
    this.drawKeyValueRow([
      { label: 'Construction progress up to / Stage in %', value: this.cleanStr(this.getF('constructionProgressUpTo')), labelWidth: 180, valueWidth: 120 },
      { label: 'Projected Residual Life', value: this.cleanStr(this.getF('projectedResidualLife')), labelWidth: 120, valueWidth: CONTENT_W - 420 },
    ]);
    this.drawKeyValueRow([
      { label: 'Encroachment on public land', value: this.cleanStr(this.getF('encroachmentOnPublicLand')), labelWidth: 180, valueWidth: CONTENT_W - 180 },
    ]);
  }

  /**
   * Section 5: DOCUMENTS VERIFIED (Numbered Sec 4 in Vacant Land)
   */
  protected drawDocumentsSection(isVacantLand = false, isIndustrial = false): void {
    const secNum = isVacantLand ? '4' : '5';
    this.drawSectionHeader(`${secNum}. DOCUMENTS VERIFIED`);

    this.drawKeyValueRow([
      { label: 'a) Approved Layout / Building plans details', value: this.cleanStr(this.getF('approvedLayoutPlansDetails')), labelWidth: 220, valueWidth: CONTENT_W - 220 },
    ]);

    if (!isVacantLand) {
      this.drawKeyValueRow([
        { label: 'b) Commencement Certificate / Building Permit', value: this.cleanStr(this.getF('commencementCertificate')), labelWidth: 220, valueWidth: CONTENT_W - 220 },
      ]);
      this.drawKeyValueRow([
        { label: 'c) Occupation/Completion Certificate', value: this.cleanStr(this.getF('occupationCompletionCertificate')), labelWidth: 220, valueWidth: CONTENT_W - 220 },
      ]);
    }

    this.drawKeyValueRow([
      { label: 'd) Ownership Documents', value: this.cleanStr(this.getF('ownershipDocuments')), labelWidth: 220, valueWidth: CONTENT_W - 220 },
    ]);

    if (!isVacantLand) {
      this.drawKeyValueRow([
        { label: 'e) Allotment letter/BBA/Possession Letter', value: this.cleanStr(this.getF('allotmentLetterBBA')), labelWidth: 220, valueWidth: CONTENT_W - 220 },
      ]);
    }

    if (isIndustrial) {
      this.drawKeyValueRow([
        { label: 'Extended utility bills (Conversion, Electricity, Tax)', value: this.cleanStr(this.getF('extendedUtilityBills')), labelWidth: 220, valueWidth: CONTENT_W - 220 },
      ]);
    }
  }

  /**
   * Amenities Sub-Table (Harmonized Universal Across All 5)
   */
  protected drawAmenitiesSubTable(): void {
    this.drawKeyValueRow([
      { label: 'AMENITIES VALUATION', value: '', labelWidth: CONTENT_W, valueWidth: 0, labelBold: true },
    ]);
    this.drawKeyValueRow([
      { label: 'No of Car Parking:', value: this.cleanStr(this.getF('noOfCarParking')), labelWidth: 150, valueWidth: 140 },
      { label: 'Value of Parking (in Rs.):', value: this.cleanStr(this.getF('valueOfParking')), labelWidth: 140, valueWidth: CONTENT_W - 430 },
    ]);
    this.drawKeyValueRow([
      { label: 'Value of Other Amenities (in Rs.):', value: this.cleanStr(this.getF('valueOfOtherAmenities')), labelWidth: 180, valueWidth: 110 },
      { label: 'Total Value of Amenities (in Rs.):', value: this.cleanStr(this.getF('totalValueOfAmenities')), labelWidth: 160, valueWidth: CONTENT_W - 450, valueBold: true, highlight: true },
    ]);
  }

  /**
   * Section 7: FINAL VALUES & DECLARATION (Numbered Sec 6 in Vacant Land)
   */
  protected drawFinalValuesSection(includeInsurable = true, isVacantLand = false): void {
    const secNum = isVacantLand ? '6' : '7';
    this.drawSectionHeader(`${secNum}. FINAL VALUES`);

    // Rationale for Valuation (shaded narrative box)
    this.drawKeyValueRow([
      { label: 'Rationale for Valuation:', value: this.cleanStr(this.getF('rationaleForValuation')), labelWidth: 180, valueWidth: CONTENT_W - 180, highlight: true },
    ]);

    // Final Market Value & Guideline Value (Guideline Value directly below FMV!)
    this.drawKeyValueRow([
      { label: 'Final Market Value (in Rs.)', value: this.cleanStr(this.getF('finalMarketValue')), labelWidth: 180, valueWidth: CONTENT_W - 180, labelBold: true, valueBold: true, highlight: true },
    ]);
    this.drawKeyValueRow([
      { label: 'Guideline Value (in Rs.)', value: this.cleanStr(this.getF('guidelineValue')), labelWidth: 180, valueWidth: CONTENT_W - 180 },
    ]);

    // Distressed (80%) and Realizable (90%) Values
    this.drawKeyValueRow([
      { label: 'Distressed Value (in Rs.) (80%)', value: this.cleanStr(this.getF('distressedValue')), labelWidth: 180, valueWidth: 110, valueBold: true },
      { label: 'Realizable Value (in Rs.) (90%)', value: this.cleanStr(this.getF('realizableValue')), labelWidth: 150, valueWidth: CONTENT_W - 440, valueBold: true },
    ]);

    // Insurable Value (Omitted 100% in Vacant Land)
    if (includeInsurable && !isVacantLand) {
      this.drawKeyValueRow([
        { label: 'Insurable Value (in Rs.)', value: this.cleanStr(this.getF('insurableValue')), labelWidth: 180, valueWidth: CONTENT_W - 180, valueBold: true },
      ]);
    }

    // Remarks & Discrepancies
    this.drawKeyValueRow([
      { label: 'Remarks / Observations (including boundary/title notes):', value: this.cleanStr(this.getF('remarks')), labelWidth: 180, valueWidth: CONTENT_W - 180 },
    ]);

    // Declaration Clauses
    this.drawDeclarationSection();
  }

  /**
   * Mandatory Valuer Declaration with Visiting Engineer Name bold in Clause (I),
   * Valuer seal slot (150x150), report date & place.
   */
  protected drawDeclarationSection(): void {
    const engineerName = this.cleanStr(this.getF('visitingEngineerName'), 'Site Engineer');
    const visitDate = this.cleanStr(this.getF('dateOfTechnicalVisit'));
    const repDate = this.cleanStr(this.getF('reportDate'));
    const repPlace = this.cleanStr(this.getF('reportPlace'), 'Bhubaneswar');

    this.drawKeyValueRow([
      { label: 'DECLARATION', value: '', labelWidth: CONTENT_W, valueWidth: 0, labelBold: true },
    ]);

    const formattedClauses = KOTAK_DECLARATION_CLAUSES.map((clause, idx) => {
      if (idx === 0) {
        return clause.replace('{ENGINEER_NAME}', engineerName.toUpperCase()).replace('{VISIT_DATE}', visitDate);
      }
      return clause;
    }).join('\n\n');

    this.drawKeyValueRow([
      { label: formattedClauses, value: '', labelWidth: CONTENT_W, valueWidth: 0, labelBold: false },
    ]);

    // Stamp & Signature Slot
    const signRowH = 75;
    this.checkPageBreak(signRowH + 10);
    const y = this.pdfY(this.cursorY);

    const halfW = CONTENT_W / 2;

    // Left Box: Date, Place & Engineer Info
    this.page.drawRectangle({
      x: MARGIN_L,
      y: y - signRowH,
      width: halfW,
      height: signRowH,
      borderColor: rgb(0, 0, 0),
      borderWidth: BORDER_W,
      color: hexToRgb(LBL_BG),
    });

    this.page.drawText(`Date of Report: ${repDate}`, {
      x: MARGIN_L + 6,
      y: y - 16,
      size: 9,
      font: this.fontBold,
      color: rgb(0, 0, 0),
    });
    this.page.drawText(`Place: ${repPlace}`, {
      x: MARGIN_L + 6,
      y: y - 32,
      size: 9,
      font: this.fontRegular,
      color: rgb(0, 0, 0),
    });
    this.page.drawText(`Inspecting Engineer: ${engineerName}`, {
      x: MARGIN_L + 6,
      y: y - 48,
      size: 9,
      font: this.fontBold,
      color: rgb(0, 0, 0),
    });
    this.page.drawText(`Ref: ${this.projectCode || 'SMA-YYYY/MM-NNNN'}`, {
      x: MARGIN_L + 6,
      y: y - 64,
      size: 8,
      font: this.fontRegular,
      color: rgb(0.3, 0.3, 0.3),
    });

    // Right Box: Valuer Stamp Slot
    this.page.drawRectangle({
      x: MARGIN_L + halfW,
      y: y - signRowH,
      width: halfW,
      height: signRowH,
      borderColor: rgb(0, 0, 0),
      borderWidth: BORDER_W,
    });

    this.page.drawText('For S. MOHANTY & ASSOCIATES', {
      x: MARGIN_L + halfW + 10,
      y: y - 16,
      size: 9,
      font: this.fontBold,
      color: rgb(0, 0, 0),
    });
    this.page.drawText('(Empanelled Valuers & Chartered Engineers)', {
      x: MARGIN_L + halfW + 10,
      y: y - 28,
      size: 8,
      font: this.fontRegular,
      color: rgb(0.4, 0.4, 0.4),
    });
    this.page.drawText('[ Partner / Authorized Signatory Seal & Signature ]', {
      x: MARGIN_L + halfW + 10,
      y: y - 62,
      size: 8,
      font: this.fontRegular,
      color: rgb(0.5, 0.5, 0.5),
    });

    this.cursorY += signRowH;
  }

  /**
   * Universal Enclosures: Documents -> Maps -> Photographs
   */
  protected async drawKotakEnclosures(): Promise<void> {
    const rawDocs = (this.fields as any).propertyDocuments || this.fields.documents || [];
    const docNames = (this.fields as any).propertyDocumentNames || [];
    const maps = (this.fields as any).locationMaps || this.fields.mapImages || [];
    const rawPhotos = (this.fields as any).propertyPhotos || this.fields.photos || this.fields.selectedPhotos || [];
    const photoNames = (this.fields as any).propertyPhotoNames || [];

    // Normalize docs with user-entered names
    const docs = Array.isArray(rawDocs) ? rawDocs.map((d: any, idx: number) => {
      const name = docNames[idx] || (typeof d === 'object' && d?.name ? d.name : `DOCUMENT ${idx + 1}`);
      return typeof d === 'string' ? { bytes: d, name } : { ...d, name };
    }) : [];

    // Normalize photos with user-entered labels
    const photos = Array.isArray(rawPhotos) ? rawPhotos.map((p: any, idx: number) => {
      const label = photoNames[idx] || (typeof p === 'object' && p?.label ? p.label : `Photograph ${idx + 1}`);
      return typeof p === 'string' ? { bytes: p, label } : { ...p, label };
    }) : [];

    // 1. Property Documents
    if (docs.length > 0) {
      await this.drawDocumentsGallery(docs, undefined, 240, true);
    }

    // 2. Location Maps
    if (maps.length > 0) {
      await this.drawMapGallery(maps, 'LOCATION MAPS', 230, true);
    }

    // 3. Site Photographs
    if (photos.length > 0) {
      await this.drawPhotoGrid(photos, 'PHOTOGRAPHS OF PROPERTY', 180, true);
    }
  }
}
