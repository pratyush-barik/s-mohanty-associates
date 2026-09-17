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
  hexToRgb
} from '../pdf-bank-renderer';

export class PDFAxisSBBRenderer extends PDFBankRenderer {
  private fields: any;
  private drawnCover = false;

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
      valueBold: false
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

  override drawCenteredTitle(title: string, fontSize?: number, underline?: boolean) {
    if (!this.drawnCover) {
      this.drawnCover = true;
      this.drawSbbCoverPage();
      this.addPage();
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
    if (title.toUpperCase() === 'CLIENT & APPLICATION DETAILS') {
      super.drawSectionHeader('CASE DETAILS & REPORT METADATA', addSpaceBefore, preserveCase);
      this.drawSbbSection2();
      return;
    }
    // Intercept standard section 3
    if (title.toUpperCase() === 'PROPERTY LOCATION & LOCALITY DETAILS') {
      super.drawSectionHeader('LEGAL VERIFICATION & PROPERTY CLASSIFICATION', addSpaceBefore, preserveCase);
      this.drawSbbSection3();
      return;
    }
    // Intercept standard section 4
    if (title.toUpperCase() === 'BOUNDARIES, ACCESS & GEOLOCATION') {
      super.drawSectionHeader('PROPERTY IDENTIFICATION & POSTAL ADDRESS', addSpaceBefore, preserveCase);
      this.drawSbbSection4();
      return;
    }
    super.drawSectionHeader(title, addSpaceBefore, preserveCase);
  }

  private drawSbbSection4() {
    const fields = this.fields;
    const address = (fields as any).axisSbbAddressOfTheProperty || '';
    
    // Auto-fill computations
    const plotComputed = address.split(/MOUZA|VILLAGE/i)[0].trim().toUpperCase() || 'KHATA NO. XX, PLOT NO. YY';
    const mouzaMatch = address.match(/(?:MOUZA|VILLAGE)[-\s]*(.*?)(?=,|$|DIST)/i);
    const mouzaComputed = mouzaMatch ? mouzaMatch[0].toUpperCase() : '';
    const distMatch = address.match(/DIST(?:RICT)?[-\s]*(.*?)(?=,|-|PIN|$)/i);
    const distComputed = distMatch ? distMatch[1].trim().toUpperCase() : '';
    const pinMatch = address.match(/PIN[-\s]*(\d{6})/i);
    const pinComputed = pinMatch ? pinMatch[1] : '';
    const distanceKm = (fields as any).axisSbbDistanceKm || '03';
    const refCity = distComputed || mouzaComputed || 'CITY';
    const distanceComputed = `${distanceKm}- KMS FROM ${refCity} CITY CENTRE`.toUpperCase();

    const val = (key: string, computed: string) => {
      if ((fields as any)[`${key}IsNA`]) return 'NA';
      if ((fields as any)[`${key}EditOn`]) {
        return String((fields as any)[key] || 'NA').replace(/[\t\n\r]+/g, ' ').trim() || 'NA';
      }
      return computed;
    };
    
    this.drawSectionSubtitle('CADASTRAL & POSTAL ADDRESS DETAILS');
    
    this.drawKeyValueRow([
      { label: 'Lease / Sale Deed Number(s) & Date', value: val('axisSbbDeedNumberDate', String((fields as any).axisSbbDeedNumberDate || 'NA')) },
      { label: 'Plot No / S.No / G.No / Khasra No', value: val('axisSbbPlotKhasraNo', plotComputed) }
    ]);
    
    this.drawKeyValueRow([
      { label: 'Road Width & Material', value: val('axisSbbRoadWidthMaterial', String((fields as any).axisSbbRoadWidthMaterial || 'NA')) },
      { label: 'Colony / Nagar / Sector', value: val('axisSbbColonySector', String((fields as any).axisSbbColonySector || 'NA')) }
    ]);
    
    this.drawKeyValueRow([
      { label: 'Locality / Landmark', value: val('axisSbbLocalityLandmark', String((fields as any).axisSbbLocalityLandmark || 'NA')) },
      { label: 'Village / Town / City (Mouza)', value: val('axisSbbVillageCity', mouzaComputed) }
    ]);
    
    this.drawKeyValueRow([
      { label: 'District', value: val('axisSbbDistrict', (fields as any).axisSbbDistrictDropdown === 'CUSTOM' ? ((fields as any).axisSbbDistrict || 'NA') : distComputed) },
      { label: 'State', value: val('axisSbbState', (fields as any).axisSbbStateDropdown === 'CUSTOM' ? ((fields as any).axisSbbState || 'NA') : ((fields as any).axisSbbStateDropdown || 'ODISHA')) }
    ]);
    
    this.drawKeyValueRow([
      { label: 'PIN Code', value: val('axisSbbPinCode', pinComputed) },
      { label: 'Distance from City Centre', value: val('axisSbbDistanceFromCityCenter', distanceComputed) }
    ]);
  }

  private drawSbbSection3() {
    const fields = this.fields;
    const fv = (key: string, defaultVal = 'NA') => String((fields as any)[key] || defaultVal).replace(/[\t\n\r]+/g, ' ').trim() || defaultVal;
    
    this.drawSectionSubtitle('LOCATION CLASSIFICATION & LOCAL AUTHORITY');
    this.drawSimpleRow('Location of Property', fv('axisSbbPropertyLocation'));
    this.drawSimpleRow('Governing Body Authority', fv('axisSbbGoverningBody'));
    if (fields.axisSbbGoverningBody === 'Town or Gram Panchayat or Rural') {
      this.drawSimpleRow('Town / Gram Panchayat Planning Sub-Type', fv('axisSbbTownPlanningSubType'));
    }

    this.drawSectionSubtitle('DOCUMENTS PROVIDED CHECKLIST');
    
    const docs = [
      { id: 'axisSbbDocPrevValuation', label: 'Copy of Previous Valuation Report' },
      { id: 'axisSbbDocApprovedLayout', label: 'Approved Layout' },
      { id: 'axisSbbDocCommencement', label: 'Commencement Certificate' },
      { id: 'axisSbbDocApprovedBuildingPlan', label: 'Approved Building Plan' },
      { id: 'axisSbbDocSaleDeed', label: 'Copy of Sale Deed / Patta Certificate' },
      { id: 'axisSbbDocOccupancy', label: 'Occupancy Certificate' },
      { id: 'axisSbbDocPartitionDeed', label: 'Copy Partition Deed' },
      { id: 'axisSbbDocSketchMap', label: 'Sketch Map / ROR' }
    ];
    
    // Create 2-column checklist
    for (let i = 0; i < docs.length; i += 2) {
      const left = docs[i];
      const right = i + 1 < docs.length ? docs[i + 1] : null;
      
      const leftVal = fields[left.id] ? 'Yes' : 'No';
      if (right) {
        const rightVal = fields[right.id] ? 'Yes' : 'No';
        this.drawKeyValueRow([
          { label: left.label, value: leftVal },
          { label: right.label, value: rightVal }
        ]);
      } else {
        this.drawKeyValueRow([
          { label: left.label, value: leftVal },
          { label: '', value: '' }
        ]);
      }
    }
  }

  private drawSbbSection2() {
    const fields = this.fields;
    const fv = (key: string, defaultVal = 'NA') => String((fields as any)[key] || defaultVal).replace(/[\t\n\r]+/g, ' ').trim() || defaultVal;

    this.drawKeyValueRow([
      { label: 'Report Reference Number', value: fv('axisSbbReportRefNo') },
      { label: 'Report Initiated By Area', value: fv('axisSbbReportInitiatedBy') }
    ]);
    this.drawKeyValueRow([
      { label: 'Name of Area', value: fv('axisSbbAreaName') },
      { label: 'Name of Owner', value: fv('axisSbbOwnerName') }
    ]);
    this.drawKeyValueRow([
      { label: 'Name of Customer', value: fv('axisSbbCustomerName') },
      { label: 'Date of Property Visit', value: fv('axisSbbDateOfVisit') }
    ]);
    this.drawSimpleRow('Date of Report', fv('axisSbbDateOfReport'));
    this.drawSimpleRow('Sale Deed Discretions For Which Valuation Done', fv('axisSbbSaleDeedDiscretions'));
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
    for (const owner of owners) {
      if (owner.name) {
        drawCenteredBold(owner.name, FONT_SIZE, 14);
        const rel = owner.relationship || 'S/O';
        const relName = owner.relativeName || owner.fatherName;
        if (relName) {
          drawCenteredBold(`${rel}- ${relName}`, FONT_SIZE, 14);
        }
      }
    }
    this.cursorY += 16;

    drawCenteredBold('ADDRESS OF THE PROPERTY', FONT_SIZE_HEADER, 16, true);
    drawCenteredBold(fv('axisSbbAddressOfTheProperty'), FONT_SIZE, 40);

    drawCenteredBold('VALUE OF THE PROPERTY', FONT_SIZE_HEADER, 16, true);
    let pmv = fv('axisSbbPresentMarketValue', '');
    let dsv = fv('axisSbbDistressSaleValue', '');

    if (!this.fields.axisSbbEnableCoverPageValueEdit) {
      const v8 = Number(this.fields.axisSbbTotalValueOfPropertyAfterCompletion || 0);
      const v7 = Number(this.fields.axisSbbMarketValueOfTheUnit || 0);
      pmv = v8 > 0 ? v8.toFixed(2) : (v7 > 0 ? v7.toFixed(2) : '0.00');

      const v9 = Number(this.fields.axisSbbDistressValueOfTheProperty || 0);
      dsv = v9 > 0 ? v9.toFixed(2) : '0.00';
    }

    drawCenteredBold(`PRESENT MARKET VALUE: ${pmv}`, FONT_SIZE, 14);
    drawCenteredBold(`DISTRESS SALE VALUE: ${dsv}`, FONT_SIZE, 40);

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
}
