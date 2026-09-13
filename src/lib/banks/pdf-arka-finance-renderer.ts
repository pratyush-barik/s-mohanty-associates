import {
  PDFBankRenderer,
  MARGIN_L,
  CONTENT_W,
  FONT_SIZE,
  FONT_SIZE_HEADER,
  FONT_SIZE_TITLE,
  BORDER_W,
  PAGE_W,
  PAGE_H,
  hexToRgb,
} from '../pdf-bank-renderer';
import { BaseReportFields } from '../bank-fields';
import { rgb } from 'pdf-lib';

export interface ArkaReportFields extends BaseReportFields {
  propertyOwners?: { name: string; fatherName: string }[];
  addressOfTheProperty: string;
  presentMarketValue: string;
  distressSaleValue: string;
  purposeOfValuation: string;
  preparedByCompany: string;
  preparedByDesignation: string;
  preparedByPlotNo: string;
  preparedByStreet: string;
  preparedByCity: string;
  preparedByState: string;
  preparedByPinCode: string;
  preparedByPhone: string;
  preparedByMobile: string;

  refNo: string;
  dateOfReport: string;
  nameOfCustomer: string;
  customerContactDetails: string;
  appIdLoanAccountNo: string;
  documentsProvided: string;
  propertyDetailsAddress: string;
  plotNo: string;
  khasraNoKhataNo: string;
  locality: string;
  road: string;
  city: string;
  district: string;
  pinCode: string;
  nearbyLandMark: string;
  distanceFromCityCenter: string;
  availabilityOfLocalTransport: string;
  levelOfLand: string;
  classOfLocality: string;
  qualityOfInfrastructure: string;

  eastSaleDeed: string;
  eastActual: string;
  westSaleDeed: string;
  westActual: string;
  northSaleDeed: string;
  northActual: string;
  southSaleDeed: string;
  southActual: string;
  boundariesMatching: string;

  statusOfLand: string;
  typeOfProperty: string;
  approvedUsage: string;
  actualUsage: string;
  typeOfStructure: string;
  noOfFloors: string;
  occupancyDetails: string;
  electricityWaterDrainage: string;
  proximityToCivicAmenities: string;
  developmentOfSurroundingArea: string;
  longitude: string;
  latitude: string;

  buildingPlanApprovalNo: string;
  dateOfApproval: string;
  expiryDate: string;
  expectedCompletion: string;

  areaOfPlot: string;
  demarcationAtSite: string;
  approvedBuaGf: string;
  approvedBuaFf: string;
  approvedBuaMf: string;
  approvedBuaSf: string;
  measuredBuaGf: string;
  measuredBuaFf: string;
  measuredBuaSf: string;
  measuredBuaTf: string;

  constructionAsPerApprovedPlan: string;
  qualityOfConstruction: string;
  maintenanceOfProperty: string;
  currentLifeOfStructure: string;
  projectedLifeOfStructure: string;


  recommendedRateOfPlot: string;
  valueOfPlot: string;
  estimatedCostOfConstruction: string;
  totalCostOfConstructionMeasuredGfRcc: string;
  depreciationValue: string;
  stageOfConstruction: string;
  percentWorkCompleted: string;
  percentDisbursementRecommended: string;
  currentValueOfTheProperty: string;
  dateOfPropertyVisit: string;
  valuationAsPerGovernmentReckoner: string;
  distressedValuation: string;
  rentalValuePerMonth: string;
  remarks: string;

  propertyImages: any[];
  locationMapImage: any;
  mouzaMapImage: any;
  sketchMapImage: any;
}

export class PDFArkaFinanceRenderer extends PDFBankRenderer {
  public async render(fields: ArkaReportFields): Promise<Uint8Array> {
    const fv = (key: keyof ArkaReportFields, defaultVal = '') => (fields[key] as string) || defaultVal;
    
    this.cursorY += 60;
    
    // Page 1 Border
    const bmx = 30; // Horizontal margin
    const bmyTop = 105; // Clear letterhead (shrunk upper part)
    const bmyBot = 85; // Clear footer (shrunk lower part)
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
      const tw = this.fontBold.widthOfTextAtSize(text, size);
      const startX = MARGIN_L + (CONTENT_W - tw) / 2;
      const startY = this.pdfY(this.cursorY);
      this.page.drawText(text, { x: startX, y: startY, size, font: this.fontBold, color: rgb(0,0,0) });
      if (underline) {
        this.page.drawLine({
          start: { x: startX, y: startY - 2 },
          end: { x: startX + tw, y: startY - 2 },
          thickness: 1,
          color: rgb(0,0,0)
        });
      }
      this.cursorY += ySpaceAfter;
    };

