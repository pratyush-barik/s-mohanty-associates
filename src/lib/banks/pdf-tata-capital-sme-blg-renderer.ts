import {
  PDFBankRenderer,
  CONTENT_W,
  MARGIN_L,
  FONT_SIZE,
  FONT_SIZE_HEADER,
  FONT_SIZE_TITLE,
  hexToRgb,
  OPT_BG,
  BORDER_W,
} from '../pdf-bank-renderer';
import { rgb } from 'pdf-lib';
import { formatIndianCurrency, rupeesInWords } from '../numberToWords';

export class PDFTataCapitalSMEBLGRenderer extends PDFBankRenderer {
  private fields: any;
  private projectCode?: string;

  constructor(opts: any = {}) {
    super();
    this.fields = opts || {};
    this.projectCode = opts.projectCode;
  }

  private getF(key: string, defaultVal: any = ''): any {
    const val = this.fields[key];
    if (val === undefined || val === null || val === '') return defaultVal;
    return val;
  }

  async render(): Promise<Uint8Array> {
    await this.init();
    await this.drawContent();
    return await this.save();
  }

  private drawTataPartHeader(partLetter: string, title: string) {
    this.drawSectionHeader(`PART "${partLetter}" : ${title.toUpperCase()}`);
  }

  private drawSubSectionHeader(title: string) {
    this.checkPageBreak(30);
    this.drawKeyValueRow([
      {
        label: title.toUpperCase(),
        value: '',
        labelWidth: CONTENT_W,
        valueWidth: 0,
        labelBold: true,
        highlight: true,
      },
    ]);
  }

  private drawTataRow(num: string | number, label: string, val: string, labelW: number = 220) {
    const fullLabel = num ? `${num}. ${label}` : label;
    this.drawKeyValueRow([
      {
        label: fullLabel,
        value: val || 'NA',
        labelWidth: labelW,
        valueWidth: CONTENT_W - labelW,
      },
    ]);
  }

