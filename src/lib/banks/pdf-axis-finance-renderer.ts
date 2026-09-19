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
      this.drawAxisCoverPage();
      this.addPage();
    }
    
    // Override the generic "Valuation Report" title
    const isValuationReport = title.trim().toLowerCase() === 'valuation report';
    const finalTitle = isValuationReport
      ? 'VALUATION REPORT FOR AXIS FINANCE LIMITED'
      : title;
      
    super.drawCenteredTitle(finalTitle, fontSize, isValuationReport ? true : underline);
  }

  override drawSectionHeader(title: string, addSpaceBefore?: boolean, preserveCase?: boolean) {
    if (title === 'UNIT MEASUREMENTS & SETBACKS') {
      this.addPage();
    }
    super.drawSectionHeader(title, addSpaceBefore, preserveCase);
    if (title === 'CLIENT & APPLICATION DETAILS') {
      this.drawAxisSection2();
    } else if (title === 'PROPERTY LOCATION & LOCALITY DETAILS') {
      this.drawAxisSection3();
    } else if (title === 'BOUNDARIES, ACCESS & GEOLOCATION') {
      this.drawAxisBoundariesTable();
    } else if (title === 'APPROVAL & STRUCTURAL INFORMATION') {
      this.drawAxisSection5();
    } else if (title === 'UNIT MEASUREMENTS & SETBACKS') {
      this.drawAxisSection6();
    } else if (title === 'VALUATION & CONSTRUCTION COST BREAK-UP') {
      this.drawAxisSection7();
    } else if (title === 'CONSTRUCTION COST (FOR PLOT PLUS CONSTRUCTION)') {
      this.drawAxisSection8();
    } else if (title === 'GOVERNMENT VALUATION & DISTRESS VALUE') {
      this.drawAxisSection9();
    } else if (title === 'REMARKS, CERTIFICATION & ATTACHMENTS') {
      this.drawAxisSection10();
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
    const headers = ['Description', 'Approval authority', 'Approval no', 'Approval Date'];
    const rows = [
      ['Layout Plan', fv('axisLayoutPlanApprovalAuthority'), fv('axisLayoutPlanApprovalNo'), fv('axisLayoutPlanApprovalDate')],
      ['Building/Construction Plan', fv('axisBuildingPlanApprovalAuthority'), fv('axisBuildingPlanApprovalNo'), fv('axisBuildingPlanApprovalDate')]
    ];
    const colWidths = [150, 112, 112, 112];
    this.drawTable(headers, rows, colWidths, [], [0]);
    
    this.advanceCursor(10);
    this.drawCenteredTitle('Building Specifications & Condition', undefined, true);
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
      this.checkPageBreak(isHeader ? rowHeight + 45 : rowHeight);
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
    let pmv = fv('axisPresentMarketValue', '');
    let dsv = fv('axisDistressSaleValue', '');
    
    if (!this.fields.axisEnableCoverPageValueEdit) {
      const v8 = Number(this.fields.axisTotalValueOfPropertyAfterCompletion || 0);
      const v7 = Number(this.fields.axisMarketValueOfTheUnit || 0);
      pmv = v8 > 0 ? v8.toFixed(2) : (v7 > 0 ? v7.toFixed(2) : '0.00');
      
      const v9 = Number(this.fields.axisDistressValueOfTheProperty || 0);
      dsv = v9 > 0 ? v9.toFixed(2) : '0.00';
    }

    drawCenteredBold(`PRESENT MARKET VALUE: ${pmv}`, FONT_SIZE, 14);
    drawCenteredBold(`DISTRESS SALE VALUE: ${dsv}`, FONT_SIZE, 40);

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
    private drawAxisSection6() {
    const fv = (key: string, def = 'NA') => {
      const val = this.fields[key];
      return val ? String(val) : def;
    };

    // Container: Valuation of the Property Flat/Shop/Office/
    this.drawSectionSubtitle('Valuation of the Property Flat/Shop/Office/');
    this.drawKeyValueRow([
      { label: 'Measured Carpet Area (Sq. Ft.)', value: fv('axisMeasuredCarpetArea') },
      { label: 'Approved Carpet Area (Sq. Ft.)', value: fv('axisApprovedCarpetArea') }
    ]);
    this.drawKeyValueRow([
      { label: 'UDS Land (Sq. Ft.)', value: fv('axisUDSLand') },
      { label: 'Agreement Carpet Area (Sq. Ft.)', value: fv('axisAgreementCarpetArea') }
    ]);
    this.drawKeyValueRow([
      { label: 'Loading Adopted for Valuation (%)', value: fv('axisLoadingAdoptedForValuation') },
      { label: 'Saleable Area of Unit (Sq. Ft.)', value: fv('axisSaleableAreaOfUnit') }
    ]);
    this.drawKeyValueRow([
      { label: 'Built Up Area (Sq. Ft.)', value: fv('axisBuiltUpArea') },
      { label: 'Prevailing Rate for Building (Rs.)', value: fv('axisPrevailingRateForBuilding') }
    ]);
    this.drawKeyValueRow([
      { label: 'Floor Rise Rate (Rs.)', value: fv('axisFloorRiseRate') },
      { label: 'Adopted Rate Building', value: fv('axisAdoptedRateBuilding') }
    ]);
    
    // Add Car Parking section if values exist, or just draw Market Value and Car Parking
    let carParking = fv('axisCarParkingDropdown');
    if (this.fields['axisCarParkingDropdown_isCustom']) {
      carParking = fv('axisCarParkingDropdown');
    }
    this.drawKeyValueRow([
      { label: 'Market Value Of the Unit', value: fv('axisMarketValueOfTheUnit') },
      { label: 'Car Parking', value: carParking }
    ]);
    this.drawKeyValueRow([
      { label: 'No. of Car Parking', value: fv('axisNoOfCarParking') },
      { label: 'Parking Area', value: fv('axisParkingArea') }
    ]);
    this.drawSimpleRow('Car Parking Price', fv('axisCarParkingPrice'));
    this.advanceCursor(2);

    // Container: Unit Details - Row House/ Independent House/Plot
    this.drawSectionSubtitle('Unit Details - Row House/ Independent House/Plot');
    this.drawKeyValueRow([
      { label: 'Plot Area', value: fv('axisPlotArea') },
      { label: 'Floor wise Break-up (As per actual BUA)', value: fv('axisFloorWiseBreakUp') }
    ]);
    this.drawKeyValueRow([
      { label: 'As per Approval (Approved BUA)', value: fv('axisAsPerApproval') },
      { label: 'As per max. Permissible FAR norms', value: fv('axisAsPerMaxPermissibleFARNorms') }
    ]);
    this.drawKeyValueRow([
      { label: 'Deviation (Sq. Ft.)', value: fv('axisDeviationSqFt') },
      { label: 'Deviation (%)', value: fv('axisDeviationPercentage') }
    ]);
    this.advanceCursor(2);

    // Table: Side Margin Details
    this.drawSectionSubtitle('Side Margin Details');
    
    // Custom table drawing for Side Margins
    const tableHeaders = ['Margin Reference', 'Front', 'Left Side', 'Right Side', 'Rear', 'Remarks'];
    
    const cw = 487.28; // CONTENT_W
    const colWidths = [
      cw * 0.2, // Reference
      cw * 0.12, // Front
      cw * 0.12, // Left
      cw * 0.12, // Right
      cw * 0.12, // Rear
      cw * 0.32  // Remarks
    ];
    
    const rows = [
      ['As per Approval', fv('axisSideMarginApprovalFront'), fv('axisSideMarginApprovalLeft'), fv('axisSideMarginApprovalRight'), fv('axisSideMarginApprovalRear'), fv('axisSideMarginApprovalRemarks')],
      ['Actual at Site', fv('axisSideMarginActualFront'), fv('axisSideMarginActualLeft'), fv('axisSideMarginActualRight'), fv('axisSideMarginActualRear'), fv('axisSideMarginActualRemarks')],
      ['Deviation %', fv('axisSideMarginDeviationFront'), fv('axisSideMarginDeviationLeft'), fv('axisSideMarginDeviationRight'), fv('axisSideMarginDeviationRear'), fv('axisSideMarginDeviationRemarks')]
    ];
    
    this.drawTable(tableHeaders, rows, colWidths);
    this.advanceCursor(4);

    // Container: Quality of Construction & Upkeep
    this.drawSectionSubtitle('Quality of Construction & Upkeep');
    
    let qc = fv('axisQualityOfConstruction');
    if (this.fields['axisQualityOfConstruction_isCustom']) qc = fv('axisQualityOfConstruction');
    
    let mop = fv('axisMaintenanceOfTheProperty');
    if (this.fields['axisMaintenanceOfTheProperty_isCustom']) mop = fv('axisMaintenanceOfTheProperty');
    
    this.drawKeyValueRow([
      { label: 'Quality of Construction', value: qc },
      { label: 'Maintenance of the Property', value: mop }
    ]);
    this.advanceCursor(4);
  }

  private drawAxisSection7() {
    const fv = (key: string, def = 'NA') => {
      const val = this.fields[key];
      return val ? String(val) : def;
    };

    // Container: Market Value of Independent Property (Land)
    this.drawSectionSubtitle('Market Value of Independent Property (Land)');
    this.drawKeyValueRow([
      { label: 'Area of Land (As per Documents) (Sq. Ft.)', value: fv('axisAreaOfLand') },
      { label: 'Market rate of the Land (Rs./Sq. Ft.)', value: fv('axisMarketRateOfLand') }
    ]);
    this.drawSimpleRow('Value of the Land', fv('axisValueOfTheLand'));
    this.advanceCursor(4);

    // Container: Cost of Construction Break-up (Table)
    this.drawSectionSubtitle('Cost of Construction Break-up');
    const cw = (487.28 - 140) / 6; // CONTENT_W - 140
    const colWidths = [140, cw, cw, cw, cw, cw, cw];
    
    const headers = ['Parameter', 'GF', 'FF', 'SF', 'TF', 'NA / Other', 'Total'];
    const rows = [
      ['Approved BUA (Sq. Ft.)', fv('axisCostBreakupApprovedBUAGF'), fv('axisCostBreakupApprovedBUAFF'), fv('axisCostBreakupApprovedBUASF'), fv('axisCostBreakupApprovedBUATF'), fv('axisCostBreakupApprovedBUANA'), fv('axisCostBreakupApprovedBUATotal')],
      ['Actual BUA Sq ft', fv('axisCostBreakupActualBUAGF'), fv('axisCostBreakupActualBUAFF'), fv('axisCostBreakupActualBUASF'), fv('axisCostBreakupActualBUATF'), fv('axisCostBreakupActualBUANA'), fv('axisCostBreakupActualBUATotal')],
      ['Construction Cost Rs. Per Sq ft', fv('axisCostBreakupConstructionCostGF'), fv('axisCostBreakupConstructionCostFF'), fv('axisCostBreakupConstructionCostSF'), fv('axisCostBreakupConstructionCostTF'), fv('axisCostBreakupConstructionCostNA'), fv('axisCostBreakupConstructionCostTotal')],
      ['Total BUA Value', fv('axisCostBreakupTotalBUAValueGF'), fv('axisCostBreakupTotalBUAValueFF'), fv('axisCostBreakupTotalBUAValueSF'), fv('axisCostBreakupTotalBUAValueTF'), fv('axisCostBreakupTotalBUAValueNA'), fv('axisCostBreakupTotalBUAValueTotal')]
    ];
    
    this.drawTable(headers, rows, colWidths, [], [0]);
    this.advanceCursor(4);

    this.drawSectionSubtitle('Unit Market Value Summary');
    this.drawSimpleRow('Value of the Approved BUA', fv('axisValueOfApprovedBUA'));
    this.drawSimpleRow('Market Value of the Unit : (Land + Construction)', fv('axisMarketValueOfTheUnitLandAndConstruction'));
    this.advanceCursor(4);
  }

private drawAxisSection8() {
    const fv = (key: string, def = 'NA') => {
      const val = this.fields[key];
      return val ? String(val) : def;
    };

    this.drawSectionSubtitle('Construction Cost & Technical Specifications');
    this.drawTable([], [['Note : Cost of Construction to be worked out on Approved area only']], [487.28]);
    
    this.drawKeyValueRow([
      { label: 'Estimated Cost Of Construction', value: fv('axisEstimatedCostOfConstruction') },
      { label: 'Standard Cost Of Construction', value: fv('axisStandardCostOfConstruction') }
    ]);
    this.drawKeyValueRow([
      { label: 'Estimated Rate Per Sq ft', value: fv('axisEstimatedRatePerSqft') },
      { label: 'Standard Rate Per Sq ft', value: fv('axisStandardRatePerSqft') }
    ]);
    
    this.drawSimpleRow('Material & Finishing Details as proposed in Estimate: Describe the Flooring, Doors, Windows, Wall Finish,Lighting, and Plumbing etc.', fv('axisMaterialAndFinishingDetails'));

    this.drawKeyValueRow([
      { label: 'Stage of Construction (%)', value: fv('axisStageOfConstruction') },
      { label: 'Recommended For Disbursement (%)', value: fv('axisRecommendedForDisbursement') }
    ]);

    this.drawKeyValueRow([
      { label: 'Recommended construction rate based on the proposed specifications', value: fv('axisRecommendedConstructionRate') },
      { label: 'Recommended Cost of Construction', value: fv('axisRecommendedCostOfConstruction') }
    ]);

    this.drawSimpleRow('Total Value of property after Completion', fv('axisTotalValueOfPropertyAfterCompletion'));
    this.advanceCursor(4);
  }

  private drawAxisSection9() {
    const fv = (key: string, def = 'NA') => {
      const val = this.fields[key];
      return val ? String(val) : def;
    };

    this.drawSectionSubtitle('Government Valuation of Independent Property');
    this.drawKeyValueRow([
      { label: 'Area of Land', value: fv('axisAreaOfLandGovt') },
      { label: 'Government Rate', value: fv('axisGovernmentRate') }
    ]);
    this.drawSimpleRow('Value of the Land', fv('axisValueOfTheLandGovt'));
    this.drawSimpleRow('Govt Value of the Unit : Rs. (Government Land cost + Construction cost calculated above)', fv('axisGovtValueOfTheUnit'));
    this.drawSimpleRow('Distress Value of the Property : Rs.', fv('axisDistressValueOfTheProperty'));
    this.advanceCursor(4);
  }

  private drawAxisSection10() {
    const fv = (key: string, def = 'NA') => {
      const val = this.fields[key];
      return val ? String(val) : def;
    };

    this.drawSectionSubtitle('Red Flag comments :');
    
    const remarkText = fv('axisRedFlagComments', 'NA');
    const noteText = fv('axisNote', 'NA');
    const combinedText = `Remarks:- ${remarkText}\nNote- ${noteText}`;
    
    this.drawTable([], [[combinedText]], [487.28]);
    
    const techStatus = fv('axisTechnicalStatus');
    const displayStatus = techStatus === 'Custom' ? fv('axisCustomTechnicalStatus') : techStatus;
    this.drawSimpleRow('Technical Status', displayStatus);
    this.advanceCursor(4);

    this.drawSectionSubtitle('Undertaking :');
    
    const undertakingRows: string[][] = [];
    let counter = 1;
    
    const c1Text = this.fields.axisUndertakingClause1Text || 'I have personally visited the property & identified the same based on the documents provided.';
    if (!this.fields.axisUndertakingClause1NA && this.fields.axisUndertakingClause1 !== false) {
      undertakingRows.push([`${counter}. ${c1Text}`]);
      counter++;
    }
    
    const c2Text = this.fields.axisUndertakingClause2Text || 'I/We have no direct or Indirect Interest in the property being valued.';
    if (!this.fields.axisUndertakingClause2NA && this.fields.axisUndertakingClause2 !== false) {
      undertakingRows.push([`${counter}. ${c2Text}`]);
      counter++;
    }
    
    const c3Text = this.fields.axisUndertakingClause3Text || 'The information furnished above is true and correct to my/our knowledge.';
    if (!this.fields.axisUndertakingClause3NA && this.fields.axisUndertakingClause3 !== false) {
      undertakingRows.push([`${counter}. ${c3Text}`]);
      counter++;
    }
    
    if (undertakingRows.length > 0) {
      this.drawTable([], undertakingRows, [487.28]);
    } else {
      this.drawSimpleRow('Undertaking', 'NA');
    }

    this.drawKeyValueRow([
      { label: 'Name of The Person Visited Site', value: fv('axisNameOfPersonVisitedSite') },
      { label: 'Name of The Valuation Agency', value: fv('axisNameOfValuationAgency') }
    ]);
    this.drawKeyValueRow([
      { label: 'Date of Inspection', value: fv('axisDateOfInspection') },
      { label: 'Seal Of the Agency', value: this.fields.axisSealOfTheAgency ? 'Attached' : 'NA' }
    ]);
    this.advanceCursor(4);

    this.drawSectionSubtitle('Attachment');
    const attachments = this.fields.axisAttachments || [];
    
    const attachmentRows: string[][] = [];
    if (attachments.length > 0) {
      attachments.forEach((item: any, idx: number) => {
        if (item.text && item.text !== 'NA') {
          attachmentRows.push([`${idx + 1}.`, item.text]);
        }
      });
    }
    
    if (attachmentRows.length > 0) {
      this.drawTable([], attachmentRows, [30, 457.28]);
    } else {
      this.drawSimpleRow('Attachments', 'NA');
    }
    this.advanceCursor(4);
  }
}