    drawCenteredBold('VALUATION OF IMMOVABLE PROPERTY', FONT_SIZE_TITLE + 3, 40, true);

    drawCenteredBold('PROPERTY OWNER', FONT_SIZE_HEADER, 16, true);
    const po = fv('propertyOwner', 'PRASANNA NAYAK,\nS/O- PRAHALLAD NAYAK');
    drawCenteredBold(po.split('\n')[0], FONT_SIZE, 14);
    if (po.includes('\n')) drawCenteredBold(po.split('\n')[1], FONT_SIZE, 30);
    else this.cursorY += 20;

    drawCenteredBold('ADDRESS OF THE PROPERTY', FONT_SIZE_HEADER, 16, true);
    drawCenteredBold(fv('addressOfTheProperty'), FONT_SIZE, 40);

    drawCenteredBold('VALUE OF THE PROPERTY', FONT_SIZE_HEADER, 16, true);
    drawCenteredBold(`PRESENT MARKET VALUE: ${fv('presentMarketValue')}`, FONT_SIZE, 14);
    drawCenteredBold(`DISTRESS SALE VALUE: ${fv('distressSaleValue')}`, FONT_SIZE, 40);

    drawCenteredBold('PURPOSE OF VALUATION', FONT_SIZE_HEADER, 16, true);
    drawCenteredBold(fv('purposeOfValuation', 'TO ASSESS THE FAIR MARKET VALUE OF THE COLLATERAL SECURITY'), FONT_SIZE, 40);

    drawCenteredBold('PREPARED BY', FONT_SIZE_HEADER, 16, true);
    
    drawCenteredBold(fv('preparedByCompany', 'M/s. S MOHANTY ASSOCIATES'), FONT_SIZE, 14);
    drawCenteredBold(fv('preparedByDesignation', 'EMPANELLED VALUER & CHARTERED ENGINEER'), FONT_SIZE, 14);
    
    const plotNo = fv('preparedByPlotNo', 'Plot no-859/2494/3232 & 858/2493/3295');
    if (plotNo) drawCenteredBold(`${plotNo},`, FONT_SIZE, 14);

    const street = fv('preparedByStreet', 'Shiv Nagar Tankapani Road');
    if (street) drawCenteredBold(`${street},`, FONT_SIZE, 14);

    const cityStatePin = [
      fv('preparedByCity', 'Bhubaneswar'),
      fv('preparedByState', 'Odisha'),
      fv('preparedByPinCode', '751018') ? `Pin-${fv('preparedByPinCode', '751018')}` : ''
    ].filter(Boolean).join(', ');
    if (cityStatePin) drawCenteredBold(cityStatePin, FONT_SIZE, 14);

    drawCenteredBold(`PHONE- ${fv('preparedByPhone', '06742381145')}`, FONT_SIZE, 14);
    
    let rawMobile = fv('preparedByMobile', '9937023855/9437074855');
    let processedMobile = rawMobile.replace(/[^0-9]+/g, '/').replace(/(^\/|\/$)/g, '');
    drawCenteredBold(`MOBILE-${processedMobile}`, FONT_SIZE, 0);

    // PAGE 2: Report details
    this.addPage();
    
    this.page.drawText(`Ref No: ${fv('refNo')}`, { x: MARGIN_L, y: this.pdfY(this.cursorY), size: FONT_SIZE, font: this.fontBold, color: rgb(0,0,0) });
    const dateStr = `Date: ${fv('dateOfReport')}`;
    const wDate = this.fontBold.widthOfTextAtSize(dateStr, FONT_SIZE);
    this.page.drawText(dateStr, { x: MARGIN_L + CONTENT_W - wDate, y: this.pdfY(this.cursorY), size: FONT_SIZE, font: this.fontBold, color: rgb(0,0,0) });
    this.cursorY += 20;

