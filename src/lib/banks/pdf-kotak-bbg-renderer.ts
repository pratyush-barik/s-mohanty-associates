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
  VAL_BG,
  BG_OPACITY,
  hexToRgb,
  MARGIN_L,
  CONTENT_W,
} from '../pdf-bank-renderer';

export class PDFKotakBbgRenderer extends PDFBankRenderer {
  private fields: any;
  private projectCode?: string;

  constructor(opts: any = {}) {
    super();
    this.fields = opts || {};
    this.projectCode = opts.projectCode;
  }

  private getF(key: string, defaultVal: any = ''): any {
    return this.fields[key] ?? defaultVal;
  }

  private stripHtml(html: string): string {
    return (html || '').replace(/<[^>]*>?/gm, '');
  }

  override drawSectionHeader(title: string, addSpaceBefore = true, preserveCase = false): void {
    if (addSpaceBefore && this.cursorY > 10) this.cursorY += 10;
    const match = title.match(/^([0-9]+)\.\s*(.*)/);
    let index = '';
    let text = title;
    if (match) { index = match[1]; text = match[2]; }
    if (!preserveCase) text = text.toUpperCase();

    const w1 = index ? 30 : 0;
    const w2 = CONTENT_W - w1;
    const pad = 3;
    const fontSize = FONT_SIZE_HEADER;

    const iLines = index ? this.wrapText(index, w1 - pad * 2, fontSize, true) : [];
    const tLines = this.wrapText(text, w2 - pad * 2, fontSize, true);
    
    const maxLines = Math.max(iLines.length, tLines.length, 1);
    const rowH = Math.max(20 + (maxLines - 1) * 14, maxLines * fontSize * LINE_HEIGHT + pad * 2);
    
    this.checkPageBreak(rowH + 30);
    const y = this.pdfY(this.cursorY);
    
    this.page.drawRectangle({ x: MARGIN_L, y: y - rowH, width: CONTENT_W, height: rowH, color: hexToRgb(OPT_BG), opacity: BG_OPACITY });
    
    if (w1 > 0) {
      this.page.drawRectangle({ x: MARGIN_L, y: y - rowH, width: w1, height: rowH, borderColor: rgb(0,0,0), borderWidth: BORDER_W });
      let lineY = y - pad - fontSize * 0.85;
      for (const line of iLines) {
        this.page.drawText(line, { x: MARGIN_L + pad, y: lineY, size: fontSize, font: this.fontBold, color: rgb(0,0,0) });
        lineY -= fontSize * LINE_HEIGHT;
      }
    }
    
    this.page.drawRectangle({ x: MARGIN_L + w1, y: y - rowH, width: w2, height: rowH, borderColor: rgb(0,0,0), borderWidth: BORDER_W });
    let lineY2 = y - pad - fontSize * 0.85;
    for (const line of tLines) {
      const tw = this.fontBold.widthOfTextAtSize(line, fontSize);
      this.page.drawText(line, { x: MARGIN_L + w1 + (w2 - tw) / 2, y: lineY2, size: fontSize, font: this.fontBold, color: rgb(0,0,0) });
      lineY2 -= fontSize * LINE_HEIGHT;
    }
    
    this.cursorY += rowH;
  }

