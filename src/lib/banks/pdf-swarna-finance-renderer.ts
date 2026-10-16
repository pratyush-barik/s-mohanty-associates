import {
  PDFBankRenderer,
  CONTENT_W,
  FONT_SIZE,
  FONT_SIZE_HEADER,
  FONT_SIZE_TITLE,
  BORDER_W,
} from '../pdf-bank-renderer';
import { rgb } from 'pdf-lib';
import { formatIndianCurrency, rupeesInWords } from '../numberToWords';
import {
  parseSafeFloat,
  multiplyExactDecimals,
  sumDecimals,
  calculatePercentageValue,
} from '../bank-input-constraints';

export class PDFSwarnaFinanceRenderer extends PDFBankRenderer {
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

  private drawSwarnaSectionHeader(code: string, title: string) {
    this.checkPageBreak(26);
    this.drawKeyValueRow([
      {
        label: `${code}`,
        value: title.toUpperCase(),
        labelWidth: 32,
        valueWidth: CONTENT_W - 32,
        labelBold: true,
        valueBold: true,
        highlight: true,
      },
    ]);
  }

  private drawSwarnaRow(num: string | number, label: string, val: string, labelW: number = 230) {
    this.checkPageBreak(20);
    const labelText = num ? `${num}  ${label}` : label;
    this.drawKeyValueRow([
      {
        label: labelText,
        value: val || 'NA',
        labelWidth: labelW,
        valueWidth: CONTENT_W - labelW,
      },
    ]);
  }