    const C1 = 30; const C2 = 230; const C3 = CONTENT_W - C1 - C2;

    this.drawTable([], [
      ['1.', 'Name of the Customer', fv('nameOfCustomer')],
      ['', 'Customer Contact Details', fv('customerContactDetails')],
      ['2.', 'APP ID / Loan Account No', fv('appIdLoanAccountNo')],
      ['3.', 'Documents Provided: Approved Layout/ Approved Building Plan/ NA order/ Four Boundaries Details', fv('documentsProvided')],
      ['4.', 'Property Details', fv('propertyDetailsAddress')],
      ['a.', 'Plot No', fv('plotNo')],
      ['b.', 'S No/G. No/Khasra No/Khata No', fv('khasraNoKhataNo')],
      ['c.', 'Locality', fv('locality')],
      ['d.', 'Road', fv('road')],
      ['e.', 'City', fv('city')],
      ['f.', 'District', fv('district')],
      ['g.', 'Pin code', fv('pinCode')],
      ['h.', 'Nearby Land Mark', fv('nearbyLandMark')],
      ['i.', 'Distance from City Center', fv('distanceFromCityCenter')],
      ['j.', 'Availability of Local Transport : Metro/ Local Train/ Bus', fv('availabilityOfLocalTransport')],
      ['k.', 'Level of land with topographical conditions', fv('levelOfLand')],
      ['l.', 'Class Of Locality : Posh/ Higher Middle Class/Middle class/Lower middle Class/ Poor', fv('classOfLocality')],
      ['m.', 'Quality of Infrastructure in the vicinity', fv('qualityOfInfrastructure')],
    ], [C1, C2, C3], [], []);

    this.drawTable([], [
      ['n.', 'Boundaries of Property as sale deed', 'Boundaries of Property as per Actual']
    ], [C1, C2, C3], [], [1, 2]);
    
    this.drawTable([], [
      ['', `East:- ${fv('eastSaleDeed')}`, `East:- ${fv('eastActual')}`],
      ['', `West:- ${fv('westSaleDeed')}`, `West:- ${fv('westActual')}`],
      ['', `North:- ${fv('northSaleDeed')}`, `North:- ${fv('northActual')}`],
      ['', `South:- ${fv('southSaleDeed')}`, `South:- ${fv('southActual')}`],
      ['', 'As per sketch map', ''],
      ['o.', 'Does the Boundaries at Site match, as mentioned in documentation?', fv('boundariesMatching')]
    ], [C1, C2, C3], [], [2]);

    this.drawTable([], [
      ['p.', 'Status of the Land/ Flat : Free Hold/Leased / Development Authority', fv('statusOfLand')],
      ['q.', 'Type of Property : Bungalow/row house/Plot/ flat (1BHK/2BHK/3BHK) /commercial', fv('typeOfProperty')],
      ['r.', 'Approved usage of Property: Agri/ Mix /Industrial/commercial/Residential (Restrictive covenants in regards to Land Use, if any)', fv('approvedUsage')],
      ['s.', 'Actual Usage of the Property :Agri/Industrial/commercial/Residential/Mix', fv('actualUsage')],
      ['t.', 'Type of Structure : Load Bearing/RCC/Aluform shuttering', fv('typeOfStructure')],
      ['u.', 'No of Floors', fv('noOfFloors')],
      ['v.', 'Occupancy Details: Self Occupied/Rented/ Vacant', fv('occupancyDetails')],
      ['w.', 'Does property have Electricity / Water / Drainage connection', fv('electricityWaterDrainage')],
      ['x.', 'Proximity to civic amenities like school, hospital, market, etc', fv('proximityToCivicAmenities')],
      ['y.', 'Development of surrounding area', fv('developmentOfSurroundingArea')],
      ['z.', 'Longitude & latitude of the property', ''],
      ['i.', 'Longitude', fv('longitude')],
      ['ii.', 'Latitude', fv('latitude')],
    ], [C1, C2, C3], [], [10, 11]);