  override drawKeyValueRow(cols: { label: string; value: string; labelWidth?: number; valueWidth?: number; highlight?: boolean; bold?: boolean; labelBold?: boolean; valueBold?: boolean; hideTop?: boolean; hideBottom?: boolean }[]): void {
    const pad = 3;
    const fontSize = FONT_SIZE;
    
    for (const c of cols) {
      if (c.valueWidth === 0) {
        const match = c.label.match(/^([a-z0-9]+)\.\s*(.*)/i);
        let index = '';
        let text = c.label;
        if (match) { index = match[1]; text = match[2]; }
        
        const w1 = index ? 30 : 0;
        const w2 = CONTENT_W - w1;
        
        const iLines = index ? this.wrapText(index, w1 - pad * 2, fontSize, true) : [];
        const tLines = this.wrapText(text, w2 - pad * 2, fontSize, c.labelBold !== false);
        const maxLines = Math.max(iLines.length, tLines.length, 1);
        const rowH = Math.max(18, maxLines * fontSize * LINE_HEIGHT + pad * 2);
        
        this.checkPageBreak(rowH);
        const y = this.pdfY(this.cursorY);
        
        if (w1 > 0) {
          this.page.drawRectangle({ x: MARGIN_L, y: y - rowH, width: w1, height: rowH, borderColor: rgb(0,0,0), borderWidth: BORDER_W });
          let lineY = y - pad - fontSize * 0.85;
          for (const line of iLines) {
            this.page.drawText(line, { x: MARGIN_L + pad, y: lineY, size: fontSize, font: this.fontBold, color: rgb(0,0,0) });
            lineY -= fontSize * LINE_HEIGHT;
          }
        }
        
        this.page.drawRectangle({ x: MARGIN_L + w1, y: y - rowH, width: w2, height: rowH, borderColor: rgb(0,0,0), borderWidth: BORDER_W });
        let lineY2 = y - pad - fontSize * 0.85;
        for (const line of tLines) {
          this.page.drawText(line, { x: MARGIN_L + w1 + pad, y: lineY2, size: fontSize, font: c.labelBold !== false ? this.fontBold : this.fontRegular, color: rgb(0,0,0) });
          lineY2 -= fontSize * LINE_HEIGHT;
        }
        this.cursorY += rowH;
        continue;
      }
      
      let index = '';
      let text = c.label;
      const match = c.label.match(/^([a-z0-9]+)\.\s*(.*)/i);
      if (match) {
        index = match[1];
        text = match[2];
      }
      
      const w1 = 30;
      const w2 = c.labelWidth ? (c.labelWidth > 30 ? c.labelWidth - 30 : c.labelWidth) : 180;
      const w3 = CONTENT_W - w1 - w2;

      const iLines = this.wrapText(index, w1 - pad * 2, fontSize, true);
      const lLines = this.wrapText(text, w2 - pad * 2, fontSize, c.labelBold !== false);
      const vLines = this.wrapText(c.value, w3 - pad * 2, fontSize, c.valueBold || c.bold);
      
      const maxLines = Math.max(iLines.length, lLines.length, vLines.length, 1);
      const rowH = Math.max(18, maxLines * fontSize * LINE_HEIGHT + pad * 2);
      
      this.checkPageBreak(rowH);
      const y = this.pdfY(this.cursorY);
      
      this.page.drawRectangle({ x: MARGIN_L, y: y - rowH, width: w1, height: rowH, borderColor: rgb(0,0,0), borderWidth: BORDER_W });
      let lineY = y - pad - fontSize * 0.85;
      for (const line of iLines) {
        this.page.drawText(line, { x: MARGIN_L + pad, y: lineY, size: fontSize, font: this.fontBold, color: rgb(0,0,0) });
        lineY -= fontSize * LINE_HEIGHT;
      }
      
      this.page.drawRectangle({ x: MARGIN_L + w1, y: y - rowH, width: w2, height: rowH, borderColor: rgb(0,0,0), borderWidth: BORDER_W });
      lineY = y - pad - fontSize * 0.85;
      for (const line of lLines) {
        this.page.drawText(line, { x: MARGIN_L + w1 + pad, y: lineY, size: fontSize, font: c.labelBold !== false ? this.fontBold : this.fontRegular, color: rgb(0,0,0) });
        lineY -= fontSize * LINE_HEIGHT;
      }
      
      if (c.highlight) {
        this.page.drawRectangle({ x: MARGIN_L + w1 + w2, y: y - rowH, width: w3, height: rowH, color: hexToRgb(VAL_BG), opacity: BG_OPACITY });
      }
      this.page.drawRectangle({ x: MARGIN_L + w1 + w2, y: y - rowH, width: w3, height: rowH, borderColor: rgb(0,0,0), borderWidth: BORDER_W });
      lineY = y - pad - fontSize * 0.85;
      for (const line of vLines) {
        this.page.drawText(line, { x: MARGIN_L + w1 + w2 + pad, y: lineY, size: fontSize, font: (c.valueBold || c.bold) ? this.fontBold : this.fontRegular, color: rgb(0,0,0) });
        lineY -= fontSize * LINE_HEIGHT;
      }
      
      this.cursorY += rowH;
    }
  }

  override drawTable(
    headers: string[],
    rows: (string | number)[][],
    colWidths: number[],
    highlightedCols: number[] = [],
    labelCols: number[] = [],
    boldCols: number[] = [],
    highlightedCells: { r: number, c: number }[] = [],
    boldCells: { r: number, c: number }[] = [],
    colAligns: ('left' | 'center' | 'right')[] = [],
    headerAligns: ('left' | 'center' | 'right')[] = [],
    customFontSize?: number
  ): void {
    const newHeaders = headers.length > 0 ? ['', ...headers] : [];
    const newRows = rows.map(r => ['', ...r]);
    const tableW = CONTENT_W - 30;
    const oldTotalW = colWidths.reduce((a, b) => a + b, 0);
    const scaledColWidths = colWidths.map(w => (w / oldTotalW) * tableW);
    const newColWidths = [30, ...scaledColWidths];

    const newHighlightedCols = highlightedCols.map(c => c + 1);
    const newLabelCols = labelCols.map(c => c + 1);
    const newBoldCols = boldCols.map(c => c + 1);
    const newHighlightedCells = highlightedCells.map(c => ({ r: c.r, c: c.c + 1 }));
    const newBoldCells = boldCells.map(c => ({ r: c.r, c: c.c + 1 }));
    const newColAligns = colAligns.length > 0 ? (['left', ...colAligns] as ('left' | 'center' | 'right')[]) : [];
    const newHeaderAligns = headerAligns.length > 0 ? (['left', ...headerAligns] as ('left' | 'center' | 'right')[]) : [];
    
    super.drawTable(
      newHeaders,
      newRows,
      newColWidths,
      newHighlightedCols,
      newLabelCols,
      newBoldCols,
      newHighlightedCells,
      newBoldCells,
      newColAligns,
      newHeaderAligns,
      customFontSize
    );
  }

