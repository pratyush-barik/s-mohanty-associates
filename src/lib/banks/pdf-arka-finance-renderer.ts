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

  // Section 2: Client & Application
  nameOfCustomer: string;
  customerContactDetails: string;
  appIdLoanAccountNo: string;
  documentsProvided: string;
  documentsProvidedOther: string;

  // Section 3: Property Overview & Location
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

  // Section 4: Boundaries & Characteristics
  eastSaleDeed: string;
  eastActual: string;
  eastSketchMap: string;
  westSaleDeed: string;
  westActual: string;
  westSketchMap: string;
  northSaleDeed: string;
  northActual: string;
  northSketchMap: string;
  southSaleDeed: string;
  southActual: string;
  southSketchMap: string;
  boundariesMatch: string;
  landStatus: string;
  propertyType: string;
  approvedUsage: string;
  actualUsage: string;
  structureType: string;
  numberOfFloors: string;
  occupancyDetails: string;
  electricityWaterDrainage: string;
  proximityToCivicAmenities: string;
  developmentOfSurroundingArea: string;
  longitude: string;
  latitude: string;

  // Section 5: Construction & Approvals
  buildingPlanApprovalNo: string;
  dateOfApproval: string;
  expiryDate: string;
  expectedCompletion: string;
  areaOfPlot: string;
  demarcationAtSite: string;
  approvedBuaFloors: { floor: string; area: string }[];
  measuredBuaFloors: { floor: string; area: string }[];
  constructionAsPerPlan: string;
  qualityOfConstruction: string;
  maintenanceOfProperty: string;
  currentLifeOfStructure: string;
  projectedLifeOfStructure: string;

  // Section 6: Valuation Details
  recommendedRateOfPlot: string;
  valueOfPlot: string;
  estimatedCostOfConstruction: string;
  totalCostOfConstructionMeasured: string;
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
  propertyImageNames: string[];
  locationMapImages: any[];
  mouzaMapImages: any[];
  sketchMapImages: any[];
  cadastralMapImages: any[];
}

