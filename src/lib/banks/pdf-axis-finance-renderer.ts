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

export class PDFAxisFinanceRenderer extends PDFBankRenderer {
  private fields: any;
  private drawnCover = false;

  constructor(fields?: any) {
    super();
    this.fields = fields || {};
  }

  override drawCenteredTitle(title: string) {
    if (!this.drawnCover) {
      this.drawnCover = true;
      this.drawAxisCoverPage();
      // After drawing cover page, move to the next page for the standard sections
      this.addPage();
    }
    // Proceed to draw the actual title on the second page
    super.drawCenteredTitle(title);
  }

  override drawSectionHeader(title: string, addSpaceBefore?: boolean, preserveCase?: boolean) {
    super.drawSectionHeader(title, addSpaceBefore, preserveCase);
    if (title === 'CLIENT & APPLICATION DETAILS') {
      this.drawAxisSection2();
    } else if (title === 'PROPERTY LOCATION & LOCALITY DETAILS') {
      this.drawAxisSection3();
    } else if (title === 'BOUNDARIES, ACCESS & GEOLOCATION') {
      this.drawAxisBoundariesTable();
    } else if (title === 'APPROVAL & STRUCTURAL INFORMATION') {
      this.drawAxisSection5();
    }
  }

  private drawAxisSection2() {
    const fv = (key: string, def = 'NA') => {
      const val = this.fields[key];
      return val ? String(val) : def;
    };
    const owners = this.fields.propertyOwnerNames || ((this.fields.axisPropertyOwners || [])
      .filter((o: any) => o.name)
      .map((o: any) => `${o.name}, ${o.relationship || 'S/O'}- ${o.relativeName || o.fatherName || ''}`)
      .join('\n')) || 'NA';
    
    this.drawSimpleRow('Product / Loan Category (LOAN AGAINST PROPERTY (LAP))', fv('productLoanCategory'));
    this.drawKeyValueRow([
      { label: 'Application Number', value: fv('loanApplicationNo') },
      { label: 'Date', value: fv('dateOfValuation') }
    ]);
    this.drawSimpleRow('Name of the Customer', fv('ownerName'));
    this.drawSimpleRow('Name of the Property Owner(S)', owners);
    this.drawKeyValueRow([
      { label: 'Collateral Ownership', value: fv('collateralOwnership') },
      { label: 'Collateral Category', value: fv('collateralCategory') }
    ]);
    this.drawSimpleRow('Property Documents Received', fv('propertyDocumentsReceived'));
  }

  private drawAxisSection3() {
    const fv = (key: string, def = 'NA') => {
      const val = this.fields[key];
      if (val === 'Custom') return String(this.fields[`${key}_isCustom`] ? this.fields[key] : (this.fields[`${key}Custom`] || def));
      // For _isCustom fallback if they just use the same key
      if (this.fields[`${key}_isCustom`]) {
        return String(this.fields[key] || def);
      }
      return val ? String(val) : def;
    };
    const c = this.fields;
    
    let addr = c.axisAddressOfTheProperty || '';
    let propDetails = c.propertyDetailsAxis ?? addr;
    let propAddr = c.propertyAddressAxis ?? addr;
    
    this.drawSimpleRow('Property details', propDetails);
    this.drawSimpleRow('Property Address', propAddr);
    this.drawKeyValueRow([
      { label: 'City', value: fv('city') },
      { label: 'District', value: fv('district') }
    ]);
    this.drawKeyValueRow([
      { label: 'State', value: fv('state') },
      { label: 'Pin Code', value: fv('pinCode') }
    ]);
    
    this.drawKeyValueRow([
      { label: 'Nearby Land Mark', value: fv('landmark') },
      { label: 'Distance from City Center', value: fv('distanceFromCityCenter') }
    ]);
    
    const sec3Fields = [
      ['Classification of Locality', 'classificationOfLocalityAxis', 'Approved by Town', 'approvedByTownAxis'],
      ['Locality Classification', 'localityClassificationAxis', 'Building Type', 'buildingTypeAxis'],
      ['Class of Locality', 'classOfLocality', 'Type of Locality', 'typeOfLocalityAxis'],
      ['Condition of Building', 'conditionOfBuildingAxis', 'Occupancy Details', 'occupancyDetailsAxis'],
      ['Monthly Rentals for Freehold Prop', 'monthlyRentalsFreeholdAxis', 'Name of the Lease', 'nameOfTheLeaseAxis'],
      ['Type Of Property', 'propertyType', 'Status Of Property', 'statusOfPropertyAxis'],
      ['Actual Usage Of Property', 'actualUsageOfPropertyAxis', 'Approved Usage of Property', 'approvedUsageOfPropertyAxis'],
      ['Property Demarcation at Site', 'plotDemarcated', 'Quality of Interiors', 'qualityOfInteriorsAxis']
    ];
    
    for (const [l1, k1, l2, k2] of sec3Fields) {
      this.drawKeyValueRow([
        { label: l1, value: fv(k1) },
        { label: l2, value: fv(k2) }
      ]);
    }
    this.drawSimpleRow('Distance: Nearest Metro / Bus Station / Railway Station/Airport', fv('distanceNearestMetroBusRailwayAirportAxis'));
    this.drawSimpleRow('Nearness to recreation facilities', fv('nearnessToRecreationFacilitiesAxis'));
    this.drawSimpleRow('Vastu Compliance or direction of the entrance', fv('vastuComplianceDirectionAxis'));
  }

