import { PDFBankRenderer } from '../pdf-bank-renderer';
import { BaseReportFields } from '../bank-fields';
import { rgb } from 'pdf-lib';

export interface ArkaReportFields extends BaseReportFields {
  propertyOwner: string;
  addressOfTheProperty: string;
  presentMarketValue: string;
  distressSaleValue: string;
  purposeOfValuation: string;

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
    
    this.addPage();
    this.cursorY += 60;
    
    const drawCenteredBold = (text: string, size: number, ySpaceAfter: number) => {
      const tw = this.fontBold.widthOfTextAtSize(text, size);
      this.page.drawText(text, { x: 35 + (525 - tw) / 2, y: this.pdfY(this.cursorY), size, font: this.fontBold, color: rgb(0,0,0) });
      this.cursorY += ySpaceAfter;
    };

    this.page.drawRectangle({
      x: 35 + (525 - 380) / 2, y: this.pdfY(this.cursorY + 4) - 20, width: 380, height: 24,
      color: rgb(1,1,1), borderColor: rgb(0,0,0), borderWidth: 1
    });
    drawCenteredBold('VALUATION OF IMMOVABLE PROPERTY', 16, 40);

    drawCenteredBold('PROPERTY OWNER', 12, 16);
    const po = fv('propertyOwner', 'PRASANNA NAYAK,\nS/O- PRAHALLAD NAYAK');
    drawCenteredBold(po.split('\n')[0], 10, 14);
    if (po.includes('\n')) drawCenteredBold(po.split('\n')[1], 10, 30);
    else this.cursorY += 20;

    drawCenteredBold('ADDRESS OF THE PROPERTY', 12, 16);
    drawCenteredBold(fv('addressOfTheProperty'), 10, 40);

    drawCenteredBold('VALUE OF THE PROPERTY', 12, 16);
    drawCenteredBold(`PRESENT MARKET VALUE: ${fv('presentMarketValue')}`, 10, 14);
    drawCenteredBold(`DISTRESS SALE VALUE: ${fv('distressSaleValue')}`, 10, 40);

    drawCenteredBold('PURPOSE OF VALUATION', 12, 16);
    drawCenteredBold(fv('purposeOfValuation', 'TO ASSESS THE FAIR MARKET VALUE OF THE COLLATERAL SECURITY'), 10, 40);

    drawCenteredBold('PREPARED BY', 12, 16);
    drawCenteredBold('M/s. S MOHANTY ASSOCIATES', 10, 14);
    drawCenteredBold('EMPANELLED VALUER & CHARTERED ENGINEER', 10, 14);
    drawCenteredBold('Plot no-859/2494/3232 & 858/2493/3295,', 10, 14);
    drawCenteredBold('Shiv Nagar Tankapani Road,', 10, 14);
    drawCenteredBold('Bhubaneswar, Odisha,Pin-751018', 10, 14);
    drawCenteredBold('PHONE- 0674-2381145', 10, 14);
    drawCenteredBold('MOBILE-9937023855/9437074855', 10, 0);

    // PAGE 2: Report details
    this.addPage();
    
    const wRef = this.fontBold.widthOfTextAtSize(`Ref No: ${fv('refNo')}`, 10);
    this.page.drawText(`Ref No: ${fv('refNo')}`, { x: 35, y: this.pdfY(this.cursorY), size: 10, font: this.fontBold, color: rgb(0,0,0) });
    const dateStr = `Date: ${fv('dateOfReport')}`;
    const wDate = this.fontBold.widthOfTextAtSize(dateStr, 10);
    this.page.drawText(dateStr, { x: 560 - wDate, y: this.pdfY(this.cursorY), size: 10, font: this.fontBold, color: rgb(0,0,0) });
    this.cursorY += 20;

    const C1 = 40; const C2 = 250; const C3 = 235;

    this.drawTable([], [
      ['1.', 'Name of the Customer', fv('nameOfCustomer')],
      ['', 'Customer Contact Details', fv('customerContactDetails')],
      ['2.', 'AP��D/Loan Account No', fv('appIdLoanAccountNo')],
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
    this.page.drawText('Undertaking:', { x: 35, y: this.pdfY(this.cursorY), size: 10, font: this.fontRegular, color: rgb(0,0,0) });
    this.cursorY += 14;
    this.page.drawText('I have personally visited the property & identified the same based on the documents provided.', { x: 35, y: this.pdfY(this.cursorY), size: 10, font: this.fontRegular, color: rgb(0,0,0) });
    this.cursorY += 30;
    this.page.drawText('I/We have no direct or Indirect Interest in the property being valued.', { x: 35, y: this.pdfY(this.cursorY), size: 10, font: this.fontRegular, color: rgb(0,0,0) });
    this.cursorY += 14;
    this.page.drawText('The information furnished above is true and correct to my/our knowledge.', { x: 35, y: this.pdfY(this.cursorY), size: 10, font: this.fontRegular, color: rgb(0,0,0) });
    this.cursorY += 14;
    this.page.drawText('Authorized Signatory', { x: 35, y: this.pdfY(this.cursorY), size: 10, font: this.fontRegular, color: rgb(0,0,0) });
    this.cursorY += 14;
    this.page.drawText('Name & Seal of the Agency', { x: 35, y: this.pdfY(this.cursorY), size: 10, font: this.fontRegular, color: rgb(0,0,0) });
    this.cursorY += 30;
    this.page.drawText('Er. Satyajit Mohanty', { x: 35, y: this.pdfY(this.cursorY), size: 10, font: this.fontRegular, color: rgb(0,0,0) });
    this.cursorY += 14;
    this.page.drawText('Approved Panel Valuer', { x: 35, y: this.pdfY(this.cursorY), size: 10, font: this.fontRegular, color: rgb(0,0,0) });

    const imgs = Array.isArray(fields.propertyImages) ? fields.propertyImages : [];
    if (imgs.length > 0) {
      this.addPage();
      this.page.drawText('PHOTOGRAPHS', { x: 35, y: this.pdfY(this.cursorY), size: 12, font: this.fontBold, color: rgb(0,0,0) });
      this.page.drawLine({ start: {x: 35, y: this.pdfY(this.cursorY)-2}, end: {x: 125, y: this.pdfY(this.cursorY)-2}, color: rgb(0,0,0), thickness: 1});
      this.cursorY += 20;
      await this.drawPhotoGrid(imgs);
    }

    if (fields.locationMapImage) {
      this.addPage();
      const text = `LOCATION MAP (LAT:-${fv('latitude')}, LONG:-${fv ('longitude')})`;
      this.page.drawText(text, { x: 35, y: this.pdfY(this.cursorY), size: 12, font: this.fontBold, color: rgb(0,0,0) });
      this.cursorY += 20;
      await this.drawImageBlock(fields.locationMapImage);
      this.cursorY += 20;
    }

    if (fields.mouzaMapImage) {
      if (this.cursorY > 600) this.addPage();
      this.page.drawText('MOUZA MAP', { x: 35, y: this.pdfY(this.cursorY), size: 12, font: this.fontBold, color: rgb(0,0,0) });
      this.cursorY += 20;
      await this.drawImageBlock(fields.mouzaMapImage);
    }

    if (fields.sketchMapImage) {
      this.addPage();
      this.page.drawText('SKETCH MAP', { x: 35, y: this.pdfY(this.cursorY), size: 12, font: this.fontBold, color: rgb(0,0,0) });
      this.cursorY += 20;
      await this.drawImageBlock(fields.sketchMapImage);
    }

    return await this.save();
  }
}