  async drawContent(): Promise<void> {
    const bankNameField = this.getF('kotakBbgBankName');
    const oldBankName = 'Kotak Mahindra Bank';
    const newBankName = 'Kotak Mahindra Bank Limited (KMBL)';
    const bankNameVal = (!bankNameField || bankNameField === oldBankName) ? newBankName : bankNameField;

    const fmtDate = (d: string): string => {
      if (!d) return '';
      const t = d.trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(t)) {
        const [y,m,dd] = t.split('-');
        return `${dd}/${m}/${y}`;
      }
      return t;
    };

    // Draw Reference and Date on top left/right
    const refLabel = 'Reference No :';
    const refValue = this.getF('projectCode') || '';
    const dateLabel = 'Date of valuation report:';
    const dateValue = fmtDate(this.getF('kotakBbgDateOfValuation'));

    const font = this.fontBold;
    
    // Draw top left (Ref)
    this.page.drawText(refLabel, {
      x: MARGIN_L,
      y: this.pdfY(this.cursorY) - 5,
      size: FONT_SIZE,
      font,
      color: rgb(0, 0, 0),
    });
    this.page.drawText(refValue, {
      x: MARGIN_L,
      y: this.pdfY(this.cursorY) - 5 - 14,
      size: FONT_SIZE,
      font,
      color: rgb(0, 0, 0),
    });

    // Draw top right (Date)
    const tl1 = font.widthOfTextAtSize(dateLabel, FONT_SIZE);
    this.page.drawText(dateLabel, {
      x: MARGIN_L + CONTENT_W - tl1,
      y: this.pdfY(this.cursorY) - 5,
      size: FONT_SIZE,
      font,
      color: rgb(0, 0, 0),
    });
    
    const tl2 = font.widthOfTextAtSize(dateValue, FONT_SIZE);
    this.page.drawText(dateValue, {
      x: MARGIN_L + CONTENT_W - tl2,
      y: this.pdfY(this.cursorY) - 5 - 14,
      size: FONT_SIZE,
      font,
      color: rgb(0, 0, 0),
    });

    // Extra vertical space before VALUATION REPORT
    this.cursorY += 15 + 14 + 15;

    this.drawMainHeader(`VALUATION REPORT FOR ${bankNameVal.toUpperCase()}`);

    this.drawSectionHeader('1. GENERAL DETAILS');
    const bankBranch = this.getF('kotakBbgBankBranch') === 'Custom' ? this.getF('kotakBbgBankBranchCustom') : this.getF('kotakBbgBankBranch');
    
    const oldPurpose = 'To ascertain Market value, Realizable value & Distress value for bank decision-making';
    const newPurpose = 'To ascertain Market value, Realizable value & Distress value of the property for assisting Kotak Mahindra Bank Limited in making prudent banking decision';
    const purposeField = this.getF('kotakBbgPurpose');
    const purposeVal = (!purposeField || purposeField === oldPurpose || purposeField === 'Market Value Assessment') ? newPurpose : purposeField;

