import {
  PDFBankRenderer,
  CONTENT_W,
} from '../pdf-bank-renderer';
import { formatIndianCurrency, rupeesInWords } from '../numberToWords';

export class PDFVarthanaFinanceRenderer extends PDFBankRenderer {
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

  async render(): Promise<Uint8Array> {
    await this.init();
    await this.drawContent();
    return await this.save();
  }

  private drawVarthanaSectionHeader(title: string) {
    this.drawSectionHeader(title);
  }

  private drawNumberedRow(num: string, label: string, value: string, boldVal: boolean = false) {
    const numW = 24;
    const labelW = 190;
    const valW = CONTENT_W - numW - labelW;

    this.drawKeyValueRow([
      { label: num, value: '', labelWidth: numW, valueWidth: 0, labelBold: true },
      { label: label, value: value || 'NA', labelWidth: labelW, valueWidth: valW, labelBold: false, bold: boldVal },
    ]);
  }

  async drawContent(): Promise<void> {
    // NOTE: init() already adds page 1. Do NOT call this.addPage() here.

    // Title & Ref / Date Header
    this.drawCenteredTitle('VALUATION REPORT', 14, true);
    this.advanceCursor(4);

    const halfW = CONTENT_W / 2;
    this.drawKeyValueRow([
      {
        label: 'Ref:',
        value: this.getF('refNo', this.projectCode || ''),
        labelWidth: 40,
        valueWidth: halfW - 40,
        labelBold: true,
        bold: true,
      },
      {
        label: 'Date:',
        value: this.getF('valuationDate', ''),
        labelWidth: 40,
        valueWidth: halfW - 40,
        labelBold: true,
        bold: true,
      },
    ]);

    this.advanceCursor(2);
    this.drawKeyValueRow([
      { label: '01', value: '', labelWidth: 24, valueWidth: 0, labelBold: true },
      { label: "Valuer's Name", value: this.getF('valuerName', 'M/s. S MOHANTY ASSOCIATES'), labelWidth: 160, valueWidth: CONTENT_W - 184, labelBold: false, bold: true },
    ]);

    // ==========================================
    // 1. APPLICATION DETAILS
    // ==========================================
    this.drawVarthanaSectionHeader('APPLICATION DETAILS:');

    this.drawNumberedRow('01', 'Name of the School', this.getF('schoolName', ''), true);
    this.drawNumberedRow(
      '02',
      "Name of customer's representative who has come to show the property",
      this.getF('customerRepName', '')
    );
    this.drawNumberedRow('03', "Contact person's nos", this.getF('contactNos', ''));
    this.drawNumberedRow(
      '04',
      "Property owner's name",
      this.getF('ownerName', '')
    );
    this.drawNumberedRow('05', 'Holding type', this.getF('holdingType', 'Free Hold'));
    this.drawNumberedRow('06', 'Property description', this.getF('propertyDescription', ''));
    this.drawNumberedRow('07', 'List of Documents provided for valuation purpose', this.getF('documentsProvided', ''));
    this.drawNumberedRow(
      '08',
      'Sale deed, Layout plan copy & Building sanction plan details',
      this.getF('planAndDeedDetails', '')
    );
    this.drawNumberedRow('09', 'Within municipal limits/outskirts', this.getF('withinMunicipalLimits', ''));
    this.drawNumberedRow('10', 'Property usage actual', this.getF('propertyUsageActual', ''));

    // Address Breakdown: As per documents / As per site
    const numW = 24;
    const labelW = 120;
    const subLabelW = 90;
    const valW = CONTENT_W - numW - labelW - subLabelW;

    this.drawKeyValueRow([
      { label: '11', value: '', labelWidth: numW, valueWidth: 0, labelBold: true },
      { label: 'Address of property', value: '', labelWidth: labelW, valueWidth: 0, labelBold: true },
      { label: 'As per documents', value: this.getF('addressAsPerDoc', ''), labelWidth: subLabelW, valueWidth: valW },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: numW, valueWidth: 0 },
      { label: '', value: '', labelWidth: labelW, valueWidth: 0 },
      { label: 'As per site', value: this.getF('addressAtSite', ''), labelWidth: subLabelW, valueWidth: valW },
    ]);