  async drawContent(): Promise<void> {
    // ═══════════════════════════════════════════════
    // TOP HEADER
    // ═══════════════════════════════════════════════
    const refNo = this.getF('refNo', 'SPHM/2023-24/01');
    const refDate = this.getF('refDate', this.getF('reportDate', '19/04/2023'));

    this.drawKeyValueRow([
      {
        label: `Ref no- ${refNo}  Date- ${refDate}`,
        value: '',
        labelWidth: CONTENT_W,
        valueWidth: 0,
        labelBold: true,
      },
    ]);

    this.advanceCursor(2);

    // Table Header Row
    this.drawKeyValueRow([
      {
        label: 'Items Descriptions',
        value: 'Descriptor',
        labelWidth: 230,
        valueWidth: CONTENT_W - 230,
        labelBold: true,
        valueBold: true,
        highlight: true,
      },
    ]);

    // ═══════════════════════════════════════════════
    // A: SUBJECT
    // ═══════════════════════════════════════════════
    this.drawKeyValueRow([
      { label: 'A', value: 'Subject', labelWidth: 32, valueWidth: 198, labelBold: true, valueBold: true },
      {
        label: '',
        value: this.getF(
          'subjectText',
          'Valuation report for House no.- NA, Ward no.-NA ,village- Bija Bahali,Teh.-Puintala, Dist- Bolangir'
        ),
        labelWidth: 0,
        valueWidth: CONTENT_W - 230,
      },
    ]);

    // ═══════════════════════════════════════════════
    // B: PURPOSE OF VALUATION
    // ═══════════════════════════════════════════════
    this.drawKeyValueRow([
      { label: 'B', value: 'PURPOSE OF VALUATION', labelWidth: 32, valueWidth: 198, labelBold: true, valueBold: true },
      {
        label: '',
        value: this.getF(
          'purposeOfValuation',
          `To determine Fair Market Value & Distress Value of the above mentioned property as on date for SwarnaPragati Housing Microfinance Pvt Ltd, Branch ${this.getF('branchName', 'Bolangir')}`
        ),
        labelWidth: 0,
        valueWidth: CONTENT_W - 230,
      },
    ]);

    // ═══════════════════════════════════════════════
    // C: GENERAL DETAILS
    // ═══════════════════════════════════════════════
    this.drawSwarnaSectionHeader('C', 'GENERAL DETAILS');

    const customerStr = `${this.getF('customerName', 'Kamalendu Banachhor')}${this.getF('customerPhone') ? `, Mob- ${this.getF('customerPhone')}` : ''}`;
    this.drawSwarnaRow('1', 'Name Of Customer', customerStr);
    this.drawSwarnaRow('2', 'Property Address File', this.getF('propertyAddressFile', this.getF('propertyAddress', '')));
    this.drawSwarnaRow('3', 'Land Mark', this.getF('landmark', 'Near Bijabahali Primary School'));
    this.drawSwarnaRow('4', 'Name Of Document Holder', this.getF('documentHolderName', 'Kamalendu Banachhor, S/O-Kabiraj Banachhor'));
    this.drawSwarnaRow('5', 'Legal Address Of Property', this.getF('legalAddress', this.getF('propertyAddress', '')));
    this.drawSwarnaRow('6', 'Date Of Inspection', this.getF('dateOfInspection', '18/04/2023'));

    // ═══════════════════════════════════════════════
    // D: SURROUNDING LOCALITY DETAILS
    // ═══════════════════════════════════════════════
    this.drawSwarnaSectionHeader('D', 'SURROUNDING LOCALITY DETAILS');

    this.drawSwarnaRow('1', 'Ward No./ Municipal Land No.', this.getF('wardNoMunicipalNo', 'NA'));
    this.drawSwarnaRow('2', 'Vicinity', this.getF('vicinity', 'Mix / Residential/Commercial'));
    this.drawSwarnaRow('3', 'Type', this.getF('localityType', 'Middle Class/ Upper class'));

    const proximityAmenities = this.getF(
      'proximityAmenitiesText',
      '1.  6Kms From Bolangir Railway Station\n2.  7Kms From Bolangir Bus Stop\n3.  7Kms From Bolangir Govt. Hospital Stop'
    );
    this.drawSwarnaRow('4', 'Proximity To Civic Amenities', proximityAmenities);

    // ═══════════════════════════════════════════════
    // E: USAGE & OCCUPANT DETAILS
    // ═══════════════════════════════════════════════
    this.drawSwarnaSectionHeader('E', 'USAGE & OCCUPANT DETAILS');

    this.drawSwarnaRow('1', 'Type Of Premises', this.getF('typeOfPremises', 'Residential'));

    const occupantSummary = this.getF(
      'occupantDetailsText',
      `Occupied Name of the Occupant: ${this.getF('occupantName', 'Self')}.\nIf relative, state relationship with applicant: ${this.getF('relationshipWithApplicant', 'Owner')}\nIs property Rented? ${this.getF('isPropertyRented', 'No')}\nIf rented list of occupants: ${this.getF('rentedListOccupants', 'NA')}`
    );
    this.drawSwarnaRow('2', 'Occupant Details', occupantSummary);

    // ═══════════════════════════════════════════════
    // F: BUILDING DETAILS
    // ═══════════════════════════════════════════════
    this.drawSwarnaSectionHeader('F', 'BUILDING DETAILS');

    this.drawSwarnaRow('1', 'Types of Structure', this.getF('typesOfStructure', 'RCC Framed Structure'));
    this.drawSwarnaRow('2', 'No of Floors', this.getF('noOfFloors', 'GF Only'));
    this.drawSwarnaRow('3', 'No of Wings', this.getF('noOfWings', 'NA'));
    this.drawSwarnaRow('4', 'No of flats per floor', this.getF('noOfFlatsPerFloor', 'NA'));
    this.drawSwarnaRow('5', 'No of lift in each wings', this.getF('noOfLifts', 'NA'));
    this.drawSwarnaRow('6', 'Completeness of Property', `${this.getF('completenessProperty', '80')}%`);
    this.drawSwarnaRow('7', 'Age of Property', this.getF('ageOfProperty', '1-Year'));
    this.drawSwarnaRow('8', 'Estimated further life', this.getF('estimatedFurtherLife', '59-Years'));
    this.drawSwarnaRow('9', 'Building Demolition Risk', this.getF('buildingDemolitionRisk', 'Low'));

    // ═══════════════════════════════════════════════
    // G: QUALITY OF CONSTRUCTION
    // ═══════════════════════════════════════════════
    this.drawSwarnaSectionHeader('G', 'QUALITY OF CONSTRUCTION');

    this.drawKeyValueRow([
      { label: '', value: 'Exterior', labelWidth: 32, valueWidth: 198, labelBold: true },
      { label: '', value: this.getF('exteriorQuality', 'Average'), labelWidth: 0, valueWidth: CONTENT_W - 230, valueBold: true },
    ]);
    this.drawSwarnaRow('1', 'Beam & column', this.getF('beamAndColumn', 'RCC'));
    this.drawSwarnaRow('2', 'Appearance of the House', this.getF('appearanceOfHouse', 'Average'));
    this.drawSwarnaRow('3', 'Maintenance of the House', this.getF('maintenanceOfHouse', 'Average'));
    this.drawSwarnaRow('4', 'Common Areas of Remark', this.getF('commonAreasRemark', 'NA'));

    this.drawKeyValueRow([
      { label: '', value: 'Interiors', labelWidth: 32, valueWidth: 198, labelBold: true },
      { label: '', value: this.getF('interiorQuality', 'Average'), labelWidth: 0, valueWidth: CONTENT_W - 230, valueBold: true },
    ]);
    this.drawSwarnaRow('5', 'Quality of Fittings', this.getF('qualityOfFittings', 'Average'));
    this.drawSwarnaRow('6', 'Flooring', this.getF('flooringInterior', 'AS Flooring'));
    this.drawSwarnaRow('7', 'Finishing', this.getF('finishingInterior', 'Average'));
    this.drawSwarnaRow('8', 'Roofing& Terracing', this.getF('roofingTerracing', 'RCC Roof'));

    // ═══════════════════════════════════════════════
    // H: APPROVALS
    // ═══════════════════════════════════════════════
    this.drawSwarnaSectionHeader('H', 'APPROVALS');
    this.drawSwarnaRow('1', 'Details of Plan & Approvals', this.getF('detailsOfPlanApprovals', 'Plan not provided'));

    // ═══════════════════════════════════════════════
    // I: UNIT DETAILS
    // ═══════════════════════════════════════════════
    this.drawSwarnaSectionHeader('I', 'UNIT DETAILS');

    this.drawSwarnaRow('1', 'Situated on floor no.', this.getF('situatedOnFloor', 'GF'));
    this.drawSwarnaRow('2', 'Internal Composition', this.getF('internalComposition', 'Average'));
    this.drawSwarnaRow('3', 'Flooring', this.getF('unitFlooring', 'AS Flooring'));
    this.drawSwarnaRow('4', 'Electrical installations', this.getF('electricalInstallations', 'Yes'));
    this.drawSwarnaRow('', 'Plumbing Lines', this.getF('plumbingLines', 'NA'));
    this.drawSwarnaRow('5', 'Kitchen Platform type', this.getF('kitchenPlatformType', 'NA'));
    this.drawSwarnaRow('6', 'Door&Window', this.getF('doorsAndWindows', 'Hard wood'));
    this.drawSwarnaRow('7', 'Additional amenities', this.getF('additionalAmenities', 'NA'));

    // ═══════════════════════════════════════════════
    // J: VALUATION ENGINE & BOUNDARIES
    // ═══════════════════════════════════════════════
    this.drawSwarnaSectionHeader('J', 'VALUATION');

    const landArea = parseSafeFloat(this.getF('landAreaSqft', 1307));
    const carpetArea = parseSafeFloat(this.getF('carpetAreaSqft', 765));
    const bua = parseSafeFloat(this.getF('builtUpAreaSqft', 900));
    const landRate = parseSafeFloat(this.getF('landRatePerSqft', 0));
    const buildingRate = parseSafeFloat(this.getF('buildingRatePerSqft', 0));

    const landValue = multiplyExactDecimals(landArea, landRate);
    const buildingValue = multiplyExactDecimals(bua, buildingRate);
    const fairMarketValue = sumDecimals([landValue, buildingValue]);
    const distressValue = Math.round(fairMarketValue * 0.75);

    this.drawSwarnaRow('1', 'Land area', `${landArea.toLocaleString('en-IN')}sqft`);
    this.drawSwarnaRow('2', 'Carpet Area', `${carpetArea.toLocaleString('en-IN')}sqft`);
    this.drawSwarnaRow('3', 'Loading for BUA', this.getF('loadingForBua', 'NA'));
    this.drawSwarnaRow('4', 'Built up area', `${bua.toLocaleString('en-IN')}sqft`);
    this.drawSwarnaRow('5', 'Land Rate', `Rs.${landRate}/- per sqft of land`);

    const landValStr = `${landArea}sqft X Rs.${landRate}/- = Rs.${formatIndianCurrency(landValue)}/-`;
    this.drawSwarnaRow('6', 'Land value', landValStr);

    const bldValStr = `${bua}sqft X Rs.${buildingRate}/- = Rs.${formatIndianCurrency(buildingValue)}/-`;
    this.drawSwarnaRow('7', 'Building value', bldValStr);

    const fmvStr = `Rs.${formatIndianCurrency(landValue)}/- + Rs.${formatIndianCurrency(buildingValue)}/- = Rs.${formatIndianCurrency(fairMarketValue)}/-`;
    this.drawSwarnaRow('8', 'Fair Market Value(Plot + Construction)', fmvStr);

    const distStr = `Rs.${formatIndianCurrency(distressValue)}/-`;
    this.drawSwarnaRow('9', 'Distress Value(75%)', distStr);

    // Boundaries as per sale deed
    const deedBoundStr = `East-${this.getF('boundDeedEast', 'Saina Chhatria')}\nWest-${this.getF('boundDeedWest', 'Self')}\nNorth-${this.getF('boundDeedNorth', 'Sanadev Banachhor')}\nSouth-${this.getF('boundDeedSouth', 'Bansi Banachhor')}`;
    this.drawSwarnaRow('10', 'Property Bounded by(As per sale deed)', deedBoundStr);

    // Boundaries as per actual
    const actBoundStr = `East-${this.getF('boundActEast', 'Building of Sanadev Banachhor')}\nWest-${this.getF('boundActWest', 'Building of Rajbihari Banachhor')}\nNorth-${this.getF('boundActNorth', 'Vacant land')}\nSouth-${this.getF('boundActSouth', 'Road')}`;
    this.drawSwarnaRow('11', 'Boundary (As per Actual)', actBoundStr);

    this.drawSwarnaRow('12', 'Boundary status', this.getF('boundaryMismatchStatus', 'Boundary mis matches'));

    // ═══════════════════════════════════════════════
    // K: REMARKS
    // ═══════════════════════════════════════════════
    this.drawSwarnaSectionHeader('K', 'Remarks');

    const remarksText = this.getF(
      'synthesisRemarks',
      'Subject property is a single storied residential building having land extent of 1307sqft., having measured BUA is 900sqft. Approved plan is not provided. Age of property is about 1-years. Property located in developing area of Puintala & approaches 15 feet wide Road. The building is occupied by the customer for residential purpose.\nNote- Property shown by the customer/GPS location is mis matching with the revenue mouza map/Bhu-Naksa. Property is located somewhere else. Hence this case is not recommended.'
    );

    this.checkPageBreak(50);
    this.drawKeyValueRow([
      {
        label: '',
        value: remarksText,
        labelWidth: 32,
        valueWidth: CONTENT_W - 32,
        valueBold: false,
      },
    ]);

    this.advanceCursor(8);
    this.checkPageBreak(90);

    // ═══════════════════════════════════════════════
    // 5-POINT DECLARATION
    // ═══════════════════════════════════════════════
    this.drawKeyValueRow([
      {
        label: 'I hereby declare that',
        value: '',
        labelWidth: CONTENT_W,
        valueWidth: 0,
        labelBold: true,
      },
    ]);

    const inspectDate = this.getF('dateOfInspection', '18/04/2023');
    const declarations = [
      `1) Our associate has personally inspected the property on ${inspectDate}.`,
      '2) I have no direct or indirect interest in the property valued.',
      '3) The information furnished in the report is true and correct to the best of my knowledge and belief.',
      "4) The name of Customer/Builder are taken as per technical and paper received with the technical and we don't take any liability regarding the same nor title clearance of the Property.",
      '5) Validity of the Value worked out regarding the concerned property is for a period of 3 months from the date of the Report.',
    ];

    declarations.forEach(dec => {
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
    this.checkPageBreak(60);

    // Valuer Sign-off
    const rDate = this.getF('reportDate', refDate);
    const rPlace = this.getF('reportPlace', 'Bolangir');

    this.drawKeyValueRow([
      {
        label: `Date: ${rDate}\nPlace: ${rPlace}`,
        value: `For: S. Mohanty Associates\n\n\n\nEr. S. Mohanty\nApproved Valuer / Chartered Engineer`,
        labelWidth: CONTENT_W / 2,
        valueWidth: CONTENT_W / 2,
        labelBold: true,
        valueBold: true,
      },
    ]);

    // ═══════════════════════════════════════════════
    // ATTACHMENTS (DOCUMENTS, MAPS, PHOTOGRAPHS)
    // ═══════════════════════════════════════════════
    if (this.fields.documentImages && this.fields.documentImages.length > 0) {
      await this.drawDocumentsGallery(this.fields.documentImages);
    }

    const maps = [
      ...(this.fields.locationMapImages || []),
      ...(this.fields.mouzaMapImages || []),
      ...(this.fields.sketchMapImages || []),
    ];
    if (maps.length > 0) {
      await this.drawMapGallery(maps, 'LOCATION CUM ROUTE MAP / BHU-NAKSA');
    }

    if (this.fields.propertyImages && this.fields.propertyImages.length > 0) {
      await this.drawPhotoGrid(this.fields.propertyImages);
    }
  }
}

export default PDFSwarnaFinanceRenderer;