    this.drawTable([], [
      ['5.', 'APPROVAL DETAILS', '']
    ], [C1, C2, C3], [], [0, 1]);
    
    this.drawTable([], [
      ['a.', 'Building Plan Approval No', fv('buildingPlanApprovalNo')],
      ['b.', 'Date of Approval', fv('dateOfApproval')],
      ['c.', 'Expiry Date', fv('expiryDate')],
      ['d.', 'Expected Completion', fv('expectedCompletion')],
    ], [C1, C2, C3], [], []);

    this.drawTable([], [
      ['6.', 'CONSTRUCTION DETAILS', '']
    ], [C1, C2, C3], [], [0, 1]);
    
    this.drawTable([], [
      ['a.', 'Area of the Plot/flat', fv('areaOfPlot')],
      ['b.', 'Demarcation at Site', fv('demarcationAtSite')],
      ['c.', 'Approved Built up Area: _______sqft floor wise break up (for Bungalow/Twin /Row-house) as follows', 'NA'],
      ['', 'G.F. (ground floor) - Sq Ft Description', fv('approvedBuaGf')],
      ['', 'F.F. (first floor) - Sq Ft Description', fv('approvedBuaFf')],
      ['', 'M.F. (mezzanine floor) - Sq Ft Description', fv('approvedBuaMf')],
      ['', 'S.F(second floor)- Sqft Description', fv('approvedBuaSf')],
      ['d.', 'Measured Built up Area: _______sqft floor wise break up (for Bungalow/Twin /Row-house) as follows', fv('measuredBuaGf')],
      ['', 'G.F. (ground floor) - Sq Ft Description', fv('measuredBuaFf')],
      ['', 'F.F. (first floor) - Sq Ft Description', fv('measuredBuaSf')],
      ['', 'S.F. (second floor) - Sq Ft Description', fv('measuredBuaTf')],
      ['', 'T.F(third floor)- Sqft Description', 'NA'],
      ['e.', 'Whether the construction is as per approved building plan and / or local building bye laws', fv('constructionAsPerApprovedPlan')],
      ['f.', 'Quality of construction', fv('qualityOfConstruction')],
      ['g.', 'Maintenance of the Property: excellent/very good/average/poor', fv('maintenanceOfProperty')],
      ['h.', 'Current Life of the structure', fv('currentLifeOfStructure')],
      ['i.', 'Projected Life of the Structure', fv('projectedLifeOfStructure')],
    ], [C1, C2, C3], [], [2, 7]);

    this.drawTable([], [
      ['7.', 'Recommended Valuation of the Property', '']
    ], [C1, C2, C3], [], []);

    this.drawTable([], [
      ['a.', 'Recommended rate of the Plot/Flat', fv('recommendedRateOfPlot')],
      ['b.', 'Value of the Plot/Flat', fv('valueOfPlot')],
      ['c.', 'Estimated Cost of construction', fv('estimatedCostOfConstruction')],
      ['d.', 'Total Cost of construction Measured GF RCC', fv('totalCostOfConstructionMeasuredGfRcc')],
      ['', 'Depreciation value(1% per year(Nil)', fv('depreciationValue')],
      ['e.', 'Stage of Construction', fv('stageOfConstruction')],
      ['f.', '% Work completed', fv('percentWorkCompleted')],
      ['g.', '% Disbursement Recommended', fv('percentDisbursementRecommended')],
      ['h.', 'Current Value of the Property (Plot + construction)', fv('currentValueOfTheProperty')],
      ['i.', 'Date of Property Visit', fv('dateOfPropertyVisit')],
      ['8.', 'Valuation as per Government reckoner rates', fv('valuationAsPerGovernmentReckoner')],
      ['9.', 'Distressed valuation of the Property', fv('distressedValuation')],
      ['10.', 'Rental value per month', fv('rentalValuePerMonth')],
      ['11.', 'Attachment', ''],
      ['a.', '4 photos of the Property from inside/outside are attached', 'Attached'],
      ['b.', 'Location sketch for the property', 'Attached'],
      ['12.', 'Remarks :', ''],
      ['', fv('remarks', '(Comment on - resistance for valuation...)'), fv('remarks')],
    ], [C1, C2, C3], [], [4, 8, 11]);