    this.drawNumberedRow('12', 'Landmark', this.getF('landmark', ''));
    this.drawNumberedRow(
      '13',
      'Location co-ordinates – Lat-long Co-ordinates from Google Earth / Google Maps',
      `Latitude:- ${this.getF('latitude', '')}, Longitude:- ${this.getF('longitude', '')}`
    );
    this.drawNumberedRow('14', 'Nature of the location', this.getF('natureOfLocation', ''));

    // Accessibility table row
    this.drawKeyValueRow([
      { label: '15', value: '', labelWidth: numW, valueWidth: 0, labelBold: true },
      { label: 'Accessibility', value: '', labelWidth: 120, valueWidth: 0, labelBold: true },
      { label: 'Existing Road width', value: this.getF('existingRoadWidth', ''), labelWidth: 150, valueWidth: CONTENT_W - numW - 120 - 150 },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: numW, valueWidth: 0 },
      { label: '', value: '', labelWidth: 120, valueWidth: 0 },
      { label: 'Site access/independent access', value: this.getF('siteAccessType', ''), labelWidth: 150, valueWidth: CONTENT_W - numW - 120 - 150 },
    ]);

    // Proximity to amenities
    this.drawKeyValueRow([
      { label: '16', value: '', labelWidth: numW, valueWidth: 0, labelBold: true },
      { label: 'Proximity to amenities (Specify how far is the property from...)', value: '', labelWidth: 200, valueWidth: 0, labelBold: true },
      { label: 'Post Office', value: this.getF('proximityPostOffice', ''), labelWidth: 100, valueWidth: CONTENT_W - numW - 200 - 100 },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: numW, valueWidth: 0 },
      { label: '', value: '', labelWidth: 200, valueWidth: 0 },
      { label: 'Banks', value: this.getF('proximityBanks', ''), labelWidth: 100, valueWidth: CONTENT_W - numW - 200 - 100 },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: numW, valueWidth: 0 },
      { label: '', value: '', labelWidth: 200, valueWidth: 0 },
      { label: 'Police Station', value: this.getF('proximityPoliceStation', ''), labelWidth: 100, valueWidth: CONTENT_W - numW - 200 - 100 },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: numW, valueWidth: 0 },
      { label: '', value: '', labelWidth: 200, valueWidth: 0 },
      { label: 'Other amenities', value: this.getF('proximityOtherAmenities', ''), labelWidth: 100, valueWidth: CONTENT_W - numW - 200 - 100 },
    ]);

    this.drawNumberedRow('17', 'Conversion order from Agri to Non Agri document details', this.getF('conversionOrderDetails', ''));
    this.drawNumberedRow('18', 'a) Risk of Hi-Tension Towers / Wires (What is the safe distance maintained)', this.getF('riskHiTension', 'No'));
    this.drawNumberedRow(' ', 'b) Risk of Water Body / Irrigation Canal / River (If yes, what is safe distance maintained)', this.getF('riskWaterBody', 'No'));

    // 19. Site boundaries table
    this.checkPageBreak(120);
    const bndColW = (CONTENT_W - numW - 120) / 4;
    this.drawKeyValueRow([
      { label: '19', value: '', labelWidth: numW, valueWidth: 0, labelBold: true },
      { label: 'Site boundaries', value: '', labelWidth: 120, valueWidth: 0, labelBold: true },
      { label: 'EAST', value: '', labelWidth: bndColW, valueWidth: 0, labelBold: true },
      { label: 'WEST', value: '', labelWidth: bndColW, valueWidth: 0, labelBold: true },
      { label: 'NORTH', value: '', labelWidth: bndColW, valueWidth: 0, labelBold: true },
      { label: 'SOUTH', value: '', labelWidth: bndColW, valueWidth: 0, labelBold: true },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: numW, valueWidth: 0 },
      { label: 'As per document', value: '', labelWidth: 120, valueWidth: 0 },
      { label: '', value: this.getF('bndDocEast', ''), labelWidth: 0, valueWidth: bndColW },
      { label: '', value: this.getF('bndDocWest', ''), labelWidth: 0, valueWidth: bndColW },
      { label: '', value: this.getF('bndDocNorth', ''), labelWidth: 0, valueWidth: bndColW },
      { label: '', value: this.getF('bndDocSouth', ''), labelWidth: 0, valueWidth: bndColW },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: numW, valueWidth: 0 },
      { label: 'As per site', value: '', labelWidth: 120, valueWidth: 0 },
      { label: '', value: this.getF('bndSiteEast', ''), labelWidth: 0, valueWidth: bndColW },
      { label: '', value: this.getF('bndSiteWest', ''), labelWidth: 0, valueWidth: bndColW },
      { label: '', value: this.getF('bndSiteNorth', ''), labelWidth: 0, valueWidth: bndColW },
      { label: '', value: this.getF('bndSiteSouth', ''), labelWidth: 0, valueWidth: bndColW },
    ]);

    this.drawNumberedRow('20', 'Property identification', this.getF('propertyIdentification', ''));
    this.drawNumberedRow('21', 'Sanction plan details', this.getF('sanctionPlanDetails', ''));
    this.drawNumberedRow('22', 'Sanctioned floors', this.getF('sanctionedFloors', ''));
    this.drawNumberedRow('23', 'Constructed upto floors', this.getF('constructedUptoFloors', ''));
    this.drawNumberedRow('24', 'Sanctioned area', this.getF('sanctionedArea', ''), true);
    this.drawNumberedRow('25', 'Constructed area at site', this.getF('constructedAreaAtSite', ''), true);
    this.drawNumberedRow('26', 'FAR deviation %', this.getF('farDeviationPercent', ''));
    this.drawNumberedRow('27', 'Setback deviation comments, if any', this.getF('setbackDeviationComments', ''));
    this.drawNumberedRow('28', 'No. of units sanctioned', this.getF('noOfUnitsSanctioned', ''));
    this.drawNumberedRow('29', 'No. of units constructed', this.getF('noOfUnitsConstructed', ''));
    this.drawNumberedRow('30', 'Can the deviation be regularized?', this.getF('deviationRegularized', ''));
    this.drawNumberedRow('31', 'If yes, how?', this.getF('deviationRegularizedHow', ''));

    // ==========================================
    // 2. TECHNICAL DETAILS
    // ==========================================
    this.checkPageBreak(140);
    this.drawVarthanaSectionHeader('TECHNICAL DETAILS');

    this.drawNumberedRow('01', 'Type of property', this.getF('typeOfProperty', ''));
    this.drawNumberedRow('02', 'No. of stories', this.getF('noOfStories', ''));
    this.drawNumberedRow('03', 'Tenement position', this.getF('tenementPosition', ''));
    this.drawNumberedRow('04', 'Construction type', this.getF('constructionType', ''));
    this.drawNumberedRow('05', 'No. of lifts, if any', this.getF('noOfLifts', ''));
    this.drawNumberedRow('06', 'Occupancy status', this.getF('occupancyStatus', ''));
    this.drawNumberedRow('07', 'No. of Occupants', this.getF('noOfOccupants', ''));
    this.drawNumberedRow('08', 'Details of commercial usage, if any.', this.getF('commercialUsageDetails', ''));

    // Finishes rows
    this.drawKeyValueRow([
      { label: '09', value: '', labelWidth: numW, valueWidth: 0, labelBold: true },
      { label: 'Finishes.', value: '', labelWidth: 120, valueWidth: 0, labelBold: true },
      { label: 'Exterior', value: this.getF('finishExterior', ''), labelWidth: 100, valueWidth: CONTENT_W - numW - 120 - 100 },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: numW, valueWidth: 0 },
      { label: '', value: '', labelWidth: 120, valueWidth: 0 },
      { label: 'Wall finish', value: this.getF('finishWall', ''), labelWidth: 100, valueWidth: CONTENT_W - numW - 120 - 100 },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: numW, valueWidth: 0 },
      { label: '', value: '', labelWidth: 120, valueWidth: 0 },
      { label: 'Flooring', value: this.getF('finishFlooring', ''), labelWidth: 100, valueWidth: CONTENT_W - numW - 120 - 100 },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: numW, valueWidth: 0 },
      { label: '', value: '', labelWidth: 120, valueWidth: 0 },
      { label: 'Door/Window', value: this.getF('finishDoorWindow', ''), labelWidth: 100, valueWidth: CONTENT_W - numW - 120 - 100 },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: numW, valueWidth: 0 },
      { label: '', value: '', labelWidth: 120, valueWidth: 0 },
      { label: 'Fittings', value: this.getF('finishFittings', ''), labelWidth: 100, valueWidth: CONTENT_W - numW - 120 - 100 },
    ]);

    this.drawNumberedRow('10', 'Total permissible area', this.getF('totalPermissibleArea', ''), true);
    this.drawNumberedRow('11', 'Total constructed area', this.getF('totalConstructedArea', ''), true);
    this.drawNumberedRow('12', 'Land area', this.getF('landArea', ''), true);

    // 13. Floor-wise area table
    this.checkPageBreak(100);
    const floorHdr = ['Floor-wise area', 'Basement', 'Ground floor', 'First floor', 'Second floor', 'Third floor', 'Fourth floor'];
    const floorRows = [
      [
        'Constructed area',
        this.getF('floorConstBasement', ''),
        this.getF('floorConstGF', ''),
        this.getF('floorConstFF', ''),
        this.getF('floorConstSF', ''),
        this.getF('floorConstTF', ''),
        this.getF('floorConstFourth', ''),
      ],
      [
        'Permissible area',
        this.getF('floorPermBasement', ''),
        this.getF('floorPermGF', ''),
        this.getF('floorPermFF', ''),
        this.getF('floorPermSF', ''),
        this.getF('floorPermTF', ''),
        this.getF('floorPermFourth', ''),
      ],
    ];
    this.drawDataTable(floorHdr, floorRows, 9);

    // ==========================================
    // 3. COMPLETION STATUS
    // ==========================================
    this.advanceCursor(4);
    this.drawVarthanaSectionHeader('COMPLETION STATUS:');
    this.drawNumberedRow('01', 'Stage of construction', this.getF('stageOfConstruction', ''));
    this.drawNumberedRow('02', 'Age of the property', this.getF('ageOfProperty', ''));
    this.drawNumberedRow('03', 'Residual age', this.getF('residualAge', ''));

    // ==========================================
    // 4. VALUATION
    // ==========================================
    this.checkPageBreak(140);
    this.drawVarthanaSectionHeader('VALUATION:');

    const landAreaVal = this.getF('valLandArea', '');
    const landRateVal = this.getF('valLandRate', '');
    const landTotalVal = this.getF('valLandTotal', '');

    const constAreaVal = this.getF('valConstArea', '');
    const constRateVal = this.getF('valConstRate', '');
    const constTotalVal = this.getF('valConstTotal', '');

    const depPercent = this.getF('valDepPercent', '');
    const depAmount = this.getF('valDepAmount', '');
    const presentValAfterDep = this.getF('valPresentAfterDep', '');
    const totalValuation = this.getF('valTotalValue', '');

    const valHeaders = ['Details', 'Area', 'Rate (In Rs.)', 'Total amount (In Rs.)'];
    const valRows = [
      ['Land', landAreaVal, landRateVal, landTotalVal],
      ['Construction', constAreaVal, constRateVal, constTotalVal],
      ['Depreciation of the building', depPercent, '', depAmount],
      ['Present value after depreciation value', '', '', presentValAfterDep],
      ['Total value', '', '', totalValuation],
    ];
    this.drawDataTable(valHeaders, valRows, 9);

    // ==========================================
    // 5. NET MORTGAGABLE VALUATION
    // ==========================================
    this.advanceCursor(4);
    this.drawVarthanaSectionHeader('NET MORTGAGABLE VALUATION:');

    this.drawNumberedRow('02', 'Value as per Government rates', this.getF('govtRateValue', ''));
    this.drawNumberedRow(
      '03',
      'Forced market value',
      `${this.getF('forcedMarketPercent', '75% of the market value')}   ${this.getF('forcedMarketValue', '')}`.trim(),
      true
    );
    this.drawNumberedRow('04', 'Is this property earlier valued by you?', this.getF('earlierValued', 'No'));
    this.drawNumberedRow('05', 'Is the property under any demolition risk', this.getF('demolitionRisk', 'No'));
    this.drawNumberedRow('06', 'Comments on marketability', this.getF('marketabilityComments', ''));
    this.drawNumberedRow('07', 'Any other adverse remarks', this.getF('adverseRemarks', ''));

    // ==========================================
    // 6. DECLARATION / REMARKS
    // ==========================================
    this.checkPageBreak(160);
    this.drawVarthanaSectionHeader('DECLARATION / REMARKS:');

    this.drawNumberedRow('01', 'Inspection Declaration', `The property is physically inspected by us on ${this.getF('valuationDate', '')}`);
    this.drawNumberedRow('02', 'Interest Declaration', 'We have no direct/indirect interest in the property valued.');
    this.drawNumberedRow('03', 'Accuracy Declaration', 'The information furnished above is true & correct to the best of our knowledge and belief and takes account as per the document produced before us and the property as shown to us by the client.');
    this.drawNumberedRow('04', 'Legal & Title Notice', 'The ownership papers/sale deeds may please be verified at your end to ascertain the right title and area. Needless to mention that, exactness of existence of the property is a legal matter and We don’t have exercised over the matter.However, We assess the property value,as identified by the representative of the owner/Financer,on absolute good faith.');
    this.drawNumberedRow('05', 'Market Feedback Clause', 'The fair market value indicated in the report is an opinion of the value prevailing on the date of the said report and is based on market feedback on values of similar properties. The client is free to obtain other independent opinions on the same.The fair market value of such properties/localities may increase or decrease depending on the future market conditions and scenarios.This report does not certify or confirm any ownership or title of the property that has been valued.');

    this.drawNumberedRow('06', 'Remarks & Observations', this.getF('remarks', ''));

    this.advanceCursor(8);
    this.drawKeyValueRow([
      {
        label: `PLACE: ${this.getF('place', 'Bhubaneswar')}\nDate: ${this.getF('valuationDate', '')}`,
        value: '',
        labelWidth: halfW,
        valueWidth: 0,
        labelBold: true,
      },
      {
        label: `For M/S S MOHANTY ASSOCIATES\n\n\nAuthorized Signatory`,
        value: '',
        labelWidth: halfW,
        valueWidth: 0,
        labelBold: true,
      },
    ]);

    // ==========================================
    // 7. AMIN SKETCH-MAP & LOCATION MAPS
    // ==========================================
    const maps = [
      ...(this.fields.locationMapImages || []),
      ...(this.fields.sketchMapImages || []),
      ...(this.fields.mouzaMapImages || []),
      ...(this.fields.cadastralMapImages || []),
      ...(this.fields.maps || []),
    ];
    if (maps && maps.length > 0) {
      await this.drawMapGallery(maps, 'AMIN SKETCH-MAP / LOCATION PLAN');
    }

    // ==========================================
    // 8. VERIFIED DOCUMENTS
    // ==========================================
    const docs = this.fields.documentImages || this.fields.documents || [];
    if (docs && docs.length > 0) {
      await this.drawDocumentsGallery(docs);
    }

    // ==========================================
    // 9. SITE PHOTOGRAPHS
    // ==========================================
    const photos = this.fields.propertyImages || this.fields.photos || [];
    if (photos && photos.length > 0) {
      await this.drawPhotoGrid(photos, 'PROPERTY SITE PHOTOGRAPHS');
    }
  }
}