  async drawContent(): Promise<void> {
    // Top Main Header
    this.drawCenteredTitle('TATA CAPITAL LTD', 15, true);
    this.advanceCursor(2);
    this.drawCenteredTitle('VALUATION REPORT OF IMMOVABLE PROPERTIES (SME-BLG)', 12, true);
    this.advanceCursor(6);

    // ==========================================
    // PART "A" : GENERAL PARTICULARS
    // ==========================================
    this.drawTataPartHeader('A', 'Valuation Report of Immovable Properties');

    const pA = [
      { n: '1', l: 'Purpose of valuation', v: this.getF('purposeOfValuation', 'TO ASSESS THE FMV OF THE PROPERTY') },
      { n: '2', l: 'Date of inspection and valuation', v: this.getF('inspectionDate', '') },
      { n: '3', l: 'Valuer code', v: this.getF('valuerCode', 'SMA/11-25/01') },
      { n: '4', l: 'Suburb name', v: this.getF('suburbName', 'NA') },
      { n: '5', l: 'Cluster id', v: this.getF('clusterId', 'Not Provided') },
      { n: '6', l: 'Customer name', v: this.getF('customerName', '') },
      { n: '7', l: 'Project name (if any)', v: this.getF('projectName', 'NA') },
      { n: '8', l: 'Name of the owners of the property', v: this.getF('ownerName', '') },
      { n: '9', l: 'Flat & Floor No', v: this.getF('flatFloorNo', 'NA') },
      { n: '10', l: 'Name of the building', v: this.getF('buildingName', 'NA') },
      { n: '11', l: 'Brief description of the property (Khata, Plot, Mouza, PS, Tahasil, Dist, State, Pin)', v: this.getF('propertyDescription', '') },
      { n: '12', l: 'Location, street, ward no', v: this.getF('locationStreetWard', '') },
      { n: '13', l: 'S. No., plot no. and C.T.S. No.', v: this.getF('sNoPlotNoCtsNo', '') },
      { n: '14', l: 'Classification of locality', v: this.getF('classificationOfLocality', 'Middle Class') },
      { n: '15', l: 'Proximity to civic amenities', v: this.getF('proximityCivicAmenities', '1-2Kms') },
      { n: '16', l: 'Nearest railway station and distance', v: this.getF('nearestRailwayStation', '') },
      { n: '17', l: 'Modes of transport', v: this.getF('modesOfTransport', 'By Road') },
      { n: '18', l: 'Name of the road for access', v: this.getF('roadAccessName', 'Road') },
      { n: '19', l: 'Area of the land and other details', v: this.getF('landAreaOtherDetails', '') },
      { n: '20', l: 'Land tenure', v: this.getF('landTenure', 'Freehold') },
      { n: '21', l: 'Approvals for drawings from municipal authorities', v: this.getF('approvalDrawings', '') },
      { n: '22', l: 'Name of co-operative Housing society', v: this.getF('cooperativeSocietyDetails', 'NA') },
      { n: '23', l: 'Identified by', v: this.getF('identifiedBy', '') },
      { n: '24', l: 'Visited by', v: this.getF('visitedBy', '') },
    ];

    pA.forEach(item => {
      this.drawTataRow(item.n, item.l, item.v);
    });

    this.advanceCursor(6);

    // ==========================================
    // PART "B" : DETAILS OF STRUCTURE AND SPECIFICATION
    // ==========================================
    this.drawTataPartHeader('B', 'Details of Structure and Specification');

    this.drawTataRow('1', 'Year of construction', this.getF('yearOfConstruction', 'New Constructed'));
    this.drawTataRow('2', 'Age of the building and anticipated future life', this.getF('ageAndLife', 'New / Anticipated Life: 60-Years'));
    this.drawTataRow('3', 'Present condition of flat & building and maintenance & repair required, if any', this.getF('presentCondition', 'Good / NA'));
    this.drawTataRow('4', 'Type of construction', this.getF('typeOfConstruction', 'RCC Roofing'));

    // Boundary Comparison Table
    this.advanceCursor(4);
    const boundaryHeaderW = 120;
    const boundaryColW = (CONTENT_W - boundaryHeaderW) / 2;

    this.drawKeyValueRow([
      { label: 'Boundary Details', value: '', labelWidth: boundaryHeaderW, valueWidth: 0, labelBold: true, highlight: true },
      { label: 'As per Sketch Map', value: '', labelWidth: boundaryColW, valueWidth: 0, labelBold: true, highlight: true },
      { label: 'As per Actual at Site', value: '', labelWidth: boundaryColW, valueWidth: 0, labelBold: true, highlight: true },
    ]);

    const directions = [
      { dir: 'North', sketch: this.getF('boundarySketchNorth', ''), site: this.getF('boundarySiteNorth', '') },
      { dir: 'East', sketch: this.getF('boundarySketchEast', ''), site: this.getF('boundarySiteEast', '') },
      { dir: 'South', sketch: this.getF('boundarySketchSouth', ''), site: this.getF('boundarySiteSouth', '') },
      { dir: 'West', sketch: this.getF('boundarySketchWest', ''), site: this.getF('boundarySiteWest', '') },
    ];

    directions.forEach(d => {
      this.drawKeyValueRow([
        { label: d.dir, value: '', labelWidth: boundaryHeaderW, valueWidth: 0, labelBold: true },
        { label: '', value: d.sketch || 'NA', labelWidth: 0, valueWidth: boundaryColW },
        { label: '', value: d.site || 'NA', labelWidth: 0, valueWidth: boundaryColW },
      ]);
    });

    this.advanceCursor(6);

    // ==========================================
    // PART "C" : DETAILS FOR THE PROPERTY UNDER REFERENCE
    // ==========================================
    this.drawTataPartHeader('C', 'Details for the Property Under Reference');

    const pC = [
      { n: '1', l: 'Estimated date of completion', v: this.getF('estimatedDateCompletion', 'NA') },
      { n: '2', l: 'Permitted use', v: this.getF('permittedUse', 'NA') },
      { n: '3', l: 'Actual use', v: this.getF('actualUse', 'Commercial') },
      { n: '4', l: 'No. of floors', v: this.getF('noOfFloors', '1 (GF)') },
      { n: '5', l: 'No. of lifts', v: this.getF('noOfLifts', 'Nil') },
      { n: '6', l: 'Tanks & pumps', v: this.getF('tanksAndPumps', 'NA') },
      { n: '7', l: 'Flooring open spaces & common staircase', v: this.getF('flooringOpenSpaces', 'NA') },
      { n: '8', l: 'Compound wall & gates', v: this.getF('compoundWallGates', 'Yes') },
      { n: '9', l: 'Elevation', v: this.getF('elevation', 'Good') },
      { n: '10', l: 'Amenities', v: this.getF('amenities', 'NA') },
      { n: '11', l: 'Comments on specification', v: this.getF('commentsOnSpecification', 'NA') },
    ];

    pC.forEach(item => {
      this.drawTataRow(item.n, item.l, item.v);
    });

    // Flat / Unit Checklist (Points 1 - 18)
    this.advanceCursor(4);
    this.drawSubSectionHeader('FLAT / UNIT SPECIFIC CHECKLIST (IF APPLICABLE)');

    const pCUnit = [
      { n: '1', l: 'No. of floors and flats', v: this.getF('unitFloorsFlats', '1 / NA') },
      { n: '2', l: 'Rooms', v: this.getF('unitRooms', 'NA') },
      { n: '3', l: 'Balconies', v: this.getF('unitBalconies', 'NA') },
      { n: '4', l: 'Walls and plaster finish', v: this.getF('unitWallsPlaster', 'NA') },
      { n: '5', l: 'Doors and windows', v: this.getF('unitDoorsWindows', 'NA') },
      { n: '6', l: 'Flooring', v: this.getF('unitFlooring', 'NA') },
      { n: '7', l: 'Sanitary and toilets', v: this.getF('unitSanitaryToilets', 'NA') },
      { n: '8', l: 'Kitchen sink & fittings', v: this.getF('unitKitchenSink', 'NA') },
      { n: '9', l: 'Plumbing', v: this.getF('unitPlumbing', 'NA') },
      { n: '10', l: 'Electrical', v: this.getF('unitElectrical', 'NA') },
      { n: '11', l: 'Actual area (carpet/SBU/saleable)', v: this.getF('unitActualArea', '4743 sqft') },
      { n: '12', l: 'Permitted area (carpet/SBU/saleable)', v: this.getF('unitPermittedArea', '4032 sqft') },
      { n: '13', l: 'Sale agreement area', v: this.getF('unitSaleAgreementArea', 'NA') },
      { n: '14', l: 'Adherence to sanction plan', v: this.getF('unitAdherencePlan', 'Adhered to plan') },
      { n: '15', l: 'Deviation observed', v: this.getF('unitDeviationObserved', 'Nil') },
      { n: '16', l: 'Risk of demolition', v: this.getF('unitDemolitionRisk', 'Low') },
      { n: '17', l: 'Occupied by', v: this.getF('unitOccupiedBy', 'Occupied by customer') },
      { n: '18', l: 'If self-occupied since when', v: this.getF('unitSelfOccupiedSince', '2025') },
    ];

    pCUnit.forEach(item => {
      this.drawTataRow(item.n, item.l, item.v);
    });

    this.advanceCursor(6);

    // ==========================================
    // PART "D" : ASSUMPTIONS, DATA AVAILABLE AND BASIS FOR VALUATION
    // ==========================================
    this.drawTataPartHeader('D', 'Assumptions, Data Available and Basis for Valuation');

    const pD = [
      { n: '1', l: 'Drawings and approvals', v: this.getF('drawingsAndApprovals', '') },
      { n: '2', l: 'Area considered for valuation', v: this.getF('areaConsideredValuation', '') },
      { n: '3', l: 'Age of building and future life', v: this.getF('ageFutureLife', '') },
      { n: '4', l: 'Present condition', v: this.getF('presentConditionBasis', 'Good') },
      { n: '5', l: 'Comments on specification', v: this.getF('commentsOnSpecificationBasis', 'RCC Roofing') },
      { n: '6', l: 'Market rates of properties in vicinity', v: this.getF('marketRatesVicinity', '') },
    ];

    pD.forEach(item => {
      this.drawTataRow(item.n, item.l, item.v);
    });

    this.advanceCursor(6);

    // ==========================================
    // PART "E" : CONCLUSION AND VALUATION OF THE PROPERTY
    // ==========================================
    this.drawTataPartHeader('E', 'Conclusion and Valuation of the Property');

    // Section 1: Flat Valuation Details (if applicable)
    const hasFlatValuation = Boolean(this.getF('flatFmvPerSqft') && this.getF('flatFmvPerSqft') !== 'NA');
    if (hasFlatValuation) {
      this.drawSubSectionHeader('1. DETAILS FOR FLAT VALUATION');
      const pEFlat = [
        { n: '1', l: 'FMV per sqft', v: this.getF('flatFmvPerSqft', 'NA') },
        { n: '2', l: 'Present replacement cost of flat', v: this.getF('flatReplacementCost', 'NA') },
        { n: '3', l: 'Depreciated value of flat', v: this.getF('flatDepreciatedValue', 'NA') },
        { n: '4', l: 'Life of building & validity of estimate', v: this.getF('flatLifeAndValidity', 'NA') },
        { n: '5', l: 'Deductions for repairs/maintenance', v: this.getF('flatRepairDeductions', 'NA') },
        { n: '6', l: 'Valuation of flat', v: this.getF('flatValuationTotal', 'NA') },
        { n: '7', l: 'Forced sale value', v: this.getF('flatForcedSaleValue', 'NA') },
        { n: '8', l: 'Insurance value', v: this.getF('flatInsuranceValue', 'NA') },
        { n: '9', l: 'Additional comments', v: this.getF('flatAdditionalComments', 'NA') },
      ];
      pEFlat.forEach(item => this.drawTataRow(item.n, item.l, item.v));
      this.advanceCursor(4);
    }

    // Section 2: Land and Building Valuation
    this.drawSubSectionHeader('DETAILS FOR LAND AND BUILDING VALUATION');

    const landArea = parseFloat(String(this.getF('landAreaSqft', 0)).replace(/,/g, '')) || 0;
    const recommendedLandRate = parseFloat(String(this.getF('recommendedLandRate', 0)).replace(/,/g, '')) || 0;
    const landValueA = parseFloat(String(this.getF('landValueA', landArea * recommendedLandRate)).replace(/,/g, '')) || (landArea * recommendedLandRate);

    const approvedBuaSqft = parseFloat(String(this.getF('approvedBuaSqft', 0)).replace(/,/g, '')) || 0;
    const constructionCostPerSqft = parseFloat(String(this.getF('constructionCostPerSqft', 0)).replace(/,/g, '')) || 0;
    const totalConstructionValueB = parseFloat(String(this.getF('totalConstructionValueB', approvedBuaSqft * constructionCostPerSqft)).replace(/,/g, '')) || (approvedBuaSqft * constructionCostPerSqft);

    const actualBuaSqft = parseFloat(String(this.getF('actualBuaSqft', 0)).replace(/,/g, '')) || 0;
    const totalMarketValue = parseFloat(String(this.getF('totalMarketValue', landValueA + totalConstructionValueB)).replace(/,/g, '')) || (landValueA + totalConstructionValueB);

    const forcedSaleValue = parseFloat(String(this.getF('forcedSaleValue', Math.round(totalMarketValue * 0.8))).replace(/,/g, '')) || Math.round(totalMarketValue * 0.8);
    const insuranceValue = parseFloat(String(this.getF('insuranceValue', Math.round(totalConstructionValueB * 0.85))).replace(/,/g, '')) || Math.round(totalConstructionValueB * 0.85);

    this.drawTataRow('1', 'Land Area', `${landArea.toLocaleString('en-IN')} sqft`);
    this.drawTataRow('2', 'Current Government Approved Rates', this.getF('govtApprovedLandRateText', `Rs.${this.getF('govtApprovedLandRate', '298')}/- per sqft of land`));
    this.drawTataRow('3', 'Recommended Rate and Basis of Recommendation', `Rs.${recommendedLandRate.toLocaleString('en-IN')}/- per sqft\nBasis: ${this.getF('basisRecommendation', '')}`);
    this.drawTataRow('4', 'Land value (A)', `Rs. ${formatIndianCurrency(landValueA)}/-`);
    this.drawTataRow('5', 'Approved BUA of Building (GF)', `${approvedBuaSqft.toLocaleString('en-IN')} sqft`);
    this.drawTataRow('6', 'Construction cost per sqft', `Rs. ${constructionCostPerSqft.toLocaleString('en-IN')}/- per sqft`);
    this.drawTataRow('7', 'Total value of construction RCC (B)', `Rs. ${formatIndianCurrency(totalConstructionValueB)}/-`);
    this.drawTataRow('8', 'Actual BUA of Building', `${actualBuaSqft.toLocaleString('en-IN')} sqft`);
    this.drawTataRow('9', 'Deviation if any', this.getF('deviationDetails', 'Nil'));
    this.drawTataRow('10', 'Construction value considered', this.getF('constructionValueConsideredText', `Approved BUA only (Rs. ${formatIndianCurrency(totalConstructionValueB)}/-)`));

    // Highlighted Summary Rows
    this.advanceCursor(2);
    this.drawKeyValueRow([
      {
        label: '11. Total Market value (A + B)',
        value: `Rs. ${formatIndianCurrency(totalMarketValue)}/-`,
        labelWidth: 220,
        valueWidth: CONTENT_W - 220,
        labelBold: true,
        valueBold: true,
        highlight: true,
      },
    ]);
    this.drawKeyValueRow([
      {
        label: '12. Forced sale value (80% of Market Value)',
        value: `Rs. ${formatIndianCurrency(forcedSaleValue)}/-`,
        labelWidth: 220,
        valueWidth: CONTENT_W - 220,
        labelBold: true,
        valueBold: true,
        highlight: true,
      },
    ]);
    this.drawKeyValueRow([
      {
        label: '13. Insurance Value (85% of Construction Value)',
        value: `Rs. ${formatIndianCurrency(insuranceValue)}/-`,
        labelWidth: 220,
        valueWidth: CONTENT_W - 220,
        labelBold: true,
        valueBold: true,
        highlight: true,
      },
    ]);

    // Financial in Words
    this.advanceCursor(4);
    this.drawKeyValueRow([
      {
        label: 'Valuation in Words (Market Value)',
        value: rupeesInWords(totalMarketValue),
        labelWidth: 220,
        valueWidth: CONTENT_W - 220,
        labelBold: true,
      },
    ]);
    this.drawKeyValueRow([
      {
        label: 'Forced Sale Value in Words',
        value: rupeesInWords(forcedSaleValue),
        labelWidth: 220,
        valueWidth: CONTENT_W - 220,
        labelBold: true,
      },
    ]);
    this.drawKeyValueRow([
      {
        label: 'Insurance Value in Words',
        value: rupeesInWords(insuranceValue),
        labelWidth: 220,
        valueWidth: CONTENT_W - 220,
        labelBold: true,
      },
    ]);

    this.advanceCursor(6);

    // ==========================================
    // REMARKS & DECLARATION
    // ==========================================
    this.drawSectionHeader('REMARKS & STATUTORY DECLARATION');

    // Remarks paragraph
    this.drawKeyValueRow([
      {
        label: 'Remarks',
        value: this.getF('synthesisRemarks', ''),
        labelWidth: 100,
        valueWidth: CONTENT_W - 100,
        labelBold: true,
      },
    ]);

    this.advanceCursor(4);
    this.drawSubSectionHeader('DECLARATION');

    const defaultDeclarations = [
      '1. The information provided in this valuation report is true and correct to the best of our knowledge and belief.',
      '2. The property was physically inspected by our authorized engineer/representative.',
      '3. I/We have no direct or indirect interest in the property valued, nor in any transaction involving this property.',
      '4. Our professional fee is not contingent upon the reporting of a predetermined value or direction in value that favors the cause of the client.',
      '5. The report has been prepared in accordance with professional valuation standards and guidelines prescribed by Tata Capital Ltd.',
      '6. The fair market value indicated is based on prevalent market rates of similar properties in the locality as on date of valuation.',
      '7. The valuation does not certify legal title or encumbrances, which must be independently verified by the bank\'s legal counsel.',
    ];

    const rawDecs = this.getF('statutoryDeclarations', defaultDeclarations.join('\n'));
    const decList = Array.isArray(rawDecs)
      ? rawDecs
      : String(rawDecs).split('\n').map(s => s.trim()).filter(Boolean);

    decList.forEach((dec: string) => {
      this.drawKeyValueRow([
        {
          label: dec,
          value: '',
          labelWidth: CONTENT_W,
          valueWidth: 0,
        },
      ]);
    });

    this.advanceCursor(10);
    this.checkPageBreak(70);

    const halfW = CONTENT_W / 2;
    const repDate = this.getF('reportDate', this.getF('inspectionDate', '03-11-2025'));
    const repPlace = this.getF('reportPlace', 'Bhubaneswar');

    this.drawKeyValueRow([
      {
        label: `Date: ${repDate}\nPlace: ${repPlace}`,
        value: `For: S Mohanty & Associates\n\n\n\nEr. Satyajit Mohanty\nApproved Valuer / Chartered Engineer\nRegd. No: CAT-I/18/1999-2000`,
        labelWidth: halfW,
        valueWidth: halfW,
        labelBold: true,
        valueBold: true,
      },
    ]);

    // ==========================================
    // ATTACHMENTS (DOCUMENTS, MAPS, PHOTOGRAPHS)
    // ==========================================
    if (this.fields.documentImages && this.fields.documentImages.length > 0) {
      await this.drawDocumentsGallery(this.fields.documentImages);
    }

    const maps = [
      ...(this.fields.locationMapImages || []),
      ...(this.fields.mouzaMapImages || []),
      ...(this.fields.sketchMapImages || []),
    ];
    if (maps.length > 0) {
      await this.drawMapGallery(maps, 'LOCATION SKETCH / ROUTE MAPS');
    }

    if (this.fields.propertyImages && this.fields.propertyImages.length > 0) {
      await this.drawPhotoGrid(this.fields.propertyImages);
    }
  }
}

export default PDFTataCapitalSMEBLGRenderer;