    this.cursorY += 20;
    this.page.drawText('Undertaking:', { x: MARGIN_L, y: this.pdfY(this.cursorY), size: FONT_SIZE, font: this.fontBold, color: rgb(0,0,0) });
    this.cursorY += 16;
    this.page.drawText('I have personally visited the property & identified the same based on the documents provided.', { x: MARGIN_L, y: this.pdfY(this.cursorY), size: FONT_SIZE, font: this.fontRegular, color: rgb(0,0,0) });
    this.cursorY += 20;
    this.page.drawText('I/We have no direct or Indirect Interest in the property being valued.', { x: MARGIN_L, y: this.pdfY(this.cursorY), size: FONT_SIZE, font: this.fontRegular, color: rgb(0,0,0) });
    this.cursorY += 16;
    this.page.drawText('The information furnished above is true and correct to my/our knowledge.', { x: MARGIN_L, y: this.pdfY(this.cursorY), size: FONT_SIZE, font: this.fontRegular, color: rgb(0,0,0) });
    this.cursorY += 20;
    this.page.drawText('Authorized Signatory', { x: MARGIN_L, y: this.pdfY(this.cursorY), size: FONT_SIZE, font: this.fontBold, color: rgb(0,0,0) });
    this.cursorY += 16;
    this.page.drawText('Name & Seal of the Agency', { x: MARGIN_L, y: this.pdfY(this.cursorY), size: FONT_SIZE, font: this.fontRegular, color: rgb(0,0,0) });
    this.cursorY += 24;
    this.page.drawText('Er. Satyajit Mohanty', { x: MARGIN_L, y: this.pdfY(this.cursorY), size: FONT_SIZE, font: this.fontBold, color: rgb(0,0,0) });
    this.cursorY += 16;
    this.page.drawText('Approved Panel Valuer', { x: MARGIN_L, y: this.pdfY(this.cursorY), size: FONT_SIZE, font: this.fontRegular, color: rgb(0,0,0) });

    const imgs = Array.isArray(fields.propertyImages) ? fields.propertyImages : [];
    if (imgs.length > 0) {
      this.addPage();
      this.page.drawText('PHOTOGRAPHS', { x: MARGIN_L, y: this.pdfY(this.cursorY), size: FONT_SIZE_HEADER, font: this.fontBold, color: rgb(0,0,0) });
      const photoHdrW = this.fontBold.widthOfTextAtSize('PHOTOGRAPHS', FONT_SIZE_HEADER);
      this.page.drawLine({ start: { x: MARGIN_L, y: this.pdfY(this.cursorY) - 2 }, end: { x: MARGIN_L + photoHdrW, y: this.pdfY(this.cursorY) - 2 }, color: rgb(0,0,0), thickness: 1 });
      this.cursorY += 24;
      await this.drawPhotoGrid(imgs);
    }

    if (fields.locationMapImage) {
      this.addPage();
      const text = `LOCATION MAP (LAT: ${fv('latitude')}, LONG: ${fv('longitude')})`;
      this.page.drawText(text, { x: MARGIN_L, y: this.pdfY(this.cursorY), size: FONT_SIZE_HEADER, font: this.fontBold, color: rgb(0,0,0) });
      this.cursorY += 24;
      await this.drawImageBlock(fields.locationMapImage);
      this.cursorY += 20;
    }

    if (fields.mouzaMapImage) {
      if (this.cursorY > 600) this.addPage();
      this.page.drawText('MOUZA MAP', { x: MARGIN_L, y: this.pdfY(this.cursorY), size: FONT_SIZE_HEADER, font: this.fontBold, color: rgb(0,0,0) });
      this.cursorY += 24;
      await this.drawImageBlock(fields.mouzaMapImage);
    }

    if (fields.sketchMapImage) {
      this.addPage();
      this.page.drawText('SKETCH MAP', { x: MARGIN_L, y: this.pdfY(this.cursorY), size: FONT_SIZE_HEADER, font: this.fontBold, color: rgb(0,0,0) });
      this.cursorY += 24;
      await this.drawImageBlock(fields.sketchMapImage);
    }

    return await this.save();
  }
}