export class PDFArkaFinanceRenderer extends PDFBankRenderer {
  public async render(fields: ArkaReportFields): Promise<Uint8Array> {
    const fv = (key: string, defaultVal = '') => (fields as any)[key] as string || defaultVal;

    this.cursorY += 60;

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

    // Property Owners from dynamic array
    drawCenteredBold('PROPERTY OWNER', FONT_SIZE_HEADER, 16, true);
    const owners = Array.isArray(fields.propertyOwners) && fields.propertyOwners.length > 0
      ? fields.propertyOwners
      : [{ name: '', fatherName: '' }];
    for (const owner of owners) {
      if (owner.name) {
        drawCenteredBold(owner.name, FONT_SIZE, 14);
        if (owner.fatherName) drawCenteredBold(`S/O- ${owner.fatherName}`, FONT_SIZE, 14);
      }
    }
    this.cursorY += 16;

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

    // PAGE 2: Report details in table format
    this.addPage();

    this.page.drawText(`Ref No: ${fv('refNo')}`, { x: MARGIN_L, y: this.pdfY(this.cursorY), size: FONT_SIZE, font: this.fontBold, color: rgb(0,0,0) });
    const dateStr = `Date: ${fv('dateOfReport')}`;
    const wDate = this.fontBold.widthOfTextAtSize(dateStr, FONT_SIZE);
    this.page.drawText(dateStr, { x: MARGIN_L + CONTENT_W - wDate, y: this.pdfY(this.cursorY), size: FONT_SIZE, font: this.fontBold, color: rgb(0,0,0) });
    this.cursorY += 20;

    const C1 = 30; const C2 = 230; const C3 = CONTENT_W - C1 - C2;

    // Resolve documents provided text
    const docsProvided = fv('documentsProvided');
    const docsText = docsProvided === 'Multiple' ? fv('documentsProvidedOther', docsProvided) : docsProvided;

    // Section items 1-4 + sub-items a-m (same table layout as reference)
    this.drawTable([], [
      ['1.', 'Name of the Customer', fv('nameOfCustomer')],
      ['', 'Customer Contact Details', fv('customerContactDetails')],
      ['2.', 'APP ID / Loan Account No', fv('appIdLoanAccountNo')],
      ['3.', 'Documents Provided: Approved Layout/ Approved Building Plan/ NA order/ Four Boundaries Details', docsText],
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

    // Boundaries header
    this.drawTable([], [
      ['n.', 'Boundaries of Property as sale deed', 'Boundaries of Property as per Actual']
    ], [C1, C2, C3], [], [1, 2]);

    // Boundary rows
    this.drawTable([], [
      ['', `East:- ${fv('eastSaleDeed')}`, `East:- ${fv('eastActual')}`],
      ['', `West:- ${fv('westSaleDeed')}`, `West:- ${fv('westActual')}`],
      ['', `North:- ${fv('northSaleDeed')}`, `North:- ${fv('northActual')}`],
      ['', `South:- ${fv('southSaleDeed')}`, `South:- ${fv('southActual')}`],
    ], [C1, C2, C3], [], []);

    // Sketch map header
    this.drawTable([], [
      ['', 'Boundaries of Property as per sketch map', '']
    ], [C1, C2, C3], [], [1]);

    // Sketch map rows
    this.drawTable([], [
      ['', `East:- ${fv('eastSketchMap')}`, ''],
      ['', `West:- ${fv('westSketchMap')}`, ''],
      ['', `North:- ${fv('northSketchMap')}`, ''],
      ['', `South:- ${fv('southSketchMap')}`, ''],
    ], [C1, C2, C3], [], []);

    // Match boundaries question
    this.drawTable([], [
      ['o.', 'Does the Boundaries at Site match, as mentioned in documentation?', fv('boundariesMatch')]
    ], [C1, C2, C3], [], [1]);

    // Property characteristics (p-z)
    this.drawTable([], [
      ['p.', 'Status of the Land/ Flat : Free Hold/Leased / Development Authority', fv('landStatus')],
      ['q.', 'Type of Property : Bungalow/row house/Plot/ flat (1BHK/2BHK/3BHK) /commercial', fv('propertyType')],
      ['r.', 'Approved usage of Property: Agri/ Mix /Industrial/commercial/Residential (Restrictive covenants in regards to Land Use, if any)', fv('approvedUsage')],
      ['s.', 'Actual Usage of the Property :Agri/Industrial/commercial/Residential/Mix', fv('actualUsage')],
      ['t.', 'Type of Structure : Load Bearing/RCC/Aluform shuttering', fv('structureType')],
      ['u.', 'No of Floors', fv('numberOfFloors')],
      ['v.', 'Occupancy Details: Self Occupied/Rented/ Vacant', fv('occupancyDetails')],
      ['w.', 'Does property have Electricity / Water / Drainage connection', fv('electricityWaterDrainage')],
      ['x.', 'Proximity to civic amenities like school, hospital, market, etc', fv('proximityToCivicAmenities')],
      ['y.', 'Development of surrounding area', fv('developmentOfSurroundingArea')],
      ['z.', 'Longitude & latitude of the property', ''],
    ], [C1, C2, C3], [], []);

    this.drawTable([], [
      ['i.', 'Longitude', fv('longitude')],
      ['ii.', 'Latitude', fv('latitude')],
    ], [C1, C2, C3], [], [], [0, 1, 2]);

    // 5. APPROVAL DETAILS header
    this.drawTable([], [
      ['5.', 'APPROVAL DETAILS', '']
    ], [C1, C2, C3], [], [0, 1]);

    this.drawTable([], [
      ['a.', 'Building Plan Approval No', fv('buildingPlanApprovalNo')],
      ['b.', 'Date of Approval', fv('dateOfApproval')],
      ['c.', 'Expiry Date', fv('expiryDate')],
      ['d.', 'Expected Completion', fv('expectedCompletion')],
    ], [C1, C2, C3], [], []);

    // 6. CONSTRUCTION DETAILS header
    this.drawTable([], [
      ['6.', 'CONSTRUCTION DETAILS', '']
    ], [C1, C2, C3], [], [0, 1]);

    // Build dynamic BUA rows from approvedBuaFloors array
    const approvedFloors = Array.isArray(fields.approvedBuaFloors) ? fields.approvedBuaFloors : [];
    const approvedBuaRows: string[][] = approvedFloors.map((f: any) => ['', f.floor || '', f.area || '']);
    const measuredFloors = Array.isArray(fields.measuredBuaFloors) ? fields.measuredBuaFloors : [];
    const measuredBuaRows: string[][] = measuredFloors.map((f: any) => ['', f.floor || '', f.area || '']);

    // Advanced Regex Auto-Sum Logic
    const calculateFloorSums = (floors: any[], labelPrefix: string) => {
      let hasAnyValue = false;
      const formattedSums: string[] = [];

      for (const f of floors) {
        const text = String(f.area || '').trim();
        if (!text) continue;
        
        if (text.toUpperCase() === 'NA') {
          continue; 
        } else {
          hasAnyValue = true;
          const numbers = text.match(/\d+(\.\d+)?/g);
          if (numbers && numbers.length > 0) {
            const sum = numbers.reduce((acc, val) => acc + parseFloat(val), 0);
            
            // Extract abbreviation logically
            let floorAbbr = '';
            const floorNameLower = (f.floor || '').toLowerCase();
            if (floorNameLower.includes('g.f.') || floorNameLower.includes('ground')) floorAbbr = 'GF';
            else if (floorNameLower.includes('f.f.') || floorNameLower.includes('first')) floorAbbr = 'FF';
            else if (floorNameLower.includes('s.f') || floorNameLower.includes('second')) floorAbbr = 'SF';
            else if (floorNameLower.includes('t.f') || floorNameLower.includes('third')) floorAbbr = 'TF';
            else if (floorNameLower.includes('m.f.') || floorNameLower.includes('mezzanine')) floorAbbr = 'MF';
            else floorAbbr = (f.floor || '').substring(0, 2).toUpperCase();
            
            formattedSums.push(`${sum}sqft(${labelPrefix} ${floorAbbr})`);
          }
        }
      }

      if (hasAnyValue && formattedSums.length > 0) return formattedSums.join(', ');
      if (!hasAnyValue && floors.some((f: any) => String(f.area || '').trim().toUpperCase() === 'NA')) return 'NA';
      return '';
    };

    const approvedSumsStr = calculateFloorSums(approvedFloors, 'Approved');
    const measuredSumsStr = calculateFloorSums(measuredFloors, 'Measured');

    const constructionRows: string[][] = [
      ['a.', 'Area of the Plot/flat', fv('areaOfPlot')],
      ['b.', 'Demarcation at Site', fv('demarcationAtSite')],
      ['c.', 'Approved Built up Area:_______sqft floor wise break up (for Bungalow/Twin /Row-house) as follows', approvedSumsStr],
      ...approvedBuaRows,
      ['d.', 'Measured Built up Area:_______sqft floor wise break up (for Bungalow/Twin /Row-house) as follows', measuredSumsStr],
      ...measuredBuaRows,
      ['e.', 'Whether the construction is as per approved building plan and / or local building bye laws', fv('constructionAsPerPlan')],
      ['f.', 'Quality of construction', fv('qualityOfConstruction')],
      ['g.', 'Maintenance of the Property: excellent/very good/average/poor', fv('maintenanceOfProperty')],
      ['h.', 'Current Life of the structure', fv('currentLifeOfStructure')],
      ['i.', 'Projected Life of the Structure', fv('projectedLifeOfStructure')],
    ];

    // Bold row indices: the 'c.' header row (index 2) and the 'd.' header row
    const cIdx = 2;
    const dIdx = 3 + approvedBuaRows.length;
    this.drawTable([], constructionRows, [C1, C2, C3], [], [cIdx, dIdx]);

    // 7. Recommended Valuation
    this.drawTable([], [
      ['7.', 'Recommended Valuation of the Property', '']
    ], [C1, C2, C3], [], []);

    this.drawTable([], [
      ['a.', 'Recommended rate of the Plot/Flat', fv('recommendedRateOfPlot')],
      ['b.', 'Value of the Plot/Flat', fv('valueOfPlot')],
      ['c.', 'Estimated Cost of construction', fv('estimatedCostOfConstruction')],
      ['d.', 'Total Cost of construction Measured', fv('totalCostOfConstructionMeasured')],
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
      ['', fv('remarks', ''), fv('remarks')],
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

    // PHOTOGRAPHS
    const imgs = Array.isArray(fields.propertyImages) ? fields.propertyImages : [];
    if (imgs.length > 0) {
      this.addPage();
      this.page.drawText('PHOTOGRAPHS', { x: MARGIN_L, y: this.pdfY(this.cursorY), size: FONT_SIZE_HEADER, font: this.fontBold, color: rgb(0,0,0) });
      const photoHdrW = this.fontBold.widthOfTextAtSize('PHOTOGRAPHS', FONT_SIZE_HEADER);
      this.page.drawLine({ start: { x: MARGIN_L, y: this.pdfY(this.cursorY) - 2 }, end: { x: MARGIN_L + photoHdrW, y: this.pdfY(this.cursorY) - 2 }, color: rgb(0,0,0), thickness: 1 });
      this.cursorY += 24;
      await this.drawPhotoGrid(imgs);
    }

    // MAPS - support arrays (locationMapImages, mouzaMapImages, sketchMapImages)
    const locationMaps = Array.isArray(fields.locationMapImages) ? fields.locationMapImages : (fields as any).locationMapImage ? [(fields as any).locationMapImage] : [];
    const mouzaMaps = Array.isArray(fields.mouzaMapImages) ? fields.mouzaMapImages : (fields as any).mouzaMapImage ? [(fields as any).mouzaMapImage] : [];
    const sketchMaps = Array.isArray(fields.sketchMapImages) ? fields.sketchMapImages : (fields as any).sketchMapImage ? [(fields as any).sketchMapImage] : [];

    if (locationMaps.length > 0) {
      this.addPage();
      const text = `LOCATION MAP (LAT: ${fv('latitude')}, LONG: ${fv('longitude')})`;
      this.page.drawText(text, { x: MARGIN_L, y: this.pdfY(this.cursorY), size: FONT_SIZE_HEADER, font: this.fontBold, color: rgb(0,0,0) });
      this.cursorY += 24;
      for (const mapImg of locationMaps) {
        await this.drawImageBlock(mapImg);
        this.cursorY += 20;
      }
    }

    if (mouzaMaps.length > 0) {
      if (this.cursorY > 600) this.addPage();
      this.page.drawText('MOUZA MAP', { x: MARGIN_L, y: this.pdfY(this.cursorY), size: FONT_SIZE_HEADER, font: this.fontBold, color: rgb(0,0,0) });
      this.cursorY += 24;
      for (const mapImg of mouzaMaps) {
        await this.drawImageBlock(mapImg);
        this.cursorY += 20;
      }
    }

    if (sketchMaps.length > 0) {
      this.addPage();
      this.page.drawText('SKETCH MAP', { x: MARGIN_L, y: this.pdfY(this.cursorY), size: FONT_SIZE_HEADER, font: this.fontBold, color: rgb(0,0,0) });
      this.cursorY += 24;
      for (const mapImg of sketchMaps) {
        await this.drawImageBlock(mapImg);
        this.cursorY += 20;
      }
    }

    return await this.save();
  }
}