  private drawAxisSection5() {
    const fv = (key: string, def = 'NA') => {
      const val = this.fields[key];
      if (this.fields[`${key}_isCustom`]) {
        return String(val || def);
      }
      return val ? String(val) : def;
    };
    
    // Approval Details Table
    this.drawKeyValueRow([
      { label: 'Description', value: 'Approval authority', labelBold: true, valueBold: true },
      { label: 'Approval no', value: 'Approval Date', labelBold: true, valueBold: true }
    ]);
    this.drawKeyValueRow([
      { label: 'Layout Plan', value: fv('axisLayoutPlanApprovalAuthority'), labelBold: true },
      { label: fv('axisLayoutPlanApprovalNo'), value: fv('axisLayoutPlanApprovalDate') }
    ]);
    this.drawKeyValueRow([
      { label: 'Building/Construction Plan', value: fv('axisBuildingPlanApprovalAuthority'), labelBold: true },
      { label: fv('axisBuildingPlanApprovalNo'), value: fv('axisBuildingPlanApprovalDate') }
    ]);
    
    this.advanceCursor(10);
    this.drawCenteredTitle('Building Specifications & Condition');
    this.advanceCursor(5);
    
    const sec5Fields = [
      ['Age of Building (Years)', 'axisAgeOfBuilding', 'Estimated Life of Building (Years)', 'axisEstimatedLifeOfBuilding'],
      ['Construction Year', 'axisConstructionYear', 'Construction Type (e.g., RCC, Load Bearing)', 'axisConstructionType'],
      ['Comments on Feasibility', 'axisCommentsOnFeasibility', 'Depreciation%', 'axisDepreciationPercentage'],
      ['No Of Floors (As per Plan)', 'axisNoOfFloorsPlan', 'No Of Floors (As per Site)', 'axisNoOfFloorsSite']
    ];
    
    for (const [l1, k1, l2, k2] of sec5Fields) {
      this.drawKeyValueRow([
        { label: l1, value: fv(k1) },
        { label: l2, value: fv(k2) }
      ]);
    }
  }

  private drawAxisBoundariesTable() {
    const fields = this.fields;
    const fv = (key: string) => String(fields[key] || 'NA').replace(/[\t\n\r]+/g, ' ');

    const rowHeight = FONT_SIZE * 1.5 + 4;
    const tableWidth = CONTENT_W;
    const colW = [
      tableWidth * 0.28,
      tableWidth * 0.18,
      tableWidth * 0.18,
      tableWidth * 0.18,
      tableWidth * 0.18
    ];

    const drawCell = (x: number, y: number, w: number, h: number, text: string, bgHex?: string, isBold = false) => {
      if (bgHex) {
        this.page.drawRectangle({
          x,
          y: this.pdfY(y + h),
          width: w,
          height: h,
          color: hexToRgb(bgHex),
          borderColor: rgb(1,1,1),
          borderWidth: 1
        });
      } else {
         this.page.drawRectangle({
          x,
          y: this.pdfY(y + h),
          width: w,
          height: h,
          borderColor: rgb(1,1,1),
          borderWidth: 1,
          color: hexToRgb('#222222') // dark grey like the image
        });
      }
      
      this.page.drawText(this.sanitizeText(text), {
        x: x + 4,
        y: this.pdfY(y + h - 14),
        size: FONT_SIZE - 1,
        font: isBold ? this.fontBold : this.fontRegular,
        color: rgb(1,1,1)
      });
    };

    const drawRow = (texts: string[], isHeader = false) => {
      this.checkPageBreak(rowHeight);
      let curX = MARGIN_L;
      for (let i = 0; i < 5; i++) {
        drawCell(curX, this.cursorY, colW[i], rowHeight, texts[i], undefined, isHeader);
        curX += colW[i];
      }
      this.cursorY += rowHeight;
    };

    // The image has a dark background with white text
    drawRow(['Four Boundaries of the Property', 'East', 'West', 'North', 'South'], true);
    drawRow(['As Per saledeed', fv('eastAsPerDeed'), fv('westAsPerDeed'), fv('northAsPerDeed'), fv('southAsPerDeed')]);
    drawRow(['As per Sketch map', fv('eastAsPerPlan'), fv('westAsPerPlan'), fv('northAsPerPlan'), fv('southAsPerPlan')]);
    drawRow(['Actual as per Site', fv('eastAsPerSite'), fv('westAsPerSite'), fv('northAsPerSite'), fv('southAsPerSite')]);

    // Row 5: Width of abutting road
    this.checkPageBreak(rowHeight);
    drawCell(MARGIN_L, this.cursorY, colW[0], rowHeight, 'Width of the abutting Road', undefined, true);
    drawCell(MARGIN_L + colW[0], this.cursorY, colW[1] + colW[2], rowHeight, `Road 1 : ${fv('widthOfRoad1')}`);
    drawCell(MARGIN_L + colW[0] + colW[1] + colW[2], this.cursorY, colW[3] + colW[4], rowHeight, `Road 2 :${fv('widthOfRoad2')}`);
    this.cursorY += rowHeight;

    // Row 6: Geo Coordinates
    this.checkPageBreak(rowHeight);
    drawCell(MARGIN_L, this.cursorY, colW[0] + colW[1] + colW[2], rowHeight, `Latitude : ${fv('latitude')}`, undefined, true);
    drawCell(MARGIN_L + colW[0] + colW[1] + colW[2], this.cursorY, colW[3] + colW[4], rowHeight, `Longitude :${fv('longitude')}`, undefined, true);
    this.cursorY += rowHeight;
    this.cursorY += 8;
  }

