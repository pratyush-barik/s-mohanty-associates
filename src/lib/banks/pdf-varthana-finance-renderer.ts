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
      { label: label, value: '', labelWidth: labelW, valueWidth: 0, labelBold: false },
      { label: value || 'NA', value: '', labelWidth: valW, valueWidth: 0, labelBold: boldVal },
    ]);
  }

  async drawContent(): Promise<void> {
    this.addPage();

    // Title & Ref / Date Header
    this.drawCenteredTitle('VALUATION REPORT', 14, true);
    this.advanceCursor(4);

    const halfW = CONTENT_W / 2;
    this.drawKeyValueRow([
      {
        label: `Ref: ${this.getF('refNo', this.projectCode || 'VER/02-20/04')}`,
        value: '',
        labelWidth: halfW,
        valueWidth: 0,
        labelBold: true,
      },
      {
        label: `Date: ${this.getF('valuationDate', '29/02/2020')}`,
        value: '',
        labelWidth: halfW,
        valueWidth: 0,
        labelBold: true,
      },
    ]);

    this.advanceCursor(2);
    this.drawKeyValueRow([
      { label: '01', value: '', labelWidth: 24, valueWidth: 0, labelBold: true },
      { label: "Valuer's Name", value: '', labelWidth: 160, valueWidth: 0 },
      { label: this.getF('valuerName', 'M/s. S MOHANTY ASSOCIATES'), value: '', labelWidth: CONTENT_W - 184, valueWidth: 0, labelBold: true },
    ]);

    // ==========================================
    // 1. APPLICATION DETAILS
    // ==========================================
    this.drawVarthanaSectionHeader('APPLICATION DETAILS:');

    this.drawNumberedRow('01', 'Name of the School', this.getF('schoolName', 'Regional College,Nimapada'), true);
    this.drawNumberedRow(
      '02',
      "Name of customer's representative who has come to show the property",
      this.getF('customerRepName', 'Mr. Srikant Kumar Samantray (Customer)')
    );
    this.drawNumberedRow('03', "Contact person's nos", this.getF('contactNos', 'Mr. Srikant Kumar Samantray, Mob-9861045563'));
    this.drawNumberedRow(
      '04',
      "Property owner's name",
      this.getF('ownerName', 'Mr. Srikant Kumar Samantray,\nS/O-Mahendra Kumar Samantray')
    );
    this.drawNumberedRow('05', 'Holding type', this.getF('holdingType', 'Free Hold / Lease Hold [Free Hold]'));
    this.drawNumberedRow('06', 'Property description', this.getF('propertyDescription', 'Institutional Premises'));
    this.drawNumberedRow('07', 'List of Documents provided for valuation purpose', this.getF('documentsProvided', 'Copy of Sale deed & approved plan'));
    this.drawNumberedRow(
      '08',
      'Sale deed, Layout plan copy & Building sanction plan details',
      this.getF('planAndDeedDetails', 'Sale deed No-Top up case\nLayout Plan No- Not Provided, Dated: NA\nApproved Building plan No- Top up case, Dated: NA')
    );
    this.drawNumberedRow('09', 'Within municipal limits/outskirts', this.getF('withinMunicipalLimits', 'Within Nimapada NAC Limit'));
    this.drawNumberedRow('10', 'Property usage actual', this.getF('propertyUsageActual', 'Institutional / School'));

    // Address Breakdown: As per documents / As per site
    const numW = 24;
    const labelW = 120;
    const subLabelW = 80;
    const valW = CONTENT_W - numW - labelW - subLabelW;

    this.drawKeyValueRow([
      { label: '11', value: '', labelWidth: numW, valueWidth: 0, labelBold: true },
      { label: 'Address of property', value: '', labelWidth: labelW, valueWidth: 0, labelBold: true },
      { label: 'As per documents', value: '', labelWidth: subLabelW, valueWidth: 0 },
      {
        label: this.getF(
          'addressAsPerDoc',
          'Hal Khata no-639,Hall Plot no-1949,Sabak Khata no-502,Sabak Plot no-1767(Area=AC.0.100Decs,Kisama-Sarada-2),Mouza-Andia,Tahasil-Nimapada,PS-Nimapada,Dist-Puri,Odisha,Pin-752106'
        ),
        value: '',
        labelWidth: valW,
        valueWidth: 0,
      },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: numW, valueWidth: 0 },
      { label: '', value: '', labelWidth: labelW, valueWidth: 0 },
      { label: 'As per site', value: '', labelWidth: subLabelW, valueWidth: 0 },
      {
        label: this.getF(
          'addressAtSite',
          'Hal Khata no-639,Hall Plot no-1949,Sabak Khata no-502,Sabak Plot no-1767(Area=AC.0.100Decs,Kisama-Sarada-2),Mouza-Andia,Tahasil-Nimapada,PS-Nimapada,Dist-Puri,Odisha,Pin-752106'
        ),
        value: '',
        labelWidth: valW,
        valueWidth: 0,
      },
    ]);

    this.drawNumberedRow('12', 'Landmark', this.getF('landmark', 'Near Petaghai Road,Nimapada'));
    this.drawNumberedRow(
      '13',
      'Location co-ordinates – Lat-long Co-ordinates from Google Earth / Google Maps',
      `Latitude:- ${this.getF('latitude', '20.063900')}, Longitude:- ${this.getF('longitude', '85.987783')}`
    );
    this.drawNumberedRow('14', 'Nature of the location', this.getF('natureOfLocation', 'Residential / Commercial / Agriculture / Institutional [Institutional]'));

    // Accessibility table row
    this.drawKeyValueRow([
      { label: '15', value: '', labelWidth: numW, valueWidth: 0, labelBold: true },
      { label: 'Accessibility', value: '', labelWidth: 120, valueWidth: 0, labelBold: true },
      { label: 'Existing Road width', value: '', labelWidth: 150, valueWidth: 0 },
      { label: this.getF('existingRoadWidth', "20'-00\" wide Road"), value: '', labelWidth: CONTENT_W - numW - 120 - 150, valueWidth: 0 },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: numW, valueWidth: 0 },
      { label: '', value: '', labelWidth: 120, valueWidth: 0 },
      { label: 'Site access/independent access', value: '', labelWidth: 150, valueWidth: 0 },
      { label: this.getF('siteAccessType', 'Independent access / Site through someone elses site [Independent access]'), value: '', labelWidth: CONTENT_W - numW - 120 - 150, valueWidth: 0 },
    ]);

    // Proximity to amenities
    this.drawKeyValueRow([
      { label: '16', value: '', labelWidth: numW, valueWidth: 0, labelBold: true },
      { label: 'Proximity to amenities (Specify how far is the property from...)', value: '', labelWidth: 200, valueWidth: 0, labelBold: true },
      { label: 'Post Office', value: '', labelWidth: 100, valueWidth: 0 },
      { label: this.getF('proximityPostOffice', '2 Kms'), value: '', labelWidth: CONTENT_W - numW - 200 - 100, valueWidth: 0 },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: numW, valueWidth: 0 },
      { label: '', value: '', labelWidth: 200, valueWidth: 0 },
      { label: 'Banks', value: '', labelWidth: 100, valueWidth: 0 },
      { label: this.getF('proximityBanks', '2 Kms'), value: '', labelWidth: CONTENT_W - numW - 200 - 100, valueWidth: 0 },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: numW, valueWidth: 0 },
      { label: '', value: '', labelWidth: 200, valueWidth: 0 },
      { label: 'Police Station', value: '', labelWidth: 100, valueWidth: 0 },
      { label: this.getF('proximityPoliceStation', '2 Kms'), value: '', labelWidth: CONTENT_W - numW - 200 - 100, valueWidth: 0 },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: numW, valueWidth: 0 },
      { label: '', value: '', labelWidth: 200, valueWidth: 0 },
      { label: 'Other amenities', value: '', labelWidth: 100, valueWidth: 0 },
      { label: this.getF('proximityOtherAmenities', 'All within 2 to 3 Kms'), value: '', labelWidth: CONTENT_W - numW - 200 - 100, valueWidth: 0 },
    ]);

    this.drawNumberedRow('17', 'Conversion order from Agri to Non Agri document details', this.getF('conversionOrderDetails', 'As per latest ROR all plots are not converted to Homestead'));
    this.drawNumberedRow('18', 'a) Risk of Hi-Tension Towers / Wires (What is the safe distance maintained)', this.getF('riskHiTension', 'No'));
    this.drawNumberedRow(' ', 'b) Risk of Water Body / Irrigation Canal / River (If yes, what is safe distance maintained)', this.getF('riskWaterBody', 'No'));

    // 19. Site boundaries table
    this.checkPageBreak(120);
    this.drawKeyValueRow([
      { label: '19', value: '', labelWidth: numW, valueWidth: 0, labelBold: true },
      { label: 'Site boundaries', value: '', labelWidth: 120, valueWidth: 0, labelBold: true },
      { label: 'EAST', value: '', labelWidth: (CONTENT_W - numW - 120) / 4, valueWidth: 0, labelBold: true },
      { label: 'WEST', value: '', labelWidth: (CONTENT_W - numW - 120) / 4, valueWidth: 0, labelBold: true },
      { label: 'NORTH', value: '', labelWidth: (CONTENT_W - numW - 120) / 4, valueWidth: 0, labelBold: true },
      { label: 'SOUTH', value: '', labelWidth: (CONTENT_W - numW - 120) / 4, valueWidth: 0, labelBold: true },
    ]);
    const bndColW = (CONTENT_W - numW - 120) / 4;
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: numW, valueWidth: 0 },
      { label: 'As per document', value: '', labelWidth: 120, valueWidth: 0 },
      { label: this.getF('bndDocEast', 'Plot no-1763'), value: '', labelWidth: bndColW, valueWidth: 0 },
      { label: this.getF('bndDocWest', 'Pratibha Chhatoi'), value: '', labelWidth: bndColW, valueWidth: 0 },
      { label: this.getF('bndDocNorth', 'Plot no-1771'), value: '', labelWidth: bndColW, valueWidth: 0 },
      { label: this.getF('bndDocSouth', 'Plot no-1766'), value: '', labelWidth: bndColW, valueWidth: 0 },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: numW, valueWidth: 0 },
      { label: 'As per site', value: '', labelWidth: 120, valueWidth: 0 },
      { label: this.getF('bndSiteEast', 'Self land & Main Road'), value: '', labelWidth: bndColW, valueWidth: 0 },
      { label: this.getF('bndSiteWest', 'College Building'), value: '', labelWidth: bndColW, valueWidth: 0 },
      { label: this.getF('bndSiteNorth', 'Pvt. Road(Self)'), value: '', labelWidth: bndColW, valueWidth: 0 },
      { label: this.getF('bndSiteSouth', '20-feet wide Nala'), value: '', labelWidth: bndColW, valueWidth: 0 },
    ]);

    this.drawNumberedRow('20', 'Property identification', this.getF('propertyIdentification', 'Easy / Difficult / Valuer identified / Customer representative Identified [Customer representative Identified]'));
    this.drawNumberedRow('21', 'Sanction plan details', this.getF('sanctionPlanDetails', 'Plan has been approved by executive officer,NAC Nimapada'));
    this.drawNumberedRow('22', 'Sanctioned floors', this.getF('sanctionedFloors', 'G+1'));
    this.drawNumberedRow('23', 'Constructed upto floors', this.getF('constructedUptoFloors', 'G+1'));
    this.drawNumberedRow('24', 'Sanctioned area', this.getF('sanctionedArea', 'GF-4000sqft\nFF-4000sqft\nTotal=8000sqft'), true);
    this.drawNumberedRow('25', 'Constructed area at site', this.getF('constructedAreaAtSite', 'GF-4212sqft,\nFF-4212sqft\nTotal=8424sqft'), true);
    this.drawNumberedRow('26', 'FAR deviation %', this.getF('farDeviationPercent', '5%'));
    this.drawNumberedRow('27', 'Setback deviation comments, if any', this.getF('setbackDeviationComments', '96% plot coverage'));
    this.drawNumberedRow('28', 'No. of units sanctioned', this.getF('noOfUnitsSanctioned', 'NA'));
    this.drawNumberedRow('29', 'No. of units constructed', this.getF('noOfUnitsConstructed', 'NA'));
    this.drawNumberedRow('30', 'Can the deviation be regularized?', this.getF('deviationRegularized', 'NA'));
    this.drawNumberedRow('31', 'If yes, how?', this.getF('deviationRegularizedHow', 'NA'));

    // ==========================================
    // 2. TECHNICAL DETAILS
    // ==========================================
    this.checkPageBreak(140);
    this.drawVarthanaSectionHeader('TECHNICAL DETAILS');

    this.drawNumberedRow('01', 'Type of property', this.getF('typeOfProperty', 'Residential / Commercial / Institutional/ Agriculture land [Institutional]'));
    this.drawNumberedRow('02', 'No. of stories', this.getF('noOfStories', '2'));
    this.drawNumberedRow('03', 'Tenement position', this.getF('tenementPosition', 'Self Occupied'));
    this.drawNumberedRow('04', 'Construction type', this.getF('constructionType', 'R.C.C framed structure / Load Bearing Structure / AC sheet roofing / Others [R.C.C framed structure]'));
    this.drawNumberedRow('05', 'No. of lifts, if any', this.getF('noOfLifts', 'Nil'));
    this.drawNumberedRow('06', 'Occupancy status', this.getF('occupancyStatus', 'Self-owned / Rented [Self-owned]'));
    this.drawNumberedRow('07', 'No. of Occupants', this.getF('noOfOccupants', '1 (Regional College)'));
    this.drawNumberedRow('08', 'Details of commercial usage, if any.', this.getF('commercialUsageDetails', 'NA'));

    // Finishes rows
    this.drawKeyValueRow([
      { label: '09', value: '', labelWidth: numW, valueWidth: 0, labelBold: true },
      { label: 'Finishes.', value: '', labelWidth: 120, valueWidth: 0, labelBold: true },
      { label: 'Exterior', value: '', labelWidth: 100, valueWidth: 0 },
      { label: this.getF('finishExterior', 'Good'), value: '', labelWidth: CONTENT_W - numW - 120 - 100, valueWidth: 0 },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: numW, valueWidth: 0 },
      { label: '', value: '', labelWidth: 120, valueWidth: 0 },
      { label: 'Wall finish', value: '', labelWidth: 100, valueWidth: 0 },
      { label: this.getF('finishWall', 'Good'), value: '', labelWidth: CONTENT_W - numW - 120 - 100, valueWidth: 0 },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: numW, valueWidth: 0 },
      { label: '', value: '', labelWidth: 120, valueWidth: 0 },
      { label: 'Flooring', value: '', labelWidth: 100, valueWidth: 0 },
      { label: this.getF('finishFlooring', 'Tile flooring'), value: '', labelWidth: CONTENT_W - numW - 120 - 100, valueWidth: 0 },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: numW, valueWidth: 0 },
      { label: '', value: '', labelWidth: 120, valueWidth: 0 },
      { label: 'Door/Window', value: '', labelWidth: 100, valueWidth: 0 },
      { label: this.getF('finishDoorWindow', 'Hard wood door & windows'), value: '', labelWidth: CONTENT_W - numW - 120 - 100, valueWidth: 0 },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: numW, valueWidth: 0 },
      { label: '', value: '', labelWidth: 120, valueWidth: 0 },
      { label: 'Fittings', value: '', labelWidth: 100, valueWidth: 0 },
      { label: this.getF('finishFittings', 'Good Quality'), value: '', labelWidth: CONTENT_W - numW - 120 - 100, valueWidth: 0 },
    ]);

    this.drawNumberedRow('10', 'Total permissible area', this.getF('totalPermissibleArea', '8000sqft'), true);
    this.drawNumberedRow('11', 'Total constructed area', this.getF('totalConstructedArea', '8424sqft'), true);
    this.drawNumberedRow('12', 'Land area', this.getF('landArea', '4356sqft (AC.0.100Decs)'), true);

    // 13. Floor-wise area table
    this.checkPageBreak(100);
    const floorHdr = ['Floor-wise area', 'Basement', 'Ground floor', 'First floor', 'Second floor', 'Third floor', 'Fourth floor'];
    const floorRows = [
      [
        'Constructed area',
        this.getF('floorConstBasement', 'NA'),
        this.getF('floorConstGF', '4212 sqft'),
        this.getF('floorConstFF', '4212 sqft'),
        this.getF('floorConstSF', 'NA'),
        this.getF('floorConstTF', 'NA'),
        this.getF('floorConstFourth', 'NA'),
      ],
      [
        'Permissible area',
        this.getF('floorPermBasement', 'NA'),
        this.getF('floorPermGF', '4000 sqft'),
        this.getF('floorPermFF', '4000 sqft'),
        this.getF('floorPermSF', 'NA'),
        this.getF('floorPermTF', 'NA'),
        this.getF('floorPermFourth', 'NA'),
      ],
    ];
    this.drawDataTable(floorHdr, floorRows, 9);

    // ==========================================
    // 3. COMPLETION STATUS
    // ==========================================
    this.advanceCursor(4);
    this.drawVarthanaSectionHeader('COMPLETION STATUS:');
    this.drawNumberedRow('01', 'Stage of construction', this.getF('stageOfConstruction', '100%'));
    this.drawNumberedRow('02', 'Age of the property', this.getF('ageOfProperty', 'GF-5-Years, FF-Recently Constructed'));
    this.drawNumberedRow('03', 'Residual age', this.getF('residualAge', '70-Years'));

    // ==========================================
    // 4. VALUATION
    // ==========================================
    this.checkPageBreak(140);
    this.drawVarthanaSectionHeader('VALUATION:');

    const landAreaVal = this.getF('valLandArea', '4356sqft');
    const landRateVal = this.getF('valLandRate', 'Rs.400/-');
    const landTotalVal = this.getF('valLandTotal', 'Rs.17,42,400/-');

    const constAreaVal = this.getF('valConstArea', '8000Sqfts');
    const constRateVal = this.getF('valConstRate', 'Rs.1300/-');
    const constTotalVal = this.getF('valConstTotal', 'Rs.1,04,00,000/-');

    const depPercent = this.getF('valDepPercent', '6%');
    const depAmount = this.getF('valDepAmount', '6,24,000/-');
    const presentValAfterDep = this.getF('valPresentAfterDep', 'Rs.97,76,000/-');
    const totalValuation = this.getF('valTotalValue', 'Rs.1,15,18,400/-');

    const valHeaders = ['Details', 'Area', 'Rate (In Rs.)', 'Total amount (In Rs.)'];
    const valRows = [
      ['Land', landAreaVal, landRateVal, landTotalVal],
      ['Construction – (G+1,RCC,Tile Flooring)', constAreaVal, constRateVal, constTotalVal],
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

    this.drawNumberedRow('02', 'Value as per Government rates', this.getF('govtRateValue', 'NA'));
    this.drawNumberedRow(
      '03',
      'Forced market value',
      `${this.getF('forcedMarketPercent', '75% of the market value')}   ${this.getF('forcedMarketValue', 'Rs.86,38,800/-')}`,
      true
    );
    this.drawNumberedRow('04', 'Is this property earlier valued by you?', this.getF('earlierValued', 'No'));
    this.drawNumberedRow('05', 'Is the property under any demolition risk', this.getF('demolitionRisk', 'No'));
    this.drawNumberedRow('06', 'Comments on marketability', this.getF('marketabilityComments', 'High / Medium / Low [High]'));
    this.drawNumberedRow('07', 'Any other adverse remarks', this.getF('adverseRemarks', 'NA'));

    // ==========================================
    // 6. DECLARATION / REMARKS
    // ==========================================
    this.checkPageBreak(160);
    this.drawVarthanaSectionHeader('DECLARATION / REMARKS:');

    this.drawNumberedRow('01', 'Inspection Declaration', `The property is physically inspected by us on ${this.getF('valuationDate', '29/02/2020')}`);
    this.drawNumberedRow('02', 'Interest Declaration', 'We have no direct/indirect interest in the property valued.');
    this.drawNumberedRow('03', 'Accuracy Declaration', 'The information furnished above is true & correct to the best of our knowledge and belief and takes account as per the document produced before us and the property as shown to us by the client.');
    this.drawNumberedRow('04', 'Legal & Title Notice', 'The ownership papers/sale deeds may please be verified at your end to ascertain the right title and area. Needless to mention that, exactness of existence of the property is a legal matter and We don’t have exercised over the matter.However, We assess the property value,as identified by the representative of the owner/Financer,on absolute good faith.');
    this.drawNumberedRow('05', 'Market Feedback Clause', 'The fair market value indicated in the report is an opinion of the value prevailing on the date of the said report and is based on market feedback on values of similar properties. The client is free to obtain other independent opinions on the same.The fair market value of such properties/localities may increase or decrease depending on the future market conditions and scenarios.This report does not certify or confirm any ownership or title of the property that has been valued.');

    const defaultRemarks =
      'REMARKS:- Subject property is a G+1 institutional building land extent of AC.0.100sqft (4356sqft),whose GF was constructed about 6-years back. Plan has been approved by executive officer Nimapada NAC for G+1 institutional building Property located in developing area of Nimapada NAC & all civic amenities are present within 1-2Kms. Valuation has been done for land and approved built up area of G+1 building only. In sale deed boundaries there is no provision for road but at site there is a 15-feet wide access pvt. road available at site. Customer has submitted Amin report for perusal. Detailed Amin sketch map & boundary declaration affidavit to be documented for access road details.';
    this.drawNumberedRow('06', 'Remarks & Observations', this.getF('remarks', defaultRemarks));

    this.advanceCursor(8);
    this.drawKeyValueRow([
      {
        label: `PLACE: ${this.getF('place', 'Bhubaneswar')}\nDate: ${this.getF('valuationDate', '29/02/2020')}`,
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