    this.drawKeyValueRow([
      { label: 'a. Purpose of Valuation', value: purposeVal, labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);
    const siteEng = this.getF('kotakBbgSiteEngineerNA') ? 'NA' : (this.getF('kotakBbgSiteEngineer') === 'Custom' ? this.getF('kotakBbgSiteEngineerCustom') : this.getF('kotakBbgSiteEngineer'));
    this.drawKeyValueRow([
      { label: 'b. Date of valuation', value: fmtDate(this.getF('kotakBbgDateOfValuation')) },
      { label: 'c. Name of the Valuer', value: this.getF('kotakBbgValuerName') || 'Er. S. Mohanty' },
    ]);
    this.drawKeyValueRow([
      { label: 'd. Name of the qualified/ experienced Site engineer inspecting the property', value: siteEng, labelWidth: 250, valueWidth: CONTENT_W - 250 },
    ]);
    this.drawKeyValueRow([
      { label: 'e. Name of the customer', value: this.getF('kotakBbgBorrowerName'), labelWidth: 250, valueWidth: CONTENT_W - 250 },
    ]);
    
    let personMetStr = this.getF('kotakBbgPersonMet') || '';
    if (personMetStr) {
       const rel = this.getF('kotakBbgPersonMetRelation') === 'Custom' ? this.getF('kotakBbgPersonMetRelationCustom') : this.getF('kotakBbgPersonMetRelation');
       if (rel) personMetStr += ` (${rel})`;
       const phone = this.getF('kotakBbgPersonMetContactNA') ? 'NA' : this.getF('kotakBbgPersonMetContact');
       if (phone && phone !== 'NA') personMetStr += ` - Ph: ${phone}`;
    }
    
    this.drawKeyValueRow([
      { label: 'f. Name of the property owner/owners as per legal docs', value: this.getF('kotakBbgOwnerSameAsBorrower') ? this.getF('kotakBbgBorrowerName') : this.getF('kotakBbgOwnerName'), labelWidth: 250, valueWidth: CONTENT_W - 250 },
    ]);
    this.drawKeyValueRow([
      { label: 'g. Date of Technical Visit', value: fmtDate(this.getF('kotakBbgDateOfSiteVisit')), labelWidth: 250, valueWidth: CONTENT_W - 250 },
    ]);
    this.drawKeyValueRow([
      { label: 'h. Person met at the time of site visit', value: personMetStr, labelWidth: 250, valueWidth: CONTENT_W - 250 },
    ]);
    
    this.drawSectionHeader('2. DETAILS OF THE PROPERTY BEING APPRAISED');
    
    const techAddress = this.getF('kotakBbgTechnicalAddress') || 'NA';
    
    this.drawKeyValueRow([
      { label: 'a. Technical Address of the Property (Please be descriptive mentioning landmark, road, post code etc)', value: techAddress, labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);

    let legalAddress = this.getF('kotakBbgLegalAddress');
    if (legalAddress === undefined || legalAddress === null || legalAddress === '') {
        legalAddress = this.getF('kotakBbgTechnicalAddress') || 'NA';
    }

    this.drawKeyValueRow([
      { label: 'b. Legal Address of the Property', value: legalAddress || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);
    
    const lat = this.getF('latitude');
    const lng = this.getF('longitude');
    const coords = (lat && lng) ? `Latitude : ${lat},Longitude: ${lng}` : 'NA';

    const nature = this.getF('kotakBbgNatureOfProperty') === 'Custom' ? this.getF('kotakBbgNatureOfPropertyCustom') : this.getF('kotakBbgNatureOfProperty');
    
    this.drawKeyValueRow([
      { label: 'c. Google Coordinates', value: coords },
      { label: 'd. Nature of the property', value: nature || 'NA' },
    ]);
    
    const tenureType = this.getF('kotakBbgTenure') === 'Custom' ? this.getF('kotakBbgTenureCustom') : this.getF('kotakBbgTenure');
    const isFreehold = tenureType === 'Freehold';
    
    this.drawKeyValueRow([
      { label: 'e. Tenure of the property (Freehold/leasehold)', value: tenureType || 'NA' },
      { label: 'f. If leasehold please stipulate important lease terms', value: isFreehold ? 'NA' : (this.getF('kotakBbgLeaseTermsNA') ? 'NA' : this.getF('kotakBbgLeaseTerms')) },
    ]);

    this.drawKeyValueRow([
      { label: 'g. Are the leasehold rights transferable?', value: isFreehold ? 'NA' : (this.getF('kotakBbgLeaseTransferableNA') ? 'NA' : (this.getF('kotakBbgLeaseTransferable') === 'Custom' ? this.getF('kotakBbgLeaseTransferableCustom') : this.getF('kotakBbgLeaseTransferable'))), labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);

    const occupancy = this.getF('kotakBbgOccupancyNA') ? 'NA' : (this.getF('kotakBbgOccupancy') === 'Custom' ? this.getF('kotakBbgOccupancyCustom') : this.getF('kotakBbgOccupancy'));
    this.drawKeyValueRow([
      { label: 'h. Occupancy details (Details if rented)', value: occupancy || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);
    
    this.drawSectionHeader('3. SITE & SURROUNDING DETAILS');
    
    const boundaryHalfW = (CONTENT_W - 30) / 2;
    const boundaryLabelW = boundaryHalfW + 30;
    
    this.drawKeyValueRow([
      { label: 'a. Boundaries as per legal /Sale Deed', value: 'Boundaries As Per Site', labelWidth: boundaryLabelW, bold: true, labelBold: true }
    ]);
    const bDoc = this.getF('kotakBbgBoundariesDoc') || {};
    const bSite = this.getF('kotakBbgBoundariesSiteSameAsDoc') ? bDoc : (this.getF('kotakBbgBoundariesSite') || {});
    this.drawKeyValueRow([
      { label: `North : ${bDoc.north || ''}`, value: `North : ${bSite.north || ''}`, labelWidth: boundaryLabelW },
      { label: `South : ${bDoc.south || ''}`, value: `South : ${bSite.south || ''}`, labelWidth: boundaryLabelW },
      { label: `East : ${bDoc.east || ''}`, value: `East : ${bSite.east || ''}`, labelWidth: boundaryLabelW },
      { label: `West : ${bDoc.west || ''}`, value: `West : ${bSite.west || ''}`, labelWidth: boundaryLabelW },
    ]);

    const matchingVal = this.getF('kotakBbgBoundariesMatching');
    const isDiscrepancyNA = matchingVal === 'Yes' || this.getF('kotakBbgBoundariesDiscrepancyNA');

    this.drawKeyValueRow([
      { label: 'b. Boundaries Matching Verification', value: matchingVal || 'NA' },
      { label: 'c. Discrepancy in Boundaries', value: isDiscrepancyNA ? 'NA' : (this.getF('kotakBbgBoundariesDiscrepancy') || 'NA') },
    ]);

    this.drawKeyValueRow([
      { label: 'd. Document Basis for Property Identification', value: this.getF('kotakBbgDocumentsIdentified') || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);

    this.drawKeyValueRow([
      { label: 'e. Confirmation from the valuer', value: this.getF('kotakBbgValuerConfirmationNA') ? 'NA' : (this.getF('kotakBbgValuerConfirmation') || 'NA') },
      { label: 'f. Property Demarcated at Site', value: this.getF('kotakBbgDemarcatedNA') ? 'NA' : (this.getF('kotakBbgDemarcated') || 'NA') },
    ]);

    let localityStr = this.getF('kotakBbgLocalityClassification');

    this.drawKeyValueRow([
      { label: 'g. Type, Condition, Classification of the Locality', value: localityStr || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);

    let surrDev = this.getF('kotakBbgSurroundingDev') === 'Custom' ? this.getF('kotakBbgSurroundingDevCustom') : this.getF('kotakBbgSurroundingDev');
    this.drawKeyValueRow([
      { label: 'h. Development of surrounding areas', value: surrDev || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);

    let accessStr = this.getF('kotakBbgAccessType');
    
    let approachName = this.getF('kotakBbgApproachRoadName');
    let approachCond = this.getF('kotakBbgApproachRoadCondition') === 'Custom' ? this.getF('kotakBbgApproachRoadConditionCustom') : this.getF('kotakBbgApproachRoadCondition');
    let approachStr = [approachName, approachCond].filter(Boolean).join(' - ');

    this.drawKeyValueRow([
      { label: 'i. Access to Property', value: accessStr || 'NA' },
      { label: 'j. Name and condition of Approach Road', value: approachStr || 'NA' },
    ]);

    this.drawKeyValueRow([
      { label: 'k. Proximity to Civic Amenities', value: this.getF('kotakBbgCivicAmenities') || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);

    this.drawSectionHeader('4. DETAILS OF APPROVALS VERIFIED');
    
    // a. Land Non Agricultural/ conversion permission
    let landConv = this.getF('kotakBbgLandConversionNA') ? 'NA' : (this.getF('kotakBbgLandConversion') === 'Custom' ? this.getF('kotakBbgLandConversionCustom') : this.getF('kotakBbgLandConversion'));
    
    // b. Land Zoning/ Restrictions
    let landZoning = this.getF('kotakBbgLandZoningNA') ? 'NA' : (this.getF('kotakBbgLandZoning') === 'Custom' ? this.getF('kotakBbgLandZoningCustom') : this.getF('kotakBbgLandZoning'));

    this.drawKeyValueRow([
      { label: 'a. Land Non Agricultural/ conversion permission', value: landConv || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);
    this.drawKeyValueRow([
      { label: 'b. Land Zoning/ Restrictions (if any)', value: landZoning || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);

    // c. Approved plans Details
    let planStatus = this.getF('kotakBbgApprovedPlanStatus');
    let planNotAvail = planStatus === 'Approved Plan not available';
    let planDetails = planNotAvail ? 'NA' : this.getF('kotakBbgApprovedPlanDetails');
    let planStr = [planStatus, planDetails].filter(Boolean).join(' - ');
    this.drawKeyValueRow([
      { label: 'c. Approved plans Details', value: planStr || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);

    // d. Name of the Authority granting approvals
    let auth = this.getF('kotakBbgAuthorityApprovalsNA') ? 'NA' : (this.getF('kotakBbgAuthorityApprovals') === 'Custom' ? this.getF('kotakBbgAuthorityApprovalsCustom') : this.getF('kotakBbgAuthorityApprovals'));
    
    // e. Are the plans approved from competent authority?
    let plansApproved = (planNotAvail || this.getF('kotakBbgPlansApprovedNA')) ? 'NA' : this.getF('kotakBbgPlansApproved');

    this.drawKeyValueRow([
      { label: 'd. Name of the Authority granting approvals', value: auth || 'NA' },
      { label: 'e. Are the plans approved?', value: plansApproved || 'NA' },
    ]);

    // f. Commencement Certificate
    let commencementStatus = this.getF('kotakBbgCommencementStatus');
    let commencementStr = commencementStatus === 'Provided' ? `No: ${this.getF('kotakBbgCommencementNo') || '-'}, Date: ${fmtDate(this.getF('kotakBbgCommencementDate')) || '-'}` : (commencementStatus || 'NA');

    // g. Occupation Certificate
    let occupationStatus = this.getF('kotakBbgOccupationStatus');
    let occupationStr = occupationStatus === 'Provided' ? `No: ${this.getF('kotakBbgOccupationNo') || '-'}, Date: ${fmtDate(this.getF('kotakBbgOccupationDate')) || '-'}` : (occupationStatus || 'NA');

    this.drawKeyValueRow([
      { label: 'f. Commencement Certificate', value: commencementStr },
      { label: 'g. Occupation/Completion certificate', value: occupationStr },
    ]);

    // h. Sale/lease deed details
    let deedType = this.getF('kotakBbgDeedTypeNA') ? 'NA' : (this.getF('kotakBbgDeedType') === 'Custom' ? this.getF('kotakBbgDeedTypeCustom') : this.getF('kotakBbgDeedType'));
    let deedNo = this.getF('kotakBbgDeedNoNA') ? 'NA' : this.getF('kotakBbgDeedNo');
    let deedDate = this.getF('kotakBbgDeedDateNA') ? 'NA' : fmtDate(this.getF('kotakBbgDeedDate'));
    let deedSale = this.getF('kotakBbgDeedSaleConsiderationNA') ? 'NA' : this.getF('kotakBbgDeedSaleConsideration');
    
    let deedParts = [];
    if (deedType) deedParts.push(deedType);
    if (deedNo) deedParts.push(deedNo === 'NA' ? 'No: NA' : `No: ${deedNo}`);
    if (deedDate) deedParts.push(deedDate === 'NA' ? 'Date: NA' : `Date: ${deedDate}`);
    if (deedSale) deedParts.push(deedSale === 'NA' ? 'Sale Consideration: NA' : `INR ${deedSale}`);
    let deedStr = deedParts.length > 0 ? deedParts.join(', ') : '';

    this.drawKeyValueRow([
      { label: 'h. Sale/lease deed details', value: deedStr || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);

    // i. Details of other documents perused
    let otherDocs = this.getF('kotakBbgOtherDocsNA') ? 'NA' : [
      ...(this.getF('kotakBbgOtherDocsList') || []),
      this.getF('kotakBbgOtherDocsCustomChecked') ? this.getF('kotakBbgOtherDocsCustom') : null
    ].filter(Boolean).join(', ');

    this.drawKeyValueRow([
      { label: 'i. Details of other documents perused', value: otherDocs || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);

    this.drawSectionHeader('5. BUILDING/ FLAT/ OFFICE/ SHOP DETAILS');
    if (this.getF('kotakBbgNatureOfProperty') === 'Vacant Land' && !this.getF('kotakBbgSection5Override')) {
      this.drawKeyValueRow([{ label: 'This section is auto-disabled because Nature of Property is "Vacant Land".', value: '', labelWidth: CONTENT_W, valueWidth: 0 }]);
    } else {
      // a. Type of Construction/ Roofing/ Special architectural features
      let consType = this.getF('kotakBbgConstructionTypeNA') ? 'NA' : (this.getF('kotakBbgConstructionType') === 'Custom' ? this.getF('kotakBbgConstructionTypeCustom') : this.getF('kotakBbgConstructionType'));
      let roofSystem = this.getF('kotakBbgRoofingSystemNA') ? 'NA' : (this.getF('kotakBbgRoofingSystem') === 'Custom' ? this.getF('kotakBbgRoofingSystemCustom') : this.getF('kotakBbgRoofingSystem'));
      let specialFeatures = this.getF('kotakBbgSpecialFeaturesNA') ? 'NA' : this.getF('kotakBbgSpecialFeatures');
      
      let constrParts = [];
      if (consType) constrParts.push(consType);
      if (roofSystem) constrParts.push(roofSystem === 'NA' ? 'Roof: NA' : `Roof: ${roofSystem}`);
      if (specialFeatures) constrParts.push(specialFeatures === 'NA' ? 'Features: NA' : `Features: ${specialFeatures}`);
      let constrStr = constrParts.length > 0 ? constrParts.join(', ') : '';

      this.drawKeyValueRow([
        { label: 'a. Type of Construction / Roofing', value: constrStr || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 },
      ]);

      // b. Year of construction
      let yearConst = this.getF('kotakBbgYearOfConstructionNA') ? 'NA' : this.getF('kotakBbgYearOfConstruction');

      // c. Stage of construction in %
      let stage = this.getF('kotakBbgStageOfConstructionNA') ? 'NA' : `${this.getF('kotakBbgStageOfConstruction') || '100'}%`;

      this.drawKeyValueRow([
        { label: 'b. Year of construction', value: yearConst || 'NA' },
        { label: 'c. Stage of construction', value: stage },
      ]);

      // d. Residual age of the Property
      let residual = this.getF('kotakBbgResidualStructuralAge');

      // e. No of Floors
      let floorsStr = this.getF('kotakBbgNumberOfFloors');

      this.drawKeyValueRow([
        { label: 'd. Residual age of the Property', value: residual || 'NA' },
        { label: 'e. No of Floors', value: floorsStr || 'NA' },
      ]);

      // f. Quality of The Construction
      let quality = this.getF('kotakBbgQualityOfConstructionNA') ? 'NA' : (this.getF('kotakBbgQualityOfConstruction') === 'Custom' ? this.getF('kotakBbgQualityOfConstructionCustom') : this.getF('kotakBbgQualityOfConstruction'));

      // g. Technical details (Finishing, interiors)
      let interiorStr = this.getF('kotakBbgTechnicalDetails');

      this.drawKeyValueRow([
        { label: 'f. Quality of Construction', value: quality || 'NA' },
        { label: 'g. Technical details', value: interiorStr || 'NA' },
      ]);

      // h. Amenities provided in building/ Complex
      let amenitiesList = this.getF('kotakBbgAmenitiesNA') ? 'NA' : [
        ...(Array.isArray(this.getF('kotakBbgAmenities')) ? this.getF('kotakBbgAmenities') : []),
        this.getF('kotakBbgAmenitiesCustomChecked') ? this.getF('kotakBbgAmenitiesCustom') : null
      ].filter(Boolean).join(', ');

      // i. Usage of the property
      let usage = this.getF('kotakBbgUsageOfProperty') === 'Custom' ? this.getF('kotakBbgUsageOfPropertyCustom') : this.getF('kotakBbgUsageOfProperty');

      this.drawKeyValueRow([
        { label: 'h. Amenities provided', value: amenitiesList || 'NA' },
        { label: 'i. Usage of the property', value: usage || 'NA' },
      ]);
    }

    this.drawSectionHeader('6. DETAILS OF MEASUREMENTS');
    
    // a. Area of land
    const landDetailsNA = this.getF('kotakBbgLandAreaDescriptiveDetailsNA');
    const landDetails = landDetailsNA ? 'NA' : this.getF('kotakBbgLandAreaDescriptiveDetails');
    
    let autoAcres = '';
    if (landDetails && !landDetailsNA) {
      const match = landDetails.match(/[\d,]+(\.\d+)?/);
      if (match) {
        const numStr = match[0].replace(/,/g, '');
        const acres = parseFloat(numStr) / 43560;
        autoAcres = isNaN(acres) ? '' : acres.toFixed(3);
      }
    }
    
    let combinedLandValue = landDetails || 'NA';
    if (autoAcres && autoAcres !== 'NA' && combinedLandValue !== 'NA') {
      const acresText = `- AC.${autoAcres}Decs`;
      if (combinedLandValue.trim().endsWith(')')) {
        combinedLandValue = combinedLandValue.trim().slice(0, -1) + acresText + ')';
      } else {
        combinedLandValue += ` ${acresText}`;
      }
    }

    this.drawKeyValueRow([
      { label: 'a. Area of land (if applicable) supported by documentary proof, shape, dimensions and physical features FSI permissible, utilized, balance', value: combinedLandValue, labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);

    // b. Building/ flat/ office/ shop/ unit/ showroom area
    const isVacantLand6 = this.getF('kotakBbgNatureOfProperty') === 'Vacant Land';
    const buildingDetails = this.getF('kotakBbgBuildingAreaDetailsNA') || isVacantLand6 ? 'NA' : this.getF('kotakBbgBuildingAreaDetails');
    this.drawKeyValueRow([
      { label: 'b. Building/ flat/ office/ shop/ unit/ showroom area', value: buildingDetails || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);
    
    // c. Deviations/ violations
    const devs = this.getF('kotakBbgDeviationsNA') ? 'NA' : (this.getF('kotakBbgDeviations') === 'Custom' ? this.getF('kotakBbgDeviationsCustom') : this.getF('kotakBbgDeviations'));
    this.drawKeyValueRow([
      { label: 'c. Deviations / Violations', value: devs || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);

    this.drawSectionHeader('7. VALUATION');
    
    // a. Details of Valuation methodology
    this.drawKeyValueRow([
      { label: 'a. Details of Valuation methodology', value: this.getF('kotakBbgValuationMethodology') || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);

    // b. Comparables relied upon
    this.drawKeyValueRow([
      { label: 'b. Comparables relied upon', value: this.getF('kotakBbgComparablesReliedNA') ? 'NA' : (this.getF('kotakBbgComparablesRelied') || 'NA'), labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);

    // c. Analysis of comparables
    this.drawKeyValueRow([
      { label: 'c. Analysis of comparables', value: this.getF('kotakBbgAnalysisComparablesNA') ? 'NA' : (this.getF('kotakBbgAnalysisComparables') || 'NA'), labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);

    // d. Land Rate Adopted
    this.drawKeyValueRow([
      { label: 'd. Land Rate Adopted (if applicable)', value: this.getF('kotakBbgAdoptedLandRateNA') ? 'NA' : (this.getF('kotakBbgAdoptedLandRate') || 'NA'), labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);

    // e. Building rate
    const isVacantLand7 = this.getF('kotakBbgNatureOfProperty') === 'Vacant Land';
    this.drawKeyValueRow([
      { label: 'e. Building rate adopted', value: (this.getF('kotakBbgAdoptedBuildingRateNA') || isVacantLand7) ? 'NA' : (this.getF('kotakBbgAdoptedBuildingRateDetails') || 'NA'), labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);

    // f. Valuation calculations
    this.drawKeyValueRow([
      { label: 'f. Valuation calculations', value: this.getF('kotakBbgValuationCalcSummary') || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);

    // g. Guideline rate
    this.drawKeyValueRow([
      { label: 'g. Guideline/ Circle/ Ready Reckoner Rate', value: this.getF('kotakBbgGuidelineRateNA') ? 'NA' : (this.getF('kotakBbgGuidelineRate') || 'NA'), labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);

    // h. Guideline valuation
    this.drawKeyValueRow([
      { label: 'h. Guideline/ Circle/ Ready Reckoner Valuation', value: this.getF('kotakBbgGuidelineSummary') || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);

    this.drawSectionHeader('8. SUMMARY');
    
    // a. Fair Market Value
    this.drawKeyValueRow([
      { label: 'a. Fair Market Value (FMV)', value: this.getF('kotakBbgFmvSummary') || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);

    // b & c. Realizable & Distress Values
    const rvPct = this.getF('kotakBbgRvPercent') !== undefined ? this.getF('kotakBbgRvPercent') : '90';
    const dvPct = this.getF('kotakBbgDvPercent') !== undefined ? this.getF('kotakBbgDvPercent') : '80';
    this.drawKeyValueRow([
      { label: `b. Realizable Value (RV) @ ${rvPct}%`, value: this.getF('kotakBbgRvSummary') || 'NA' },
      { label: `c. Distress Value (DV) @ ${dvPct}%`, value: this.getF('kotakBbgDvSummary') || 'NA' },
    ]);

    // d. Insurable Value
    const isVacantLand8 = this.getF('kotakBbgNatureOfProperty') === 'Vacant Land';
    const isIvNA = this.getF('kotakBbgIvNA') !== undefined ? this.getF('kotakBbgIvNA') : isVacantLand8;
    this.drawKeyValueRow([
      { label: 'd. Insurable Value (IV)', value: isIvNA ? 'NA' : (this.getF('kotakBbgIvSummary') || 'NA'), labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);

    this.drawSectionHeader('9. REMARKS / OBSERVATIONS');
    this.drawKeyValueRow([
      { label: 'Executive Summary', value: this.getF('kotakBbgExecSummary') || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);
    
    this.drawKeyValueRow([
      { label: 'Important Notes', value: this.getF('kotakBbgSpecificRiskFactorsNA') ? 'NA' : this.getF('kotakBbgSpecificRiskFactors') || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);

    this.drawSectionHeader('10. DECLARATION');

    // a. Standard Declaration Legal Clauses
    const siteVisitDate = fmtDate(this.getF('kotakBbgDateOfValuation')) || '[Date from Section 1]';
    const clausesText = `I hereby declare that -
(a) the Valuation Report prepared and the information contained herein is true and correct to the best of my knowledge and belief :
(b) I have no direct or indirect interest in the property valued;
(c) I have personally inspected the property on / I have deputed my employed qualified/ experienced site engineer for inspecting the property on ${siteVisitDate}`;
    
    this.drawKeyValueRow([
      { label: 'a. Standard Declaration Legal Clauses', value: clausesText, labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);
    this.drawKeyValueRow([
      { label: 'Declaration Confirmed', value: this.getF('kotakBbgDeclarationConfirmed') ? 'Yes (Legally Bound)' : 'No', labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);

    // b. Date & Place of Issue
    this.drawKeyValueRow([
      { label: 'b. Report Issue Date', value: fmtDate(this.getF('kotakBbgReportIssueDate')) || fmtDate(new Date().toISOString().split('T')[0]) },
      { label: 'Report Issue Place', value: this.getF('kotakBbgReportIssuePlace') === 'Custom' ? this.getF('kotakBbgReportIssuePlaceCustom') : (this.getF('kotakBbgReportIssuePlace') || 'Bhubaneswar') },
    ]);

    // c. Signature / Stamp
    this.drawKeyValueRow([
      { label: 'c. Signature File Attached', value: this.getF('kotakBbgSignatureFile') ? 'Yes' : 'No', labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);
  }
}