  private drawAxisCoverPage() {
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
        this.page.drawText(line, { x: startX, y: startY, size, font: this.fontBold, color: rgb(0,0,0) });
        if (underline && i === lines.length - 1) {
          this.page.drawLine({
            start: { x: startX, y: startY - 2 },
            end: { x: startX + tw, y: startY - 2 },
            thickness: 1,
            color: rgb(0,0,0)
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
    const owners = Array.isArray(fields.axisPropertyOwners) && fields.axisPropertyOwners.length > 0
      ? fields.axisPropertyOwners
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
    drawCenteredBold(fv('axisAddressOfTheProperty'), FONT_SIZE, 40);

    drawCenteredBold('VALUE OF THE PROPERTY', FONT_SIZE_HEADER, 16, true);
    drawCenteredBold(`PRESENT MARKET VALUE: ${fv('axisPresentMarketValue')}`, FONT_SIZE, 14);
    drawCenteredBold(`DISTRESS SALE VALUE: ${fv('axisDistressSaleValue')}`, FONT_SIZE, 40);

    drawCenteredBold('PURPOSE OF VALUATION', FONT_SIZE_HEADER, 16, true);
    drawCenteredBold(fv('axisPurposeOfValuation', 'TO ASSESS THE FAIR MARKET VALUE OF THE COLLATERAL SECURITY'), FONT_SIZE, 40);

    drawCenteredBold('PREPARED BY', FONT_SIZE_HEADER, 16, true);

    drawCenteredBold(fv('axisPreparedByCompany', 'M/s. S MOHANTY ASSOCIATES'), FONT_SIZE, 14);
    drawCenteredBold(fv('axisPreparedByDesignation', 'EMPANELLED VALUER & CHARTERED ENGINEER'), FONT_SIZE, 14);

    const plotNo = fv('axisPreparedByPlotNo', 'Plot no-859/2494/3232 & 858/2493/3295');
    if (plotNo) drawCenteredBold(`${plotNo},`, FONT_SIZE, 14);

    const street = fv('axisPreparedByStreet', 'Shiv Nagar Tankapani Road');
    if (street) drawCenteredBold(`${street},`, FONT_SIZE, 14);

    const cityStatePin = [
      fv('axisPreparedByCity', 'Bhubaneswar'),
      fv('axisPreparedByState', 'Odisha'),
      fv('axisPreparedByPinCode', '751018') ? `Pin-${fv('axisPreparedByPinCode', '751018')}` : ''
    ].filter(Boolean).join(', ');
    if (cityStatePin) drawCenteredBold(cityStatePin, FONT_SIZE, 14);

    drawCenteredBold(`PHONE- ${fv('axisPreparedByPhone', '06742381145')}`, FONT_SIZE, 14);

    let rawMobile = fv('axisPreparedByMobile', '9937023855/9437074855');
    let processedMobile = rawMobile.replace(/[^0-9]+/g, '/').replace(/(^\/|\/$)/g, '');
    drawCenteredBold(`MOBILE-${processedMobile}`, FONT_SIZE, 0);
  }
}


