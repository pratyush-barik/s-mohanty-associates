/**
 * pdf-axis-sbb-renderer.ts — Dedicated PDF renderer for Axis Bank (SBB - Small Business Banking).
 *
 * Mirrors Axis Finance Ltd's PDF structure but reads from 'axisSbb' prefixed fields
 * so data is fully independent between the two templates.
 *
 * Section 1 (Cover Page): Double-border cover page with Property Owners, Address,
 * Value of Property, Purpose of Valuation, and Prepared By details.
 */

import { rgb } from 'pdf-lib';
import {
  PDFBankRenderer,
  PAGE_W,
  PAGE_H,
  MARGIN_L,
  CONTENT_W,
  FONT_SIZE,
  FONT_SIZE_HEADER,
  FONT_SIZE_TITLE,
  hexToRgb,
  LINE_HEIGHT
} from '../pdf-bank-renderer';

export class PDFAxisSBBRenderer extends PDFBankRenderer {
  private fields: any;
  private drawnCover = false;
  private drawnMapHeader = false;
  private drawnAnnexureHeader = false;

  drawSectionSubtitle(title: string) {
    this.drawSectionHeader(title, false, false);
  }

  constructor(fields?: any) {
    super();
    this.fields = fields || {};
  }

  override drawKeyValueRow(cols: { label: string; value: string; labelWidth?: number; valueWidth?: number; highlight?: boolean; bold?: boolean; labelBold?: boolean; valueBold?: boolean; hideTop?: boolean; hideBottom?: boolean }[]): void {
    const newCols = cols.map(c => ({
      ...c,
      labelBold: true,
      valueBold: c.valueBold === true ? true : false
    }));
    super.drawKeyValueRow(newCols);
  }

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
      valueBold: false
    }]);
  }

  drawListCheck(label: string, value: string | string[], isNA: boolean, options: string[], isHighlighted: boolean = false, startX: number = MARGIN_L, totalW: number = CONTENT_W, isSplitRow: boolean = false, returnRowH: boolean = false, forcedHeight?: number) {
    const labelW = Math.round(totalW * 0.40);
    const valueW = totalW - labelW;
    
    if (isNA) {
      this.drawSimpleRow(label, 'NA', isHighlighted);
      return 0;
    }

    // Normalize selected values
    const selectedVals = Array.isArray(value) ? value.map(v => String(v).trim().toUpperCase()) : [String(value).trim().toUpperCase()];

    // Prepare text lines for options
    let valueLines: { text: string, isSelected: boolean, fontToUse: any, width: number }[][] = [[]];
    let currentLineW = 0;
    
    for (let i = 0; i < options.length; i++) {
      const opt = options[i];
      // When checking if selected, ignore the \n parts
      const cleanOpt = opt.replace(/\n/g, ' ');
      const isSelected = selectedVals.includes(cleanOpt.trim().toUpperCase());
      const boxText = isSelected ? '[X] ' : '[ ] ';
      const fontToUse = isSelected ? this.fontBold : this.fontRegular;
      
      const parts = opt.split('\n');
      
      for (let j = 0; j < parts.length; j++) {
        const fullText = (j === 0 ? boxText : '      ') + parts[j].trim();
        const textW = fontToUse.widthOfTextAtSize(fullText, FONT_SIZE);
        const padding = (i < options.length - 1 && j === parts.length - 1) ? 15 : 0;
        
        if (currentLineW + textW > valueW - 6 && currentLineW > 0) {
          valueLines.push([]);
          currentLineW = 0;
        }
        
        valueLines[valueLines.length - 1].push({ text: fullText, isSelected, fontToUse, width: textW + padding });
        currentLineW += textW + padding;

        if (j < parts.length - 1) {
           valueLines.push([]);
           currentLineW = 0;
        }
      }
    }

    const labelLines = this.wrapText(label, labelW - 6, FONT_SIZE, true);
    const rowMaxLines = Math.max(labelLines.length, valueLines.length);
    let rowH = Math.max(18, rowMaxLines * FONT_SIZE * LINE_HEIGHT + 6);
    
    if (forcedHeight !== undefined) {
      rowH = forcedHeight;
    }
    
    if (!isSplitRow) {
       this.checkPageBreak(rowH);
    }
    
    if (returnRowH) return rowH;

    const y = this.pdfY(this.cursorY);
    let curX = startX;

    // Draw Label Cell
    this.page.drawRectangle({ x: curX, y: y - rowH, width: labelW, height: rowH, color: hexToRgb('#DBE6F0'), opacity: 0.5 });
    this.page.drawRectangle({ x: curX, y: y - rowH, width: labelW, height: rowH, borderColor: rgb(0,0,0), borderWidth: 1 });
    
    let lineY = y - 3 - FONT_SIZE * 0.85;
    for (const line of labelLines) {
      this.page.drawText(line, { x: curX + 3, y: lineY, size: FONT_SIZE, font: this.fontBold, color: rgb(0,0,0) });
      lineY -= FONT_SIZE * LINE_HEIGHT;
    }
    
    curX += labelW;

    // Draw Value Cell
    this.page.drawRectangle({ x: curX, y: y - rowH, width: valueW, height: rowH, borderColor: rgb(0,0,0), borderWidth: 1 });

    lineY = y - 3 - FONT_SIZE * 0.85;
    for (const lineItems of valueLines) {
      let textX = curX + 3;
      for (const item of lineItems) {
        this.page.drawText(item.text, { x: textX, y: lineY, size: FONT_SIZE, font: item.fontToUse, color: rgb(0,0,0) });
        textX += item.width;
      }
      lineY -= FONT_SIZE * LINE_HEIGHT;
    }

    if (!isSplitRow) {
      this.cursorY += rowH;
    }
    return rowH;
  }

  /**
   * Custom renderer for Quality of Construction field.
   * Shows ALL roof and floor options, bolding only the selected ones.
   * Format: RCC/PATTI/[TIN SHED]/CLAY TILES ROOF WITH MASONRY WALLS
   *         WITH TILES/MARBLE/[KOTA STONE]/LOCAL STONE/C.C FLOOR
   */
  private drawQualityOfConstructionRow(
    fields: any,
    roofOptions: { key: string; label: string }[],
    floorOptions: { key: string; label: string }[]
  ) {
    const label = 'Quality of Construction';
    const labelW = Math.round(CONTENT_W * 0.40);
    const valueW = CONTENT_W - labelW;
    const pad = 3;

    // Build text segments: each segment has text, font (bold if selected)
    type Segment = { text: string; font: any };
    const segments: Segment[] = [];

    // Roof options
    for (let i = 0; i < roofOptions.length; i++) {
      const opt = roofOptions[i];
      const isSelected = !!(fields as any)[opt.key];
      segments.push({ text: opt.label, font: isSelected ? this.fontBold : this.fontRegular });
      if (i < roofOptions.length - 1) {
        segments.push({ text: '/', font: this.fontRegular });
      }
    }
    segments.push({ text: ' ROOF WITH MASONRY WALLS', font: this.fontRegular });

    // Line break hint - "WITH" starts a new line
    segments.push({ text: '\n', font: this.fontRegular });
    segments.push({ text: 'WITH ', font: this.fontRegular });

    // Floor options
    for (let i = 0; i < floorOptions.length; i++) {
      const opt = floorOptions[i];
      const isSelected = !!(fields as any)[opt.key];
      segments.push({ text: opt.label, font: isSelected ? this.fontBold : this.fontRegular });
      if (i < floorOptions.length - 1) {
        segments.push({ text: '/', font: this.fontRegular });
      }
    }
    segments.push({ text: ' FLOOR', font: this.fontRegular });

    // Lay out segments into lines that fit within valueW
    type LayoutItem = { text: string; font: any; width: number };
    const lines: LayoutItem[][] = [[]];
    let currentLineW = 0;

    for (const seg of segments) {
      if (seg.text === '\n') {
        lines.push([]);
        currentLineW = 0;
        continue;
      }
      const w = seg.font.widthOfTextAtSize(seg.text, FONT_SIZE);
      if (currentLineW + w > valueW - pad * 2 && currentLineW > 0) {
        lines.push([]);
        currentLineW = 0;
      }
      lines[lines.length - 1].push({ text: seg.text, font: seg.font, width: w });
      currentLineW += w;
    }

    const labelLines = this.wrapText(label, labelW - pad * 2, FONT_SIZE, true);
    const maxLines = Math.max(labelLines.length, lines.length);
    const rowH = Math.max(18, maxLines * FONT_SIZE * LINE_HEIGHT + pad * 2);

    this.checkPageBreak(rowH);

    const y = this.pdfY(this.cursorY);
    let curX = MARGIN_L;

    // Draw Label Cell
    this.page.drawRectangle({ x: curX, y: y - rowH, width: labelW, height: rowH, color: hexToRgb('#DBE6F0'), opacity: 0.5 });
    this.page.drawRectangle({ x: curX, y: y - rowH, width: labelW, height: rowH, borderColor: rgb(0,0,0), borderWidth: 1 });
    
    let lineY = y - pad - FONT_SIZE * 0.85;
    for (const line of labelLines) {
      this.page.drawText(line, { x: curX + pad, y: lineY, size: FONT_SIZE, font: this.fontBold, color: rgb(0,0,0) });
      lineY -= FONT_SIZE * LINE_HEIGHT;
    }
    
    curX += labelW;

    // Draw Value Cell
    this.page.drawRectangle({ x: curX, y: y - rowH, width: valueW, height: rowH, borderColor: rgb(0,0,0), borderWidth: 1 });

    lineY = y - pad - FONT_SIZE * 0.85;
    for (const lineItems of lines) {
      let textX = curX + pad;
      for (const item of lineItems) {
        this.page.drawText(item.text, { x: textX, y: lineY, size: FONT_SIZE, font: item.font, color: rgb(0,0,0) });
        textX += item.width;
      }
      lineY -= FONT_SIZE * LINE_HEIGHT;
    }

    this.cursorY += rowH;
  }

  override drawCenteredTitle(title: string, fontSize?: number, underline?: boolean) {
    if (!this.drawnCover) {
      this.drawnCover = true;
      this.drawSbbCoverPage();
      return;
    }

    if (title.toUpperCase().startsWith('ANNEXURE')) {
      if (!this.drawnAnnexureHeader) {
        this.drawnAnnexureHeader = true;
        super.drawSectionHeader('13. DOCUMENTS AND ANNEXTURE', true, false);
        this.cursorY += 10;
      }
    }

    // Override the generic "Valuation Report" title
    const isValuationReport = title.trim().toLowerCase() === 'valuation report';
    const finalTitle = isValuationReport
      ? 'VALUATION REPORT FOR AXIS BANK — SBB'
      : title;

    super.drawCenteredTitle(finalTitle, fontSize, isValuationReport ? true : underline);
  }

  override drawSectionHeader(title: string, addSpaceBefore?: boolean, preserveCase?: boolean) {
    // Intercept standard section 2
    if (title.toUpperCase() === 'CASE DETAILS & REPORT METADATA') {
      if (this.doc.getPages().length === 1) {
        this.newPage();
      }
      
      super.drawCenteredTitle('VALUATION REPORT', FONT_SIZE_TITLE, false);
      super.drawCenteredTitle('FOR AXIS BANK – SMALL BUSINESS BANKING', FONT_SIZE_TITLE, true);
      this.cursorY += 15;

      const fv = (key: string, defaultVal = '') => String((this.fields as any)[key] || defaultVal).replace(/[\t\n\r]+/g, ' ').trim() || defaultVal;
      const refText = `REPORT REF: ${fv('axisSbbReportRefNo')}`;
      const dateText = `DATE OF REPORT: ${fv('axisSbbDateOfReport')}`;

      this.page.drawText(refText, { x: MARGIN_L, y: this.pdfY(this.cursorY), size: FONT_SIZE_HEADER, font: this.fontBold, color: rgb(0,0,0) });
      const dateW = this.fontBold.widthOfTextAtSize(dateText, FONT_SIZE_HEADER);
      this.page.drawText(dateText, { x: MARGIN_L + CONTENT_W - dateW, y: this.pdfY(this.cursorY), size: FONT_SIZE_HEADER, font: this.fontBold, color: rgb(0,0,0) });
      
      this.cursorY += 15;
      
      this.drawSbbSection2();
      return;
    }
    // Intercept standard section 3
    if (title.toUpperCase() === 'LEGAL VERIFICATION & PROPERTY CLASSIFICATION') {
      this.drawSbbSection3();
      return;
    }
    // Intercept standard section 4
    if (title.toUpperCase() === 'PROPERTY IDENTIFICATION & POSTAL ADDRESS') {
      this.drawSbbSection4();
      return;
    }
    // Intercept standard section 5
    if (title.toUpperCase() === 'PROPERTY CHARACTERISTICS & PHYSICAL SITE ASSESSMENT') {
      this.drawSbbSection5();
      return;
    }
    // Intercept standard section 6
    if (title.toUpperCase() === 'BOUNDARIES, ACCESSIBILITY & SITE RISK CHECKS') {
      this.drawSbbSection6();
      return;
    }
    // Intercept standard section 7
    if (title.toUpperCase() === 'STRUCTURE, TENANCY & PLANNING APPROVALS') {
      this.drawSbbSection7();
      return;
    }
    // Intercept standard section 8
    if (title.toUpperCase() === 'CONSTRUCTION BREAKDOWN & BUILDING DETAILS') {
      this.drawSbbSection8();
      return;
    }
    // Intercept standard section 9
    if (title.toUpperCase() === '9. VALUATION OVERVIEW & REMARKS') {
      super.drawSectionHeader('VALUE OF THE PROPERTY', addSpaceBefore, preserveCase);
      this.drawSbbSection9();
      return;
    }
    // Intercept standard section 10
    if (title.toUpperCase().includes('10. REMARKS & UNDERTAKING')) {
      this.drawSbbSection10();
      return;
    }
    // Intercept Photographs
    if (title.toUpperCase() === 'PROPERTY PHOTOGRAPHS') {
      super.drawSectionHeader('11. PROPERTY PHOTOGRAPHS', addSpaceBefore, preserveCase);
      return;
    }
    // Intercept Maps
    if (title.toUpperCase().includes('MAP') || title.toUpperCase().includes('BENCHMARK')) {
      if (!this.drawnMapHeader) {
        this.drawnMapHeader = true;
        super.drawSectionHeader('12. LOCATION & SKECTH MAP OR MAPS', addSpaceBefore, preserveCase);
      }
      super.drawSectionHeader(title.toUpperCase(), false, preserveCase);
      return;
    }
    super.drawSectionHeader(title, addSpaceBefore, preserveCase);
  }

  private drawSbbSection7() {
    const fields = this.fields;
    
    const val = (key: string, computed?: string) => {
      if ((fields as any)[`${key}IsNA`]) return 'NA';
      if ((fields as any)[`${key}EditOn`] || !computed) {
        return String((fields as any)[key] || 'NA').replace(/[\t\n\r]+/g, ' ').trim() || 'NA';
      }
      return computed;
    };

    // Type of structure
    let structTypes = [];
    if ((fields as any).axisSbbTypeOfStructureGCI) structTypes.push('GCI');
    if ((fields as any).axisSbbTypeOfStructureTinShed) structTypes.push('TIN SHED');
    if ((fields as any).axisSbbTypeOfStructureRCC) structTypes.push('RCC');
    if ((fields as any).axisSbbTypeOfStructureAluform) structTypes.push('ALUFORM SHUTTERING');

    this.drawListCheck('TYPE OF STRUCTURE', structTypes, !!(fields as any).axisSbbTypeOfStructureIsNA, ['GCI', 'TIN SHED', 'RCC', 'ALUFORM SHUTTERING']);
    this.drawSimpleRow('NO. OF FLOORS', val('axisSbbNoOfFloors'));
    
    this.drawListCheck('OCCUPANCY DETAILS', val('axisSbbOccupancyDetails'), !!(fields as any).axisSbbOccupancyDetailsIsNA, ['SELF-OCCUPIED', 'RENTED', 'VACANT']);
    this.drawListCheck('IF THE PROPERTY IS ON RENT:', val('axisSbbPropertyOnRent'), !!(fields as any).axisSbbPropertyOnRentIsNA, ['YES', 'NO']);

    const isRentYes = (fields as any).axisSbbPropertyOnRent === 'YES' && !(fields as any).axisSbbPropertyOnRentIsNA;

    this.drawSimpleRow('NUMBER OF TENANT AND THERE DETAILS', isRentYes ? val('axisSbbNumberOfTenantsDetails') : 'NA');
    this.drawKeyValueRow([
      { label: 'NAME OF TENANT/ LEASE', value: isRentYes ? val('axisSbbNameOfTenantLease') : 'NA' },
      { label: 'NUMBER OF YEARS IN TENANCY', value: isRentYes ? val('axisSbbYearsInTenancy') : 'NA' }
    ]);

    const splitW = CONTENT_W / 2;
    
    const h1 = this.drawListCheck('WAS THERE ANY RESISTANCE FOR VALUATION:', val('axisSbbResistanceForValuation'), !!(fields as any).axisSbbResistanceForValuationIsNA, ['YES', 'NO'], false, MARGIN_L, splitW, true, true);
    const h2 = this.drawListCheck('IF YES, FROM THE CURRENT OCCUPANTS:', val('axisSbbResistanceFromOccupants'), !!(fields as any).axisSbbResistanceFromOccupantsIsNA, ['YES', 'NO'], false, MARGIN_L + splitW, splitW, true, true);
    
    let maxH = Math.max(h1, h2);
    this.checkPageBreak(maxH);
    
    this.drawListCheck('WAS THERE ANY RESISTANCE FOR VALUATION:', val('axisSbbResistanceForValuation'), !!(fields as any).axisSbbResistanceForValuationIsNA, ['YES', 'NO'], false, MARGIN_L, splitW, true, false, maxH);
    this.drawListCheck('IF YES, FROM THE CURRENT OCCUPANTS:', val('axisSbbResistanceFromOccupants'), !!(fields as any).axisSbbResistanceFromOccupantsIsNA, ['YES', 'NO'], false, MARGIN_L + splitW, splitW, true, false, maxH);
    this.cursorY += maxH;

    // Basic amenities
    let amenities = [];
    if ((fields as any).axisSbbBasicAmenitiesElectricity) amenities.push('ELECTRICITY');
    if ((fields as any).axisSbbBasicAmenitiesWater) amenities.push('WATER');
    if ((fields as any).axisSbbBasicAmenitiesDrainage) amenities.push('DRAINAGE\nCONNECTION');

    const h3 = this.drawListCheck('DOES PROPERTY HAVE BASIC AMENITIES', amenities, !!(fields as any).axisSbbBasicAmenitiesIsNA, ['ELECTRICITY', 'WATER', 'DRAINAGE\nCONNECTION'], false, MARGIN_L, splitW, true, true);
    const h4 = this.drawListCheck('DEVELOPMENT OF SURROUNDING AREA', val('axisSbbDevelopmentSurroundingArea'), !!(fields as any).axisSbbDevelopmentSurroundingAreaIsNA, ['UNDER DEVELOPED', 'DEVELOPING', 'DEVELOPED'], false, MARGIN_L + splitW, splitW, true, true);
    
    maxH = Math.max(h3, h4);
    this.checkPageBreak(maxH);
    
    this.drawListCheck('DOES PROPERTY HAVE BASIC AMENITIES', amenities, !!(fields as any).axisSbbBasicAmenitiesIsNA, ['ELECTRICITY', 'WATER', 'DRAINAGE\nCONNECTION'], false, MARGIN_L, splitW, true, false, maxH);
    this.drawListCheck('DEVELOPMENT OF SURROUNDING AREA', val('axisSbbDevelopmentSurroundingArea'), !!(fields as any).axisSbbDevelopmentSurroundingAreaIsNA, ['UNDER DEVELOPED', 'DEVELOPING', 'DEVELOPED'], false, MARGIN_L + splitW, splitW, true, false, maxH);
    this.cursorY += maxH;
    
    this.drawSectionSubtitle('APPROVAL DETAILS & BYE-LAWS COMPLIANCE');

    this.drawKeyValueRow([
      { label: 'Layout Approval Date', value: val('axisSbbLayoutApprovalDate') },
      { label: 'Layout Expiry Date', value: val('axisSbbLayoutExpiryDate') }
    ]);

    this.drawKeyValueRow([
      { label: 'Building Plan Approval Date', value: val('axisSbbBuildingPlanApprovalDate') },
      { label: 'Building Plan Expiry Date', value: val('axisSbbBuildingPlanExpiryDate') }
    ]);
  }

  private drawSbbSection8() {
    const fields = this.fields;
    
    const val = (key: string, computed?: string) => {
      if ((fields as any)[`${key}IsNA`]) return 'NA';
      if ((fields as any)[`${key}EditOn`] || !computed) {
        return String((fields as any)[key] || 'NA').replace(/[\t\n\r]+/g, ' ').trim() || 'NA';
      }
      return computed;
    };

    const floors = JSON.parse((fields as any).axisSbbFloorData || '[]');
    let sumConstructed = 0;
    let sumValuation = 0;
    floors.forEach((f: any) => {
      if (!f.constructedAreaIsNA && f.constructedArea) sumConstructed += Number(f.constructedArea) || 0;
      if (!f.valuationAreaIsNA && f.valuationArea) sumValuation += Number(f.valuationArea) || 0;
    });

    const computedConstructed = `${sumConstructed} SQFT`;
    const computedValuation = `${sumValuation} SQFT`;
    const computedCarpet = `${Math.round(sumConstructed * 0.85)} SQFT`;
    const computedSaleable = computedCarpet;

    this.drawSectionSubtitle('FLOOR WISE BREAK UP AS FOLLOWS IN SQ.FT.');
    
    const headers = [
      'FLOOR', 
      'CONSTRUCTED ACTUAL AREA AS PER SITE (SQ.FT)', 
      'APPROVED AREA AS PER PLAN(SQ.FT)', 
      'PERMISSIBLE AREA AS PER BYELAWS (SQ.FT)', 
      'AREA CONSIDERED FOR VALUATION (SQ.FT) / FAR 2', 
      'ACCOMMO DATE TION', 
      'CURRENT USAGE'
    ];
    
    const rows = floors.map((f: any) => {
      let usages = [];
      if (f.usageStorage) usages.push('STORAGE');
      if (f.usageParking) usages.push('PARKING');
      if (f.usageCommercial) usages.push('COMMERCIAL');
      if (f.usageResidential) usages.push('RESIDENTIAL');
      if (f.usageIndustry) usages.push('INDUSTRY');
      const usageStr = usages.join(', ') || 'NA';
      
      return [
        f.floorName || 'NA',
        f.constructedAreaIsNA ? 'NA' : (f.constructedArea ? `${f.constructedArea} SQFT` : '0 SQFT'),
        f.approvedAreaIsNA ? 'NA' : String(f.approvedArea || 'NA'),
        f.permissibleAreaIsNA ? 'NA' : String(f.permissibleArea || 'NA'),
        f.valuationAreaIsNA ? 'NA' : (f.valuationArea ? `${f.valuationArea} SQFT` : '0 SQFT'),
        f.accommodationIsNA ? 'NA' : String(f.accommodation || 'NA'),
        usageStr
      ];
    });

    rows.push([
      'TOTAL BUILT UP AREA (IN SQFT)',
      val('axisSbbTotalConstructedArea', computedConstructed),
      'NA',
      'NA',
      val('axisSbbTotalValuationArea', computedValuation),
      'NA',
      `TOTAL CARPET AREA:\n${val('axisSbbTotalCarpetArea', computedCarpet)}`
    ]);

    this.drawTable(headers, rows, [70, 70, 70, 70, 70, 80, 78], [], [0, 1, 2, 3, 4, 5, 6], [], [], [{ r: rows.length - 1, c: 0 }, { r: rows.length - 1, c: 1 }, { r: rows.length - 1, c: 4 }, { r: rows.length - 1, c: 6 }]);
    
    // Summary Row 2: Saleable Area
    this.drawSimpleRow('TOTAL SALEABLE AREA (IN SQFT.)', val('axisSbbTotalSaleableArea', computedSaleable), true, true);
    
    this.advanceCursor(10);
    
    this.drawSimpleRow('Construction As Per Approved Building Plan/Local Bye Laws', val('axisSbbConstructionAsPerApprovedPlan'));
    this.drawSimpleRow('FSI As Per Plan Approval / Govt. Guideline & Actual FSI', val('axisSbbFSIAsPerPlan'));

    this.drawKeyValueRow([
      { label: 'Details of Extra Construction', value: val('axisSbbExtraConstructionDetails') },
      { label: 'Percentage of Extra Construction', value: val('axisSbbExtraConstructionPercentage') }
    ]);

    this.drawSimpleRow('Whether the Construction is Compoundable or Non-Compoundable?', (fields as any).axisSbbCompoundableIsCustom ? val('axisSbbCompoundable') : val('axisSbbCompoundable'));
    
    const allRoofOptions = [
      { key: 'axisSbbQualityOfConstructionRoofRCC', label: 'RCC' },
      { key: 'axisSbbQualityOfConstructionRoofPatti', label: 'PATTI' },
      { key: 'axisSbbQualityOfConstructionRoofTinShed', label: 'TIN SHED' },
      { key: 'axisSbbQualityOfConstructionRoofClayTiles', label: 'CLAY TILES' },
    ];
    const allFloorOptions = [
      { key: 'axisSbbQualityOfConstructionFloorTiles', label: 'TILES' },
      { key: 'axisSbbQualityOfConstructionFloorMarble', label: 'MARBLE' },
      { key: 'axisSbbQualityOfConstructionFloorKotaStone', label: 'KOTA STONE' },
      { key: 'axisSbbQualityOfConstructionFloorLocalStone', label: 'LOCAL STONE' },
      { key: 'axisSbbQualityOfConstructionFloorCC', label: 'C.C' },
    ];

    // Check if edit is on (manual override)
    const qualityEditOn = (fields as any).axisSbbQualityOfConstructionEditOn;
    const qualityIsNA = (fields as any).axisSbbQualityOfConstructionIsNA;
    if (qualityIsNA) {
      this.drawSimpleRow('Quality of Construction', 'NA');
    } else if (qualityEditOn) {
      this.drawSimpleRow('Quality of Construction', val('axisSbbQualityOfConstruction'));
    } else {
      this.drawQualityOfConstructionRow(fields, allRoofOptions, allFloorOptions);
    }

    this.drawSimpleRow('Maintenance of the Property', (fields as any).axisSbbMaintenanceOfPropertyIsCustom ? val('axisSbbMaintenanceOfProperty') : val('axisSbbMaintenanceOfProperty'));

    this.drawKeyValueRow([
      { label: 'Current Life of Structure (Years)', value: val('axisSbbCurrentLifeOfStructure') },
      { label: 'Projected Life of Structure (Years)', value: val('axisSbbProjectedLifeOfStructure') }
    ]);
  }

  private drawSbbSection6() {
    const fields = this.fields;
    
    const val = (key: string, computed?: string) => {
      if ((fields as any)[`${key}IsNA`]) return 'NA';
      if ((fields as any)[`${key}EditOn`] || !computed) {
        return String((fields as any)[key] || 'NA').replace(/[\t\n\r]+/g, ' ').trim() || 'NA';
      }
      return computed;
    };

    const remarkComputed = (String((fields as any).axisSbbRoadWidthMaterial || '20 FEET WIDE ROAD')).toUpperCase();
    const fireExtComputed = parseInt(String((fields as any).axisSbbRoadWidthMaterial || '0')) >= 15 ? 'YES' : 'NO';
    const sqft = (fields as any).axisSbbPlotAreaSqft || '0';
    const acres = (fields as any).axisSbbPlotAreaAcres || '0.000';
    const areaComputed = `${sqft} SQFT (AC.${acres}DECS)`.toUpperCase();

    this.drawListCheck('DOES THE APPROACH ROAD TO THE BUILDING IS SMALL AND', fields.axisSbbApproachRoadSmall, fields.axisSbbApproachRoadSmallIsNA, ['YES', 'NO']);
    this.drawKeyValueRow([{ label: 'REMARK', value: val('axisSbbApproachRoadRemark', remarkComputed) }]);
    
    this.drawListCheck('WILL IT BE ABLE TO ACCOMMODATE A FIRE EXTINGUISHER', fields.axisSbbFireExtinguisher, fields.axisSbbFireExtinguisherIsNA, ['YES', 'NO']);
    this.drawListCheck('DOES THE PROPERTY FALLS UNDER LAND LOCKED AREA', fields.axisSbbLandLockedArea, fields.axisSbbLandLockedAreaIsNA, ['YES', 'NO']);
    
    this.drawListCheck('DOES THE PROPERTY FALLS IN A COMMUNITY DOMINATED AREA', fields.axisSbbCommunityDominatedArea, fields.axisSbbCommunityDominatedAreaIsNA, ['YES', 'NO']);
    this.drawListCheck('DOES THE BOUNDARIES AT SITE MATCH, AS MENTIONED IN DOCUMENTATION', fields.axisSbbBoundariesMatchDocument, fields.axisSbbBoundariesMatchDocumentIsNA, ['YES', 'NO']);

    this.drawSectionSubtitle('BOUNDARIES/DIMENSIONS (Comparison Matrix)');
    const headers = ['BOUNDARIES/DIMENSIONS', '(AS PER SALE DEED)', '(AS PER ACTUAL SITE)'];
    const rows = [
      ['NORTH', val('axisSbbNorthAsPerDeed'), val('axisSbbNorthAsPerActual')],
      ['SOUTH', val('axisSbbSouthAsPerDeed'), val('axisSbbSouthAsPerActual')],
      ['EAST', val('axisSbbEastAsPerDeed'), val('axisSbbEastAsPerActual')],
      ['WEST', val('axisSbbWestAsPerDeed'), val('axisSbbWestAsPerActual')]
    ];
    this.drawTable(headers, rows, [140, 184, 184], [], [0]);
    this.advanceCursor(10);
    
    this.drawKeyValueRow([
      { label: 'Plot Area (As per Documents)', value: val('axisSbbPlotAreaAsPerDocument') },
      { label: 'Plot Area (As per Sale Deed)', value: val('axisSbbPlotAreaAsPerSaleDeed', areaComputed) }
    ]);
    
    this.drawListCheck('CLASS OF LOCALITY', val('axisSbbClassOfLocality'), !!(fields as any).axisSbbClassOfLocalityIsNA, ['POSH', 'HIGHER MIDDLE CLASS', 'MIDDLE CLASS', 'LOWER MIDDLE CLASS', 'POOR']);
    
    this.drawListCheck('QUALITY OF INFRASTRUCTURE IN THE VICINITY', val('axisSbbQualityOfInfrastructure'), !!(fields as any).axisSbbQualityOfInfrastructureIsNA, ['EXCELLENT', 'GOOD', 'AVERAGE', 'POOR']);
    
    const ownerVal = (fields as any).axisSbbOwnershipStatus === 'GOVT. AUTHORITY, SPECIFY' && !(fields as any).axisSbbOwnershipStatusIsNA ? val('axisSbbOwnershipStatusSpecify') : val('axisSbbOwnershipStatus');
    this.drawListCheck('OWNERSHIP STATUS OF THE PROPERTY', ownerVal, !!(fields as any).axisSbbOwnershipStatusIsNA, ['LEASE HOLD', 'FREE HOLD', 'REG. LEASE', 'GOVT. AUTHORITY, SPECIFY']);

    const splitW = CONTENT_W / 2;
    const usageOptions = ['INDUSTRIAL', 'COMMERCIAL', 'RESIDENTIAL', 'VACANT LAND', 'MIX/AGRI', 'OTHERS/AGRI'];
    const h1 = this.drawListCheck('APPROVED USAGE OF PROPERTY', val('axisSbbApprovedUsage'), !!(fields as any).axisSbbApprovedUsageIsNA, usageOptions, false, MARGIN_L, splitW, true, true);
    const h2 = this.drawListCheck('ACTUAL USAGE OF PROPERTY', val('axisSbbActualUsage'), !!(fields as any).axisSbbActualUsageIsNA, usageOptions, false, MARGIN_L + splitW, splitW, true, true);
    
    const maxH = Math.max(h1, h2);
    this.checkPageBreak(maxH);
    
    this.drawListCheck('APPROVED USAGE OF PROPERTY', val('axisSbbApprovedUsage'), !!(fields as any).axisSbbApprovedUsageIsNA, usageOptions, false, MARGIN_L, splitW, true, false, maxH);
    this.drawListCheck('ACTUAL USAGE OF PROPERTY', val('axisSbbActualUsage'), !!(fields as any).axisSbbActualUsageIsNA, usageOptions, false, MARGIN_L + splitW, splitW, true, false, maxH);
    
    this.cursorY += maxH;

    this.drawKeyValueRow([
      { label: 'RESTRICTIVE COVENANTS IN REGARDS TO LAND USE (IF ANY)', value: val('axisSbbRestrictiveCovenants') }
    ]);
  }

  private drawSbbSection5() {
    const fields = this.fields;
    
    const val = (key: string, computed?: string) => {
      if ((fields as any)[`${key}IsNA`]) return 'NA';
      if ((fields as any)[`${key}EditOn`] || !computed) {
        const raw = (fields as any)[key];
        if (Array.isArray(raw)) return raw.length ? raw.join(', ') : 'NA';
        return String(raw || 'NA').replace(/[\t\n\r]+/g, ' ').trim() || 'NA';
      }
      return computed;
    };

    const address = (fields as any).axisSbbAddressOfTheProperty || '';
    const distMatch = address.match(/DIST(?:RICT)?[-\s]*([\s\S]*?)(?=,|-|PIN|$)/i);
    const mouzaMatch = address.match(/(?:MOUZA|VILLAGE|MZ\s*-)[-\s]*([\s\S]*?)(?=,|$|DIST|TAH)/i);
    const parsedCity = (distMatch ? distMatch[1] : (mouzaMatch ? mouzaMatch[1] : 'CITY')).replace(/\n/g, ' ').replace(/\s+/g, ' ').trim().toUpperCase();

    const stationName = (fields as any).axisSbbDistRailwayStationName || parsedCity;
    const busStopName = (fields as any).axisSbbDistBusStopName || parsedCity;
    const stationDistKm = (fields as any).axisSbbDistRailwayStationKm || '03';
    const busStopDistKm = (fields as any).axisSbbDistBusStopKm || '03';

    const stationComputed = `${stationDistKm}-KMS (${stationName} RAILWAY STATION)`.toUpperCase();
    const busStopComputed = `${busStopDistKm}-KMS. (${busStopName} BUS STOP)`.toUpperCase();
    
    this.drawSectionSubtitle('TYPE OF PROPERTY');
    this.drawListCheck('[A] PLOT / UNDER CONSTRUCTION', fields.axisSbbPropertyType, fields.axisSbbPropertyTypeIsNA, ['RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL', 'VACANT LAND/PLOT'], true);
    this.drawKeyValueRow([{ label: 'LEVEL OF LAND WITH TOPOGRAPHICAL CONDITIONS', value: val('axisSbbLevelOfLand', (fields as any).axisSbbLevelOfLandDropdown === 'CUSTOM' ? ((fields as any).axisSbbLevelOfLand || 'NA') : ((fields as any).axisSbbLevelOfLandDropdown || '')) }]);
    this.drawKeyValueRow([{ label: 'ANY CONSTRUCTION OBSERVED ON PLOT', value: val('axisSbbAnyConstructionObserved') }]);
    const pct = val('axisSbbPercentOfConstruction', '');
    this.drawKeyValueRow([{ label: '% OF CONSTRUCTION, IN CASE OF UNDER CONSTRUCTION', value: pct ? (pct === 'NA' || pct.endsWith('%') ? pct : `${pct}%`) : '' }]);
    this.drawListCheck('WEATHER VACANT LAND PROPERTY IS DEMARCATED', fields.axisSbbVacantLandDemarcated, fields.axisSbbVacantLandDemarcatedIsNA, ['YES', 'NO']);
    
    this.drawListCheck('[B] RESIDENTIAL PROPERTY', fields.axisSbbResidentialProperty, fields.axisSbbResidentialPropertyIsNA, ['INDEPENDENT HOUSE', 'BUNGALOW', 'ROW HOUSE/ FLAT'], true);
    this.drawListCheck('CIVIC AMENITIES LIKE SCHOOL, HOSPITAL, MARKET, ETC.', fields.axisSbbCivicAmenities, fields.axisSbbCivicAmenitiesIsNA, ['AVAILABLE, WITHIN THE RADIUS OF 1-2 KMS', 'NOT AVAILABLE'], true);
    this.drawListCheck('[C] COMMERCIAL/INDUSTRIAL PROPERTY', fields.axisSbbCommercialIndustrialProperty, fields.axisSbbCommercialIndustrialPropertyIsNA, ['OFFICE', 'VACANT LAND', 'UNIT IN A MALL', 'GODOWN', 'INDURSTRIAL', 'PETROL PUMP'], true);
    
    this.drawSectionSubtitle('ACCESSIBILITY/ BOUNDARIES/OTHERS');
    this.drawListCheck('AVAILABILITY OF LOCAL TRANSPORT', fields.axisSbbLocalTransport, fields.axisSbbLocalTransportIsNA, ['METRO', 'LOCAL TRAIN', 'BUS', 'PERSONAL TRANSPORT'], true);

    this.drawKeyValueRow([
      { label: 'DISTANCE FROM RAILWAY STATION', value: val('axisSbbDistRailwayStation', stationComputed) },
      { label: 'BUS STOP/ TAXI/ AUTO STAND', value: val('axisSbbDistBusStop', busStopComputed) }
    ]);
  }

  private drawSbbSection4() {
    const fields = this.fields;
    const address = (fields as any).axisSbbAddressOfTheProperty || '';
    
    // Auto-fill computations
    let plotComputedStr = address.split(/MOUZA|VILLAGE|MZ\s*-/i)[0].trim();
    if (plotComputedStr.endsWith(',')) plotComputedStr = plotComputedStr.slice(0, -1).trim();
    const plotComputed = plotComputedStr.toUpperCase() || '';
    const mouzaMatch = address.match(/(?:MOUZA|VILLAGE|MZ\s*-)[-\s]*[\s\S]*?(?=,|$|DIST|TAH)/i);
    const mouzaComputed = mouzaMatch ? mouzaMatch[0].replace(/\n/g, ' ').replace(/\s+/g, ' ').trim().toUpperCase() : '';
    const distMatch = address.match(/DIST(?:RICT)?[-\s]*([\s\S]*?)(?=,|-|PIN|$)/i);
    const distComputed = distMatch ? distMatch[1].replace(/\n/g, ' ').replace(/\s+/g, ' ').trim().toUpperCase() : '';
    const pinMatch = address.match(/PIN[-\s]*(\d{6})/i);
    const pinComputed = pinMatch ? pinMatch[1] : '';
    const distanceKm = (fields as any).axisSbbDistanceKm || '03';
    const refCity = distComputed || mouzaComputed || 'CITY';
    const distanceComputed = `${distanceKm}- KMS FROM ${refCity} CITY CENTRE`.toUpperCase();

    const val = (key: string, computed: string) => {
      if ((fields as any)[`${key}IsNA`]) return '';
      if ((fields as any)[`${key}EditOn`]) {
        return String((fields as any)[key] || '').replace(/[\t\n\r]+/g, ' ').trim() || '';
      }
      return computed || '';
    };
    
    this.drawKeyValueRow([
      { label: 'LEASE/SALE DEED NUMBER(S)', value: val('axisSbbDeedNumberDate', String((fields as any).axisSbbDeedNumberDate || '')) }
    ]);
    
    this.drawKeyValueRow([
      { label: 'PLOT NO/ S.NO/ G.NO/ KHASRA NO/PATTA NO', value: val('axisSbbPlotKhasraNo', plotComputed) },
      { label: 'ROAD', value: val('axisSbbRoadWidthMaterial', String((fields as any).axisSbbRoadWidthMaterial || '')) }
    ]);
    
    this.drawKeyValueRow([
      { label: 'COLONY/NAGAR/SECTOR', value: val('axisSbbColonySector', String((fields as any).axisSbbColonySector || '')) },
      { label: 'LOCALITY/ LANDMARK', value: val('axisSbbLocalityLandmark', String((fields as any).axisSbbLocalityLandmark || '')) }
    ]);
    
    this.drawKeyValueRow([
      { label: 'VILLAGE/TOWN/CITY', value: val('axisSbbVillageCity', mouzaComputed) },
      { label: 'DISTRICT', value: val('axisSbbDistrict', (fields as any).axisSbbDistrictDropdown === 'CUSTOM' ? ((fields as any).axisSbbDistrict || '') : distComputed) }
    ]);
    
    this.drawKeyValueRow([
      { label: 'STATE', value: val('axisSbbState', (fields as any).axisSbbStateDropdown === 'CUSTOM' ? ((fields as any).axisSbbState || '') : ((fields as any).axisSbbStateDropdown || 'ODISHA')) },
      { label: 'PIN CODE', value: val('axisSbbPinCode', pinComputed) }
    ]);
    
    this.drawKeyValueRow([
      { label: 'DISTANCE FROM CITY CENTRE', value: val('axisSbbDistanceFromCityCenter', distanceComputed) }
    ]);
  }

  private drawSbbSection3() {
    const fields = this.fields;
    
    this.drawSectionSubtitle('DETAILS OF THE PROPERTY BEING VALUED');
    
    const loc = fields.axisSbbPropertyLocation || '';
    const gov = fields.axisSbbGoverningBody || '';
    
    this.drawKeyValueRow([{ label: 'LOCATION OF PROPERTY', value: `[${loc === 'Urban' ? 'X' : ' '}] URBAN`, valueBold: loc === 'Urban', hideBottom: true }]);
    this.drawKeyValueRow([{ label: '', value: `[${loc === 'Semi-Urban' ? 'X' : ' '}] SEMI-URBAN`, valueBold: loc === 'Semi-Urban', hideTop: true, hideBottom: true }]);
    this.drawKeyValueRow([{ label: '', value: `[${loc === 'Rural/Gram Panchayat' ? 'X' : ' '}] RURAL/GRAM PANCHAYAT`, valueBold: loc === 'Rural/Gram Panchayat', hideTop: true, hideBottom: true }]);
    this.drawKeyValueRow([{ label: '', value: '', hideTop: true, hideBottom: true }]); // Spacer
    this.drawKeyValueRow([{ label: '', value: `[${gov === 'Corporation' ? 'X' : ' '}] CORPORATION`, valueBold: gov === 'Corporation', hideTop: true, hideBottom: true }]);
    this.drawKeyValueRow([{ label: '', value: `[${gov === 'Municipality' ? 'X' : ' '}] MUNICIPALITY`, valueBold: gov === 'Municipality', hideTop: true, hideBottom: true }]);
    this.drawKeyValueRow([{ label: '', value: `[${gov === 'Town or Gram Panchayat or Rural' ? 'X' : ' '}] TOWN OR GRAM PANCHAYAT OR RURAL`, valueBold: gov === 'Town or Gram Panchayat or Rural', hideTop: true, hideBottom: false }]);
    
    const t = fields.axisSbbTownPlanningSubType || '';
    const t1 = String(t).includes('Type 1');
    const t2a = String(t).includes('Type 2A');
    const t2b = String(t).includes('Type 2B');
    const t3 = String(t).includes('Type 3');
    
    this.drawKeyValueRow([{ label: 'TOWN PLANNING SUB-TYPE', value: `IF TOWN OR GRAM PANCHAYAT, PLEASE CHOOSE THE APPROPRIATE ONE IN BELOW: -`, hideBottom: true }]);
    this.drawKeyValueRow([{ label: '', value: `[${t1 ? 'X' : ' '}] TYPE 1:- LAYOUT PLAN & INDIVIDUAL CONSTRUCTION BOTH ARE APPROVED BY TOWN PLANNING AUTHORITY.`, valueBold: t1, hideTop: true, hideBottom: true }]);
    this.drawKeyValueRow([{ label: '', value: `[${t2a ? 'X' : ' '}] TYPE 2A:- LAYOUT PLAN APPROVED BY TOWN PLANNING AUTHORITY AND CONSTRUCTION APPROVED BY GRAMPANCHAYAT.`, valueBold: t2a, hideTop: true, hideBottom: true }]);
    this.drawKeyValueRow([{ label: '', value: `[${t2b ? 'X' : ' '}] TYPE 2B:- LAYOUT PLAN & INDIVIDUAL CONSTRUCTION BOTH ARE APPROVED BY GRAMPANCHAYAT BUT PROPERTY NOW FALLS IN MUNICIPALITY.`, valueBold: t2b, hideTop: true, hideBottom: true }]);
    this.drawKeyValueRow([{ label: '', value: `[${t3 ? 'X' : ' '}] TYPE 3:- LAYOUT PLAN & INDIVIDUAL CONSTRUCTION BOTH ARE APPROVED BY GRAMPANCHAYAT BUT PROPERTY NOW FALLS INSIDE GRAM PANCHAYAT.`, valueBold: t3, hideTop: true, hideBottom: false }]);
    
    const docArr = [
      { v: !!fields.axisSbbDocPrevValuation, t: 'COPY OF PREVIOUS VALUATION REPORT' },
      { v: !!fields.axisSbbDocApprovedLayout, t: 'APPROVED LAYOUT' },
      { v: !!fields.axisSbbDocCommencement, t: 'COMMENCEMENT' },
      { v: !!fields.axisSbbDocApprovedBuildingPlan, t: 'APPROVED BUILDING PLAN' },
      { v: !!fields.axisSbbDocSaleDeed, t: 'COPY OF SALE DEED/ PATTA' },
      { v: !!fields.axisSbbDocCommencement, t: 'CERTIFICATE' },
      { v: !!fields.axisSbbDocOccupancy, t: 'OCCUPANCY CERTIFICATE' },
      { v: !!fields.axisSbbDocPartitionDeed, t: 'COPY PARTITION DEED' },
      { v: !!fields.axisSbbDocSketchMap, t: 'SKETCH MAP' }
    ];
    
    docArr.forEach((d, i) => {
      this.drawKeyValueRow([{ 
        label: i === 0 ? 'DOCUMENTS PROVIDED' : '', 
        value: `[${d.v ? 'X' : ' '}] ${d.t}`, 
        valueBold: d.v,
        hideTop: i > 0,
        hideBottom: i < docArr.length - 1
      }]);
    });
  }

  private drawSbbSection2() {
    const fields = this.fields;
    const fv = (key: string, defaultVal = '') => String((fields as any)[key] || defaultVal).replace(/[\t\n\r]+/g, ' ').trim() || defaultVal;

    this.drawKeyValueRow([
      { label: 'Report Initiated By Area', value: fv('axisSbbReportInitiatedBy') },
      { label: 'Name of Area', value: fv('axisSbbAreaName') }
    ]);
    this.drawKeyValueRow([
      { label: 'Name of Owner', value: fv('axisSbbOwnerName') },
      { label: 'Name of Customer', value: fv('axisSbbCustomerName') }
    ]);
    this.drawKeyValueRow([
      { label: 'Date of Property Visit', value: fv('axisSbbDateOfVisit') },
      { label: 'Sale Deed Discretions For Which Valuation Done', value: fv('axisSbbSaleDeedDiscretions') }
    ]);
  }

  // ─── Cover Page (Page 1) ───────────────────────────────────────────────
  private drawSbbCoverPage() {
    const fields = this.fields;
    const fv = (key: string, defaultVal = '') => String((fields as any)[key] ?? defaultVal).replace(/[\t\n\r]+/g, ' ');

    // Reset cursor for the cover page
    this.cursorY = 60;

    // Page 1 Border
    const bmx = 30;
    const bmyTop = 105;
    const bmyBot = 85;
    const borderColorHex = hexToRgb('#4a6078');

    // Outer thick border
    this.page.drawRectangle({
      x: bmx,
      y: bmyBot,
      width: PAGE_W - 2 * bmx,
      height: PAGE_H - bmyBot - bmyTop,
      borderColor: borderColorHex,
      borderWidth: 2.5,
    });
    // Inner thin border
    this.page.drawRectangle({
      x: bmx + 3,
      y: bmyBot + 3,
      width: PAGE_W - 2 * bmx - 6,
      height: PAGE_H - bmyBot - bmyTop - 6,
      borderColor: borderColorHex,
      borderWidth: 0.75,
    });

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
        if (underline && i === lines.length - 1) {
          this.page.drawLine({
            start: { x: startX, y: startY - 2 },
            end: { x: startX + tw, y: startY - 2 },
            thickness: 1,
            color: rgb(0, 0, 0)
          });
        }
        if (i < lines.length - 1) {
          this.cursorY += size + 4;
        } else {
          this.cursorY += ySpaceAfter;
        }
      }
    };

    drawCenteredBold('VALUATION OF IMMOVABLE PROPERTY', FONT_SIZE_TITLE + 3, 40, true);

    // Property Owners from dynamic array
    drawCenteredBold('PROPERTY OWNER', FONT_SIZE_HEADER, 16, true);
    const owners = Array.isArray(fields.axisSbbPropertyOwners) && fields.axisSbbPropertyOwners.length > 0
      ? fields.axisSbbPropertyOwners
      : [{ name: '', relationship: 'S/O', relativeName: '', fatherName: '' }];
    const validOwners = owners.filter((o: any) => o.name);
    if (validOwners.length > 0) {
      const ownerStrings = validOwners.map((owner: any) => {
        const rel = owner.relationship || 'S/O';
        const relName = owner.relativeName || owner.fatherName;
        if (relName) {
          return `${owner.name} ${rel} ${relName}`;
        }
        return owner.name;
      });

      let ownersText = '';
      if (ownerStrings.length === 1) {
        ownersText = ownerStrings[0];
      } else if (ownerStrings.length === 2) {
        ownersText = ownerStrings.join(' & ');
      } else {
        const last = ownerStrings.pop();
        ownersText = ownerStrings.join(', ') + ' & ' + last;
      }
      
      drawCenteredBold(ownersText, FONT_SIZE, 14);
    }
    this.cursorY += 16;

    drawCenteredBold('ADDRESS OF THE PROPERTY', FONT_SIZE_HEADER, 16, true);
    drawCenteredBold(fv('axisSbbAddressOfTheProperty'), FONT_SIZE, 40);

    drawCenteredBold('VALUE OF THE PROPERTY', FONT_SIZE_HEADER, 16, true);
    let pmv = fv('axisSbbPresentMarketValue', '');
    let dsv = fv('axisSbbDistressSaleValue', '');
    let rv = fv('axisSbbRealizableValue', '');

    if (!this.fields.axisSbbEnableCoverPageValueEdit) {
      const landAreaPrefill = this.fields.axisSbbPlotAreaAsPerDocument || '';
      const floors9 = JSON.parse(this.fields.axisSbbFloorData || '[]');
      let sumConstructed9 = 0;
      floors9.forEach((f: any) => {
        if (!f.constructedAreaIsNA && f.constructedArea) sumConstructed9 += Number(f.constructedArea) || 0;
      });
      const buildingAreaPrefillStr = `${sumConstructed9}`;
      const buildingAreaPrefill = buildingAreaPrefillStr.replace(/[^0-9.]/g, '') || '';
      
      const getLandArea = () => this.fields.axisSbbValuationLandAreaIsNA ? 0 : (this.fields.axisSbbValuationLandAreaEditOn ? this.fields.axisSbbValuationLandArea : landAreaPrefill);
      const getBldgArea = () => this.fields.axisSbbValuationBuildingAreaIsNA ? 0 : (this.fields.axisSbbValuationBuildingAreaEditOn ? this.fields.axisSbbValuationBuildingArea : buildingAreaPrefill);
      
      const landAmount = Number(getLandArea()) * Number(this.fields.axisSbbValuationLandRate || 0);
      const buildingAmount = Number(getBldgArea()) * Number(this.fields.axisSbbValuationBuildingRate || 0);
      const amenitiesAmount = Number(this.fields.axisSbbValuationAmenitiesArea || 0) * Number(this.fields.axisSbbValuationAmenitiesRate || 0);
      const totalAmountComp = landAmount + buildingAmount + amenitiesAmount;
      const totalSayComp = Math.floor(totalAmountComp / 1000) * 1000;

      const finalMarketValue = this.fields.axisSbbFinalMarketValueIsNA ? 0 : (this.fields.axisSbbFinalMarketValueEditOn ? Number(this.fields.axisSbbFinalMarketValue || 0) : totalSayComp);
      const finalDistressValue = this.fields.axisSbbFinalDistressValueIsNA ? 0 : (this.fields.axisSbbFinalDistressValueEditOn ? Number(this.fields.axisSbbFinalDistressValue || 0) : (finalMarketValue * 0.90));
      const finalRealizableValue = this.fields.axisSbbFinalRealizableValueIsNA ? 0 : (this.fields.axisSbbFinalRealizableValueEditOn ? Number(this.fields.axisSbbFinalRealizableValue || 0) : (finalMarketValue * 0.95));

      pmv = finalMarketValue > 0 ? finalMarketValue.toFixed(2) : '0.00';
      dsv = finalMarketValue > 0 ? (Math.round(finalDistressValue / 1000) * 1000).toFixed(2) : '0.00';
      rv = finalMarketValue > 0 ? (Math.round(finalRealizableValue / 1000) * 1000).toFixed(2) : '0.00';
    }

    drawCenteredBold(`PRESENT MARKET VALUE: ${pmv}`, FONT_SIZE, 14);
    drawCenteredBold(`DISTRESS SALE VALUE: ${dsv}`, FONT_SIZE, 14);
    drawCenteredBold(`REALIZABLE VALUE: ${rv}`, FONT_SIZE, 40);

    drawCenteredBold('PURPOSE OF VALUATION', FONT_SIZE_HEADER, 16, true);
    drawCenteredBold(fv('axisSbbPurposeOfValuation', 'TO ASSESS THE FAIR MARKET VALUE OF THE COLLATERAL SECURITY'), FONT_SIZE, 40);

    drawCenteredBold('PREPARED BY', FONT_SIZE_HEADER, 16, true);

    drawCenteredBold(fv('axisSbbPreparedByCompany', 'M/s. S MOHANTY ASSOCIATES'), FONT_SIZE, 14);
    drawCenteredBold(fv('axisSbbPreparedByDesignation', 'EMPANELLED VALUER & CHARTERED ENGINEER'), FONT_SIZE, 14);

    const plotNo = fv('axisSbbPreparedByPlotNo', 'Plot no-859/2494/3232 & 858/2493/3295');
    if (plotNo) drawCenteredBold(`${plotNo},`, FONT_SIZE, 14);

    const street = fv('axisSbbPreparedByStreet', 'Shiv Nagar Tankapani Road');
    if (street) drawCenteredBold(`${street},`, FONT_SIZE, 14);

    const cityStatePin = [
      fv('axisSbbPreparedByCity', 'Bhubaneswar'),
      fv('axisSbbPreparedByState', 'Odisha'),
      fv('axisSbbPreparedByPinCode', '751018') ? `Pin-${fv('axisSbbPreparedByPinCode', '751018')}` : ''
    ].filter(Boolean).join(', ');
    if (cityStatePin) drawCenteredBold(cityStatePin, FONT_SIZE, 14);

    drawCenteredBold(`PHONE- ${fv('axisSbbPreparedByPhone', '06742381145')}`, FONT_SIZE, 14);

    let rawMobile = fv('axisSbbPreparedByMobile', '9937023855/9437074855');
    let processedMobile = rawMobile.replace(/[^0-9]+/g, '/').replace(/(^\/|\/$)/g, '');
    drawCenteredBold(`MOBILE-${processedMobile}`, FONT_SIZE, 0);
  }

  private drawSbbSection9() {
    const fields = this.fields;
    const val = (key: string, computed?: string) => {
      if (fields[`${key}IsNA`]) return 'NA';
      if (fields[`${key}EditOn`] || !computed) {
        return String(fields[key] || 'NA').replace(/[\t\n\r]+/g, ' ').trim() || 'NA';
      }
      return computed;
    };

    const numVal = (key: string, computed?: string) => {
      const str = val(key, computed);
      return str === 'NA' ? 'NA' : `Rs. ${Number(str).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/-`;
    };

    // Computations from React Component
    const landAreaPrefill = fields.axisSbbPlotAreaAsPerDocument || '';
    const buildingAreaPrefill = fields.axisSbbTotalConstructedArea || '';

    const getLandArea = () => fields.axisSbbValuationLandAreaIsNA ? 0 : (fields.axisSbbValuationLandAreaEditOn ? fields.axisSbbValuationLandArea : landAreaPrefill);
    const getBldgArea = () => fields.axisSbbValuationBuildingAreaIsNA ? 0 : (fields.axisSbbValuationBuildingAreaEditOn ? fields.axisSbbValuationBuildingArea : buildingAreaPrefill);

    const landAmount = Number(getLandArea()) * Number(fields.axisSbbValuationLandRate || 0);
    const buildingAmount = Number(getBldgArea()) * Number(fields.axisSbbValuationBuildingRate || 0);
    const amenitiesAmount = Number(fields.axisSbbValuationAmenitiesArea || 0) * Number(fields.axisSbbValuationAmenitiesRate || 0);
    const totalAmountComp = landAmount + buildingAmount + amenitiesAmount;
    const totalSayComp = Math.floor(totalAmountComp / 1000) * 1000;

    const govtLandAmount = Number(fields.axisSbbGovtLandAreaIsNA ? 0 : (fields.axisSbbGovtLandAreaEditOn ? fields.axisSbbGovtLandArea : landAreaPrefill)) * Number(fields.axisSbbGovtLandRate || 0);
    const govtBuildingAmount = Number(fields.axisSbbGovtBuildingAreaIsNA ? 0 : (fields.axisSbbGovtBuildingAreaEditOn ? fields.axisSbbGovtBuildingArea : buildingAreaPrefill)) * Number(fields.axisSbbGovtBuildingRate || 0);

    const marketValueComp = totalAmountComp;
    const distressValueComp = marketValueComp * 0.90;
    const realizableValueComp = marketValueComp * 0.95;
    const insurableValueComp = buildingAmount * 0.85;

    // --- Table 9.1 ---
    this.drawSectionSubtitle('MARKET VALUE');
    const table91Headers = ['', 'AREA IN SQ.FT.', 'RATE PER SQ.FT.', 'AMOUNT IN RS.'];
    const bldgDisplay = 'Building G+1\nFAR 2';
    const table91Data = [
      ['Land', val('axisSbbValuationLandArea', landAreaPrefill), val('axisSbbValuationLandRate'), numVal('axisSbbValuationLandAmount', landAmount.toFixed(2))],
      [bldgDisplay, val('axisSbbValuationBuildingArea', buildingAreaPrefill), val('axisSbbValuationBuildingRate'), numVal('axisSbbValuationBuildingAmount', buildingAmount.toFixed(2))],
      ['Amenities', val('axisSbbValuationAmenitiesArea'), val('axisSbbValuationAmenitiesRate'), numVal('axisSbbValuationAmenitiesAmount', amenitiesAmount.toFixed(2))],
    ];
    this.drawTable(table91Headers, table91Data, [40, 20, 20, 20]);
    this.cursorY += 2;
    this.drawSimpleRow('Total Valuation 100% Completion (I+II)', numVal('axisSbbValuationTotalAmount', totalAmountComp.toFixed(2)), true, true);
    this.drawSimpleRow('Total Valuation in Say', numVal('axisSbbValuationTotalSayAmount', totalSayComp.toFixed(2)), true, true);

    this.cursorY += 10;
    
    // --- Table 9.2 ---
    this.drawSectionSubtitle('GOVERNMENT GUIDELINE VALUE');
    const table92Headers = ['', 'AREA IN SQ.FT.', 'RATE PER SQ.FT.', 'AMOUNT IN RS.'];
    const table92Data = [
      ['Land', val('axisSbbGovtLandArea', landAreaPrefill), val('axisSbbGovtLandRate'), numVal('axisSbbGovtLandAmount', govtLandAmount.toFixed(2))],
      ['Building', val('axisSbbGovtBuildingArea', buildingAreaPrefill), val('axisSbbGovtBuildingRate'), numVal('axisSbbGovtBuildingAmount', govtBuildingAmount.toFixed(2))],
    ];
    this.drawTable(table92Headers, table92Data, [40, 20, 20, 20]);

    this.cursorY += 10;

    // --- Summary Cards ---
    this.drawKeyValueRow([
      { label: 'Market Value', value: numVal('axisSbbFinalMarketValue', marketValueComp.toFixed(2)) },
      { label: 'Distressed / Forced Sale Value (90%)', value: numVal('axisSbbFinalDistressValue', distressValueComp.toFixed(2)) }
    ]);
    this.drawKeyValueRow([
      { label: 'Realizable Value (95%)', value: numVal('axisSbbFinalRealizableValue', realizableValueComp.toFixed(2)) },
      { label: 'Insurable Value (App.) (Construction Value)', value: numVal('axisSbbFinalInsurableValue', insurableValueComp.toFixed(2)) }
    ]);
  }

  private drawSbbSection10() {
    const fields = this.fields;
    
    const val = (key: string, computed?: string) => {
      if ((fields as any)[`${key}IsNA`]) return 'NA';
      if ((fields as any)[`${key}EditOn`] || !computed) {
        return String((fields as any)[key] || 'NA').replace(/[\t\n\r]+/g, ' ').trim() || 'NA';
      }
      return computed;
    };

    const structTypes = [];
    if (fields.axisSbbTypeOfStructureGCI) structTypes.push('GCI');
    if (fields.axisSbbTypeOfStructureTinShed) structTypes.push('TIN SHED');
    if (fields.axisSbbTypeOfStructureRCC) structTypes.push('RCC');
    if (fields.axisSbbTypeOfStructureAluform) structTypes.push('ALUFORM SHUTTERING');
    const structVal = structTypes.length > 0 ? structTypes.join(', ') : 'RCC';

    const areaStr = fields.axisSbbLandAreaAcres || fields.axisSbbLandAreaDecimals ? `${fields.axisSbbLandAreaAcres || 0} AC. ${fields.axisSbbLandAreaDecimals || 0} DEC.` : (fields.axisSbbPlotAreaAsPerDocument || '');
    const buaStr = fields.axisSbbTotalConstructedArea || '';
    const floorBreakdown = fields.axisSbbNoOfFloors || '';
    const age = fields.axisSbbAgeOfProperty || '';
    const occupancy = fields.axisSbbOccupancyDetails || '';
    const location = [fields.axisSbbColonySector, fields.axisSbbLocalityLandmark, fields.axisSbbVillageCity].filter(Boolean).join(', ');
    const civicRadius = fields.axisSbbBasicAmenities || '';
    const corp = fields.axisSbbWardNoGramPanchayat || '';
    const cityDist = fields.axisSbbDistanceCityCentre || '';
    const approachRoad = fields.axisSbbRoadWidthMaterial || '';
    const farComp = fields.axisSbbStructureConfirmingByelaws || '';

    const synthesizedRemarks = `THE SUBJECT PROPERTY COMPRISES A ${structVal} STORIED RCC BUILDING (${floorBreakdown.toUpperCase()}) HAVING TOTAL LAND AREA OF ${areaStr.toUpperCase()} AND TOTAL BUILT-UP AREA (BUA) OF APPROXIMATELY ${buaStr.toUpperCase()} SQ. FT. THE PROPERTY IS APPROXIMATELY ${age.toUpperCase()} YEARS OLD. AT THE TIME OF THE TECHNICAL INSPECTION, THE ENTIRE PROPERTY WAS FOUND TO BE ${occupancy.toUpperCase()} AND WAS BEING UTILIZED FOR RESIDENTIAL PURPOSES AS WELL AS A GODOWN-CUM-OFFICE.

THE PROPERTY IS SITUATED AT ${location.toUpperCase()}, WITHIN A WELL-DEVELOPING RESIDENTIAL LOCALITY. ALL ESSENTIAL CIVIC AND SOCIAL AMENITIES ARE AVAILABLE WITHIN A RADIUS OF APPROXIMATELY ${civicRadius.toUpperCase()} KM. THE PROPERTY FALLS WITHIN THE JURISDICTION OF THE ${corp.toUpperCase()} AND IS LOCATED APPROXIMATELY ${cityDist.toUpperCase()} KM FROM THE CITY CENTRE. THE PROPERTY ENJOYS ACCESS THROUGH A ${approachRoad.toUpperCase()}.

THE VALUATION HAS BEEN CARRIED OUT BY CONSIDERING THE LAND COMPONENT AND THE ACTUAL MEASURED BUILT-UP AREA (BUA) OF THE EXISTING STRUCTURES. THE MEASURED BUILT-UP AREA IS WITHIN THE PERMISSIBLE FLOOR AREA RATIO (FAR) LIMIT OF ${farComp.toUpperCase()}, AND THE VALUATION HAS BEEN ASSESSED ACCORDINGLY.`;

    const actualRemarks = val('axisSbbRemarks', synthesizedRemarks);
    const actualNote = fields.axisSbbRemarksNote && !fields.axisSbbRemarksNoteIsNA ? val('axisSbbRemarksNote') : '';
    
    const itemsToDraw = [];
    if (actualRemarks && actualRemarks !== 'NA') {
      itemsToDraw.push({ label: 'REMARKS: -', text: actualRemarks });
    }
    if (actualNote && actualNote !== 'NA') {
      itemsToDraw.push({ label: 'NOTE:-', text: actualNote });
    }
    
    if (itemsToDraw.length > 0) {
      const itemsWithLines = itemsToDraw.map(item => {
        // Since remarks might contain manual newlines (\n), we need to split by \n first
        const rawParagraphs = item.text.split('\n');
        const paragraphsLines = [];
        
        let isFirstParagraph = true;
        for (const para of rawParagraphs) {
           const textToWrap = isFirstParagraph ? `${item.label} ${para.trim()}` : para.trim();
           if (textToWrap) {
             const lines = this.wrapText(textToWrap, CONTENT_W - 10, FONT_SIZE, false);
             paragraphsLines.push(...lines);
           }
           isFirstParagraph = false;
        }
        return { item, lines: paragraphsLines };
      });
      
      const totalH = itemsWithLines.reduce((sum, obj, idx) => {
         return sum + (obj.lines.length * (FONT_SIZE + 4)) + (idx === itemsWithLines.length - 1 ? 10 : 15);
      }, 0);
      
      this.checkPageBreak(totalH);
      const y = this.pdfY(this.cursorY);
      
      this.page.drawRectangle({
        x: MARGIN_L,
        y: y - totalH,
        width: CONTENT_W,
        height: totalH,
        borderColor: rgb(0,0,0),
        borderWidth: 1
      });
      
      let cy = y - 5 - FONT_SIZE;
      for (const { item, lines } of itemsWithLines) {
        let isFirstLine = true;
        for (const line of lines) {
          if (isFirstLine) {
             const labelW = this.fontBold.widthOfTextAtSize(item.label, FONT_SIZE);
             this.page.drawText(item.label, { x: MARGIN_L + 5, y: cy, size: FONT_SIZE, font: this.fontBold, color: rgb(0,0,0) });
             
             const remainingText = line.substring(item.label.length);
             this.page.drawText(remainingText, { x: MARGIN_L + 5 + labelW, y: cy, size: FONT_SIZE, font: this.fontRegular, color: rgb(0,0,0) });
             isFirstLine = false;
          } else {
             this.page.drawText(line, { x: MARGIN_L + 5, y: cy, size: FONT_SIZE, font: this.fontRegular, color: rgb(0,0,0) });
          }
          cy -= (FONT_SIZE + 4);
        }
        cy -= 11; // extra space between items
      }
      this.cursorY += totalH;
    }

    if (this.cursorY > 10) this.cursorY += 15;
    
    const heading = 'UNDERTAKING:-';
    const hw = this.fontBold.widthOfTextAtSize(heading, FONT_SIZE);
    
    this.checkPageBreak(FONT_SIZE + 4);
    let y = this.pdfY(this.cursorY);
    this.page.drawText(heading, { x: MARGIN_L, y: y - FONT_SIZE, size: FONT_SIZE, font: this.fontBold, color: rgb(0,0,0) });
    this.page.drawLine({ start: { x: MARGIN_L, y: y - FONT_SIZE - 2 }, end: { x: MARGIN_L + hw + 2.5, y: y - FONT_SIZE - 2 }, thickness: 1, color: rgb(0,0,0) });
    this.cursorY += FONT_SIZE + 15;
    
    if (fields.axisSbbUndertakingIsNA) {
       this.checkPageBreak(FONT_SIZE + 4);
       y = this.pdfY(this.cursorY);
       this.page.drawText('> NA', { x: MARGIN_L + 15, y: y - FONT_SIZE, size: FONT_SIZE, font: this.fontRegular, color: rgb(0,0,0) });
       this.cursorY += FONT_SIZE + 10;
    } else {
       const clauses = [
          { key: 'axisSbbUndertakingClause1', label: 'I HAVE PERSONALLY VISITED THE PROPERTY & IDENTIFIED THE SAME BASED ON THE DOCUMENTS PROVIDED.' },
          { key: 'axisSbbUndertakingClause2', label: 'I/WE HAVE NO DIRECT OR INDIRECT INTEREST IN THE PROPERTY BEING VALUED.' },
          { key: 'axisSbbUndertakingClause3', label: 'THE INFORMATION FURNISHED ABOVE IS TRUE AND CORRECT TO MY/OUR KNOWLEDGE.' },
          { key: 'axisSbbUndertakingClause4', label: 'I HAVE NOT BEEN PENALIZED OR CONVICTED BY ANY BANK/FINANCIAL INSTITUTION/GOVERNMENT DEPARTMENT/PSU/CORPORATE.' },
          { key: 'axisSbbUndertakingClause5', label: 'THIS VALUATION IS PREPARED WITHOUT ANY PREJUDICE OR BIAS TO ANY PERSON OR INSTITUTION.' },
          { key: 'axisSbbUndertakingClause6', label: 'THE VALUE OF LAND IS TAKEN INTO ACCOUNT BY MAKING DUE ENQUIRES IN THE LOCALITY AND ASCERTAINING THE SALES VALUE OF THE PROPERTIES IN THE LOCALITY.' },
          { key: 'axisSbbUndertakingClause7', label: 'ANY ADDITIONS/ALTERATIONS MADE TO THE PROPERTY AFTER THE DATE OF VALUATIONS SHALL NOT FALL UNDER THE SCOPE OF THIS REPORT.' },
       ];
       
       for (const clause of clauses) {
         if (fields[clause.key]) {
           const lines = this.wrapText(clause.label, CONTENT_W - 25, FONT_SIZE, false);
           const totalH = lines.length * (FONT_SIZE + 4);
           this.checkPageBreak(totalH + 5);
           y = this.pdfY(this.cursorY);
           
           this.page.drawText('>', { x: MARGIN_L + 10, y: y - FONT_SIZE, size: FONT_SIZE, font: this.fontRegular, color: rgb(0,0,0) });
           let cy = y - FONT_SIZE;
           for (const line of lines) {
             this.page.drawText(line, { x: MARGIN_L + 25, y: cy, size: FONT_SIZE, font: this.fontRegular, color: rgb(0,0,0) });
             cy -= (FONT_SIZE + 4);
           }
           this.cursorY += totalH + 10;
         }
       }
    }
  }
}
