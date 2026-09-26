import { rgb } from 'pdf-lib';
import { PDFBankRenderer, CONTENT_W, PAGE_W, PAGE_H, MARGIN_L, FONT_SIZE, FONT_SIZE_HEADER, FONT_SIZE_TITLE, hexToRgb } from '../pdf-bank-renderer';

export class PDFCanFinHomesRenderer extends PDFBankRenderer {
  private fields: any;
  private projectCode: string;
  private isCanFinDrawing = false;
  private drawnCover = false;

  constructor(fields?: any, projectCode?: string) {
    super();
    this.fields = fields || {};
    this.projectCode = projectCode || '';
  }

  private fv(key: string, defaultVal = 'NA'): string {
    const val = this.fields[key];
    if (val === undefined || val === null || val === '') return defaultVal;
    return String(val).replace(/[\t\n\r]+/g, ' ').trim();
  }

  private fvChoice(baseKey: string, customKey: string): string {
    const val = this.fv(baseKey, '');
    if (val === 'Custom') return this.fv(customKey);
    return val || 'NA';
  }

  private fvCheckbox(valKey: string, naKey: string): string {
    if (this.fields[naKey]) return 'NA';
    return this.fv(valKey);
  }

  override drawKeyValueRow(items: any[]): void { if (this.isCanFinDrawing) super.drawKeyValueRow(items); }
  override drawSimpleRow(label: string, value: string, highlight?: boolean, bold?: boolean): void {
    if (!this.isCanFinDrawing) return;
    const labelW = Math.round(CONTENT_W * 0.45);
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

  override drawCenteredTitle(title: string, fontSize?: number, underline?: boolean) {
    if (!this.drawnCover) {
      this.drawnCover = true;
      this.isCanFinDrawing = true;
      
      this.drawCanFinCover();
      this.drawSection2();
      this.drawSection3();
      this.drawSection4();
      this.drawSection5();
      this.drawSection6();
      this.drawSection7();
      this.drawSection8();
      this.drawSection9();
      
      this.isCanFinDrawing = false;
    }
  }

  private drawCanFinCover() {
    const fields = this.fields;
    
    // Reset cursor for the cover page
    this.cursorY = 60;

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
      const cleanText = text.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
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

    drawCenteredBold('PROPERTY OWNER', FONT_SIZE_HEADER, 16, true);
    const owners = Array.isArray(fields.canfinHomesPropertyOwners) && fields.canfinHomesPropertyOwners.length > 0
      ? fields.canfinHomesPropertyOwners
      : [{ name: '', relationship: 'S/O', relativeName: '' }];
    const validOwners = owners.filter((o: any) => o.name);

    if (validOwners.length > 0) {
      const ownerStrings = validOwners.map((owner: any) => {
        const rel = owner.relationship || 'S/O';
        const relName = owner.relativeName;
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
    } else {
      drawCenteredBold(this.fv('ownerName', 'NA'), FONT_SIZE, 14);
    }
    this.cursorY += 16;

    drawCenteredBold('ADDRESS OF THE PROPERTY', FONT_SIZE_HEADER, 16, true);
    drawCenteredBold(this.fv('propertyAddress', 'NA'), FONT_SIZE, 40);

    drawCenteredBold('VALUE OF THE PROPERTY', FONT_SIZE_HEADER, 16, true);
    
    const marketValue = fields.canfinHomesEnableCoverPageValueEdit ? this.fv('canfinHomesPresentMarketValue', '') : this.fv('canfinHomesTotalFairMarketValueManual', '');
    const distressValue = fields.canfinHomesEnableCoverPageValueEdit ? this.fv('canfinHomesDistressSaleValue', '') : this.fv('canfinHomesDistressValueManual', '');
    const realizableValue = fields.canfinHomesEnableCoverPageValueEdit ? this.fv('canfinHomesRealizableValue', '') : this.fv('canfinHomesRealizableValueManual', '');
    
    drawCenteredBold(`PRESENT MARKET VALUE: ${marketValue || '0.00'}`, FONT_SIZE, 14);
    drawCenteredBold(`DISTRESS SALE VALUE: ${distressValue || '0.00'}`, FONT_SIZE, 14);
    drawCenteredBold(`REALIZABLE VALUE: ${realizableValue || '0.00'}`, FONT_SIZE, 40);

    drawCenteredBold('PURPOSE OF VALUATION', FONT_SIZE_HEADER, 16, true);
    drawCenteredBold(this.fv('canfinHomesPurposeOfValuation', 'TO ASSESS THE FAIR MARKET VALUE OF THE COLLATERAL SECURITY'), FONT_SIZE, 40);

    drawCenteredBold('PREPARED BY', FONT_SIZE_HEADER, 16, true);
    drawCenteredBold(this.fv('canfinHomesPreparedByCompany', 'M/s. S MOHANTY ASSOCIATES'), FONT_SIZE, 14);
    drawCenteredBold(this.fv('canfinHomesPreparedByDesignation', 'EMPANELLED VALUER & CHARTERED ENGINEER'), FONT_SIZE, 14);

    const plotNo = this.fv('canfinHomesPreparedByPlotNo', 'Plot no-859/2494/3232 & 858/2493/3295');
    if (plotNo !== 'NA') drawCenteredBold(`${plotNo},`, FONT_SIZE, 14);

    const street = this.fv('canfinHomesPreparedByStreet', 'Shiv Nagar Tankapani Road');
    if (street !== 'NA') drawCenteredBold(`${street},`, FONT_SIZE, 14);

    const cityStatePin = [
      this.fv('canfinHomesPreparedByCity', 'Bhubaneswar') !== 'NA' ? this.fv('canfinHomesPreparedByCity', 'Bhubaneswar') : '',
      this.fv('canfinHomesPreparedByState', 'Odisha') !== 'NA' ? this.fv('canfinHomesPreparedByState', 'Odisha') : '',
      this.fv('canfinHomesPreparedByPinCode', '751018') !== 'NA' ? `Pin-${this.fv('canfinHomesPreparedByPinCode', '751018')}` : ''
    ].filter(Boolean).join(', ');
    if (cityStatePin) drawCenteredBold(cityStatePin, FONT_SIZE, 14);

    const phone = this.fv('canfinHomesPreparedByPhone', '06742381145');
    if (phone !== 'NA') drawCenteredBold(`PHONE: ${phone}`, FONT_SIZE, 14);

    let rawMobile = this.fv('canfinHomesPreparedByMobile', '9937023855/9437074855');
    if (rawMobile !== 'NA') {
      let processedMobile = rawMobile.replace(/[^0-9]+/g, '/').replace(/(^\/|\/$)/g, '');
      drawCenteredBold(`MOBILE: ${processedMobile}`, FONT_SIZE, 0);
    }

    this.newPage();
  }

  private drawSection2() {
    this.drawSectionHeader('2. GENERAL');
    this.drawSimpleRow('Purpose Of Loan', this.fvChoice('canfinHomesPurposeOfLoanDropdown', 'canfinHomesPurposeOfLoanCustom'));
    this.drawSimpleRow('Name of the Customer', this.fv('canfinHomesNameOfCustomer'));
    this.drawSimpleRow('Name of Document holder as per legal docs', this.fv('canfinHomesNameOfDocumentHolderManual'));
    this.drawSimpleRow('Date of Technical Visit', this.fv('canfinHomesDateOfTechnicalVisit'));
    this.drawSimpleRow('Name of The Building/Society', this.fvCheckbox('canfinHomesNameOfTheBuildingSociety', 'canfinHomesNameOfTheBuildingSocietyNA'));
    this.drawSimpleRow('Name of the Builder/Seller', this.fvCheckbox('canfinHomesNameOfTheBuilderSeller', 'canfinHomesNameOfTheBuilderSellerNA'));
    this.drawSimpleRow('Person(s) Met [Name & Designation]', this.fv('canfinHomesPersonsMet'));
    this.advanceCursor(8);
  }

  private drawSection3() {
    this.drawSectionHeader('3. DETAILS OF THE PROPERTY');
    this.drawSimpleRow('Flat/House/Plot No.', this.fv('canfinHomesFlatHousePlotNoManual'));
    this.drawSimpleRow('Type of Property', this.fvChoice('canfinHomesTypeOfPropertyDropdown', 'canfinHomesTypeOfPropertyCustom'));
    this.drawSimpleRow('No. of Stories', this.fv('canfinHomesNoOfStories'));
    this.drawSimpleRow('For Multi storey building: Total no of units', this.fvCheckbox('canfinHomesMultiStoreyTotalUnits', 'canfinHomesMultiStoreyTotalUnitsNA'));
    this.drawSimpleRow('No of Units on each floor', this.fvCheckbox('canfinHomesNoOfUnitsOnEachFloor', 'canfinHomesNoOfUnitsOnEachFloorNA'));
    this.drawSimpleRow('Details of unit', this.fvCheckbox('canfinHomesDetailsOfUnit', 'canfinHomesDetailsOfUnitNA'));
    this.drawSimpleRow('Age Of The property', this.fv('canfinHomesAgeOfTheProperty'));
    this.drawSimpleRow('Residual age of the Property', this.fv('canfinHomesResidualAgeManual'));
    this.drawSimpleRow('Occupancy details', this.fv('canfinHomesOccupancyDetails'));
    if (this.fv('canfinHomesOccupancyDetails') !== 'Self occupied') {
        this.drawSimpleRow('Occupancy Remarks', this.fvCheckbox('canfinHomesOccupancyRemarks', 'canfinHomesOccupancyRemarksNA'));
    }
    this.drawSimpleRow('Technical Address', this.fv('canfinHomesTechnicalAddressManual'));
    this.drawSimpleRow('Legal Address', this.fv('canfinHomesLegalAddressManual'));
    this.drawSimpleRow('Pin Code', this.fv('canfinHomesPinCodeManual'));
    this.drawSimpleRow('Date of Valuation', this.fv('canfinHomesDateOfValuation'));
    this.advanceCursor(8);
  }

  private drawSection4() {
    this.drawSectionHeader('4. SURROUNDINGS, ACCESIBILITY & PROXIMITY TO CIVIL AMENETIES');
    this.drawSimpleRow('Nearest Railway Station', this.fv('canfinHomesNearestRailwayStation'));
    this.drawSimpleRow('Nearest Bus Stand', this.fv('canfinHomesNearestBusStand'));
    this.drawSimpleRow('Nearest Hospital', this.fv('canfinHomesNearestHospital'));
    this.drawSimpleRow('Conditions of Approach Road', this.fvChoice('canfinHomesConditionsOfApproachRoadDropdown', 'canfinHomesConditionsOfApproachRoadCustom'));
    this.drawSimpleRow('Access to property', this.fvChoice('canfinHomesAccessToPropertyDropdown', 'canfinHomesAccessToPropertyCustom'));
    this.drawSimpleRow('Nearby Land Mark', this.fvCheckbox('canfinHomesNearbyLandMark', 'canfinHomesNearbyLandMarkNA'));
    this.drawSimpleRow('Condition of The Locality', this.fvChoice('canfinHomesConditionOfTheLocalityDropdown', 'canfinHomesConditionOfTheLocalityCustom'));
    this.drawSimpleRow('Development of surrounding areas', this.fvChoice('canfinHomesDevelopmentOfSurroundingAreasDropdown', 'canfinHomesDevelopmentOfSurroundingAreasCustom'));
    this.drawSimpleRow('Any board indicating mortgage', this.fv('canfinHomesAnyBoardIndicatingMortgage'));
    if (this.fv('canfinHomesAnyBoardIndicatingMortgage') === 'Yes') {
        this.drawSimpleRow('Name of Bank/Finance Co.', this.fv('canfinHomesNameOfBankFinanceCo'));
    }
    this.drawSimpleRow('Plot/Property Demarcated at Site Mandatory', this.fv('canfinHomesPlotPropertyDemarcated'));
    this.drawSimpleRow('Property Identified through', this.fv('canfinHomesPropertyIdentifiedThrough'));
    
    this.drawSimpleRow('Surroundings as per site visit', `N: ${this.fv('canfinHomesSurroundingsAsPerSiteNorth')} | S: ${this.fv('canfinHomesSurroundingsAsPerSiteSouth')} | E: ${this.fv('canfinHomesSurroundingsAsPerSiteEast')} | W: ${this.fv('canfinHomesSurroundingsAsPerSiteWest')}`);
    this.drawSimpleRow('Surroundings as per Sale deed', `N: ${this.fv('canfinHomesSurroundingsAsPerDeedNorth')} | S: ${this.fv('canfinHomesSurroundingsAsPerDeedSouth')} | E: ${this.fv('canfinHomesSurroundingsAsPerDeedEast')} | W: ${this.fv('canfinHomesSurroundingsAsPerDeedWest')}`);
    
    this.drawSimpleRow('Whether Boundaries matching', this.fv('canfinHomesWhetherBoundariesMatching'));
    if (this.fv('canfinHomesWhetherBoundariesMatching') === 'No') {
        this.drawSimpleRow('Discrepancy found in Boundaries', this.fvCheckbox('canfinHomesDiscrepancyFoundInBoundaries', 'canfinHomesDiscrepancyFoundInBoundariesNA'));
    }
    this.advanceCursor(8);
  }

  private drawSection5() {
    this.drawSectionHeader('5. SURVEY OF CONSTRUCTION');
    this.drawSimpleRow('Nature of Soil', this.fvCheckbox('canfinHomesNatureOfSoil', 'canfinHomesNatureOfSoilNA'));
    this.drawSimpleRow('Type of Construction', this.fvChoice('canfinHomesTypeOfConstructionDropdown', 'canfinHomesTypeOfConstructionCustom'));
    this.drawSimpleRow('Quality of The Construction', this.fvChoice('canfinHomesQualityOfConstructionDropdown', 'canfinHomesQualityOfConstructionCustom'));
    this.drawSimpleRow('Exteriors', this.fvChoice('canfinHomesExteriorsDropdown', 'canfinHomesExteriorsCustom'));
    this.drawSimpleRow('Interiors', this.fvChoice('canfinHomesInteriorsDropdown', 'canfinHomesInteriorsCustom'));
    this.drawSimpleRow('Type of finishing (Paint)', this.fvCheckbox('canfinHomesTypeOfFinishing', 'canfinHomesTypeOfFinishingNA'));
    this.drawSimpleRow('Type of specification used', this.fvCheckbox('canfinHomesTypeOfSpecificationUsed', 'canfinHomesTypeOfSpecificationUsedNA'));
    this.drawSimpleRow('Amenities provided in building/society', this.fvCheckbox('canfinHomesAmenitiesProvided', 'canfinHomesAmenitiesProvidedNA'));
    this.drawSimpleRow('Construction progress up to', this.fvCheckbox('canfinHomesConstructionProgressUpTo', 'canfinHomesConstructionProgressUpToNA'));
    this.drawSimpleRow('Stage of construction in %', this.fv('canfinHomesStageOfConstruction'));
    this.drawSimpleRow('Projected Residual Life (Years)', this.fv('canfinHomesProjectedResidualLifeManual'));
    this.advanceCursor(8);
  }

  private drawSection6() {
    this.drawSectionHeader('6. DOCUMENTS VERIFIED');
    this.drawSimpleRow('Approved plans Details', this.fvCheckbox('canfinHomesApprovedPlansDetails', 'canfinHomesApprovedPlansDetailsNA'));
    this.drawSimpleRow('Commencement Certificate Details', this.fvCheckbox('canfinHomesCommencementCertificateDetails', 'canfinHomesCommencementCertificateDetailsNA'));
    this.drawSimpleRow('Occupation/Completion Details', this.fvCheckbox('canfinHomesOccupationCertificateDetails', 'canfinHomesOccupationCertificateDetailsNA'));
    this.drawSimpleRow('Ownership Documents', this.fvCheckbox('canfinHomesOwnershipDocumentsDetails', 'canfinHomesOwnershipDocumentsDetailsNA'));
    this.advanceCursor(8);
  }

  private drawSection7() {
    this.drawSectionHeader('7. VALUATION REPORT');
    this.drawSimpleRow('Date Of Visit', this.fv('canfinHomesDateOfVisitManual'));
    this.drawSimpleRow('Type of Locality', this.fvChoice('canfinHomesTypeOfLocalityDropdown', 'canfinHomesTypeOfLocalityCustom'));
    this.drawSimpleRow('Land Area (if applicable)(sqyd/sqmt)', this.fvCheckbox('canfinHomesLandArea', 'canfinHomesLandAreaNA'));
    this.drawSimpleRow('Carpet Area as per physical measurement', this.fvCheckbox('canfinHomesCarpetArea', 'canfinHomesCarpetAreaNA'));
    this.drawSimpleRow('Area as per', this.fvCheckbox('canfinHomesAreaAsPer', 'canfinHomesAreaAsPerNA'));
    this.drawSimpleRow('BUA (sq. ft.)', this.fvCheckbox('canfinHomesBUA', 'canfinHomesBUANA'));
    this.drawSimpleRow('Super BUA (sq. ft.)', this.fvCheckbox('canfinHomesSuperBUA', 'canfinHomesSuperBUANA'));
    this.drawSimpleRow('Encroachment on public land', this.fv('canfinHomesEncroachmentOnPublicLand'));
    this.advanceCursor(8);
  }

  private drawSection8() {
    this.drawSectionHeader('8. THE CONDITION OF STRUCTURE');
    this.drawSimpleRow('Major Structural Irregularities/Cracks', this.fv('canfinHomesStructuralIrregularities'));
    if (this.fv('canfinHomesStructuralIrregularities') === 'Yes') {
        this.drawSimpleRow('Structural Irregularities Details', this.fv('canfinHomesStructuralIrregularitiesDetails'));
    }
    
    this.drawSimpleRow('Improvement/Interior Decoration Done', this.fv('canfinHomesImprovementDone'));
    if (this.fv('canfinHomesImprovementDone') === 'Yes') {
        const opts = this.fields.canfinHomesImprovementOptions || {};
        let sel = [];
        if (opts.pop) sel.push('POP');
        if (opts.wallDecoration) sel.push('Wall Decoration');
        if (opts.wallTexture) sel.push('Wall Texture');
        if (opts.fixedFurniture) sel.push('Fixed Furniture');
        if (opts.custom) sel.push(this.fv('canfinHomesImprovementCustomDetails'));
        this.drawSimpleRow('Improvements', sel.length > 0 ? sel.join(', ') : 'NA');
    }
    
    this.drawSimpleRow('Nature of water Supply', this.fvCheckbox('canfinHomesNatureOfWaterSupply', 'canfinHomesNatureOfWaterSupplyNA'));
    this.drawSimpleRow('Govt. Assessed Value', this.fv('canfinHomesGovtAssessedValue'));
    this.drawSimpleRow('Current market land rate', this.fv('canfinHomesCurrentMarketLandRate'));
    this.drawSimpleRow('Construction Market Rate', this.fv('canfinHomesConstructionMarketRate'));
    this.drawSimpleRow('Depreciation % age', this.fv('canfinHomesDepreciationPercentage'));
    this.drawSimpleRow('Recommended/Fair Market Rate (i+ii)', this.fv('canfinHomesFairMarketRateManual'), true, true);
    this.drawSimpleRow('Total Fair Market Value (100%)', this.fv('canfinHomesTotalFairMarketValueManual'), true, true);
    this.drawSimpleRow('Distress Value (80%)', this.fv('canfinHomesDistressValueManual'), true, true);
    this.drawSimpleRow('Realizable Value (90%)', this.fv('canfinHomesRealizableValueManual'), true, true);
    this.advanceCursor(8);
  }

  private drawSection9() {
    this.drawSectionHeader('9. CONCLUDING DECLARATIONS');
    this.drawSimpleRow('Remarks / Note', this.fv('canfinHomesRemarks'));
    this.drawSimpleRow('Date', this.fv('canfinHomesDeclarationDateManual'));
    const decls = this.fields.canfinHomesDeclarations || {};
    const allAccepted = decls.pt1 && decls.pt2 && decls.pt3 && decls.pt4 && decls.pt5;
    this.drawSimpleRow('Declarations Accepted', allAccepted ? 'Yes (All 5 points accepted)' : 'No', undefined, true);
    this.advanceCursor(8);
  }
}
