import { PDFBankRenderer } from '../pdf-bank-renderer';
import { rupeesInWords } from '../numberToWords';
import { rgb } from 'pdf-lib';
import {
  FONT_SIZE,
  FONT_SIZE_HEADER,
  FONT_SIZE_TITLE,
  LINE_HEIGHT,
  BORDER_W,
  LBL_BG,
  OPT_BG,
  BG_OPACITY,
  hexToRgb,
  MARGIN_L,
  CONTENT_W,
} from '../pdf-bank-renderer';

export class PDFIciciBankNpaRenderer extends PDFBankRenderer {
  private fields: any;
  private projectCode?: string;

  constructor(opts: any = {}) {
    super();
    this.fields = opts;
    this.projectCode = opts.projectCode;
  }

  private getF(key: string): any {
    return this.fields[key];
  }

  async drawContent(): Promise<void> {
    // ── Title ────────────────────────────────────────────────────────
    this.cursorY += 5;
    this.drawCenteredTitle('VALUATION REPORT', FONT_SIZE_TITLE, false);
    this.drawCenteredTitle('FOR ICICI BANK LIMITED (NPA)', FONT_SIZE_TITLE, true);
    this.cursorY += 35;

    // ── Ref & Date ───────────────────────────────────────────────────
    const refNo = this.getF('icicinpaRefNo') || this.projectCode || 'NA';
    const dateRaw = this.getF('icicinpaDate') || '';
    let formattedDate = '';
    if (dateRaw) {
      const m = dateRaw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      formattedDate = m ? `${m[3]}-${m[2]}-${m[1]}` : dateRaw;
    }

    const refText = `REPORT REF: ${refNo}`;
    const dateText = formattedDate ? `DATE OF REPORT: ${formattedDate}` : 'DATE OF REPORT:';

    this.page.drawText(refText, {
      x: MARGIN_L,
      y: this.pdfY(this.cursorY),
      size: FONT_SIZE_HEADER,
      font: this.fontBold,
      color: rgb(0, 0, 0),
    });
    const dateW = this.fontBold.widthOfTextAtSize(dateText, FONT_SIZE_HEADER);
    this.page.drawText(dateText, {
      x: MARGIN_L + CONTENT_W - dateW,
      y: this.pdfY(this.cursorY),
      size: FONT_SIZE_HEADER,
      font: this.fontBold,
      color: rgb(0, 0, 0),
    });
    this.cursorY += 35;

    // ── SECTION 1: VALUATION OF IMMOVABLE PROPERTY ───────────────────
    this.drawSectionHeader('1. VALUATION OF IMMOVABLE PROPERTY', false);
    this.drawSectionHeader('General Information', false);

    // Property Owner (prefill from Customer Name, Section 2)
    const propertyOwner = this.getF('icicinpaPropOwner') || this.getF('icicinpaCustomerName') || 'NA';
    this.drawKeyValueRow([{ label: 'PROPERTY OWNER', value: propertyOwner, labelWidth: 200, valueWidth: CONTENT_W - 200 }]);

    // Address of Property (prefill from Property Address, Section 3)
    const propAddress = this.getF('icicinpaPropAddress') || this.getF('icicinpaPropertyAddress') || 'NA';
    this.drawKeyValueRow([{ label: 'ADDRESS OF THE PROPERTY', value: propAddress, labelWidth: 200, valueWidth: CONTENT_W - 200 }]);

    // Present Market Value (prefill from Round Off Total, Section 9)
    const pmv = this.getF('icicinpaPresentMarketValue') || this.getF('icicinpaRoundOffTotal') || 'NA';
    this.drawKeyValueRow([{ label: 'PRESENT MARKET VALUE', value: pmv, labelWidth: 200, valueWidth: CONTENT_W - 200 }]);

    // Distress Sale Value (prefill from Section 7)
    const distress = this.getF('icicinpaDistressSaleValue') || this.getF('icicinpaDistressValue') || 'NA';
    this.drawKeyValueRow([{ label: 'DISTRESS SALE VALUE', value: distress, labelWidth: 200, valueWidth: CONTENT_W - 200 }]);

    // Realizable Value (prefill from Section 7)
    const realize = this.getF('icicinpaRealizableValue') || this.getF('icicinpaRealizeValue') || 'NA';
    this.drawKeyValueRow([{ label: 'REALIZABLE VALUE', value: realize, labelWidth: 200, valueWidth: CONTENT_W - 200 }]);

    // Purpose of Valuation
    this.drawKeyValueRow([{ label: 'PURPOSE OF VALUATION', value: this.getF('icicinpaPurposeOfValuation') || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }]);

    // Prepared By (prefill from valuer profile)
    const preparedBy = this.getF('icicinpaPreparedBy') || this.getF('valuerName') || 'NA';
    this.drawKeyValueRow([{ label: 'PREPARED BY', value: preparedBy, labelWidth: 200, valueWidth: CONTENT_W - 200 }]);

    this.cursorY += 10;

    // ── SECTION 2: INDIVIDUAL TECHNICAL REPORT ───────────────────────
    this.drawSectionHeader('2. INDIVIDUAL TECHNICAL REPORT', false);
    this.drawSectionHeader('Request Details', false);

    this.drawKeyValueRow([{ label: 'Request ID', value: this.getF('icicinpaRequestId') || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }]);
    this.drawKeyValueRow([{ label: 'Customer Name', value: this.getF('icicinpaCustomerName') || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }]);
    const channelName = this.getF('icicinpaChannelName') === 'Custom' ? this.getF('icicinpaChannelNameCustom') : this.getF('icicinpaChannelName');
    this.drawKeyValueRow([{ label: 'Channel Name', value: channelName || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }]);
    const reportType = this.getF('icicinpaReportType') === 'Custom' ? this.getF('icicinpaReportTypeCustom') : this.getF('icicinpaReportType');
    this.drawKeyValueRow([{ label: 'Report Type', value: reportType || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }]);
    const productType = this.getF('icicinpaProductType') === 'Custom' ? this.getF('icicinpaProductTypeCustom') : this.getF('icicinpaProductType');
    this.drawKeyValueRow([{ label: 'Product Type', value: productType || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }]);
    this.drawKeyValueRow([{ label: 'Application No', value: this.getF('icicinpaApplicationNo') || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }]);
    const businessGroup = this.getF('icicinpaBusinessGroup') === 'Custom' ? this.getF('icicinpaBusinessGroupCustom') : this.getF('icicinpaBusinessGroup');
    this.drawKeyValueRow([{ label: 'Business Group', value: businessGroup || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }]);
    const productName = this.getF('icicinpaProductName') === 'Custom' ? this.getF('icicinpaProductNameCustom') : this.getF('icicinpaProductName');
    this.drawKeyValueRow([{ label: 'Product Name', value: productName || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }]);

    this.cursorY += 10;

    // ── SECTION 3: PROPERTY DETAILS ──────────────────────────────────
    this.drawSectionHeader('3. PROPERTY DETAILS', false);
    this.drawSectionHeader('Project & Address Info', false);

    this.drawKeyValueRow([{ label: 'Project Name', value: this.getF('icicinpaProjectName') || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }]);
    this.drawKeyValueRow([{ label: 'Building Name', value: this.getF('icicinpaBuildingName') || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }]);
    this.drawKeyValueRow([{ label: 'Images', value: this.getF('icicinpaImagesEnclosed') || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }]);
    this.drawKeyValueRow([{ label: 'Property Type', value: this.getF('icicinpaPropertyType') || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }]);
    const unitType = this.getF('icicinpaUnitType') === 'Custom' ? this.getF('icicinpaUnitTypeCustom') : this.getF('icicinpaUnitType');
    this.drawKeyValueRow([{ label: 'Unit Type', value: unitType || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }]);
    this.drawKeyValueRow([{ label: 'Unit No', value: this.getF('icicinpaUnitNo') || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }]);
    this.drawKeyValueRow([{ label: 'Images (Documents)', value: this.getF('icicinpaDocsAttached') || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }]);
    this.drawKeyValueRow([{ label: 'Property Address', value: this.getF('icicinpaPropertyAddress') || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }]);
    this.drawKeyValueRow([{ label: 'Country', value: this.getF('icicinpaCountry') || 'India', labelWidth: 200, valueWidth: CONTENT_W - 200 }]);
    const state = this.getF('icicinpaState') === 'Custom' ? this.getF('icicinpaStateCustom') : this.getF('icicinpaState');
    this.drawKeyValueRow([{ label: 'State', value: state || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }]);
    const city = this.getF('icicinpaCity') === 'Custom' ? this.getF('icicinpaCityCustom') : this.getF('icicinpaCity');
    this.drawKeyValueRow([{ label: 'City', value: city || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }]);
    this.drawKeyValueRow([{ label: 'Nearby Landmark', value: this.getF('icicinpaNearbyLandmark') || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }]);
    this.drawKeyValueRow([{ label: 'Pincode', value: this.getF('icicinpaPincode') || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }]);
    const legalAddr = this.getF('icicinpaLegalAddressSame') ? this.getF('icicinpaPropertyAddress') : this.getF('icicinpaLegalAddress');
    this.drawKeyValueRow([{ label: 'Legal Address', value: legalAddr || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }]);

    this.cursorY += 10;

    // ── SECTION 4: CONTACT DETAILS ──────────────────────────────────
    this.drawSectionHeader('4. CONTACT DETAILS', false);
    this.drawSectionHeader('Contact Information', false);

    const contactName = this.getF('icicinpaContactName') || this.getF('icicinpaCustomerName') || 'NA';
    this.drawKeyValueRow([{ label: 'Name', value: contactName, labelWidth: 200, valueWidth: CONTENT_W - 200 }]);
    this.drawKeyValueRow([{ label: 'Mobile 1/Landline1', value: this.getF('icicinpaMobile1') || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }]);
    this.drawKeyValueRow([{ label: 'Req Initiator Id', value: this.getF('icicinpaReqInitiatorId') || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }]);
    this.drawKeyValueRow([{ label: 'Req Initiator Name', value: this.getF('icicinpaReqInitiatorName') || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }]);

    this.cursorY += 10;

    // ── SECTION 5: ATTACHED DOCUMENT DETAILS ────────────────────────
    this.drawSectionHeader('5. ATTACHED DOCUMENT DETAILS', false);
    this.drawSectionHeader('Documents', false);

    const rawDocs = this.getF('icicinpaAttachedDocs') || [];
    const docRows: string[][] = [];

    if (Array.isArray(rawDocs) && rawDocs.length > 0) {
      rawDocs.forEach((d: any, idx: number) => {
        const docName = d.docName === 'Custom' ? (d.docNameCustom || 'Custom') : (d.docName || 'NA');
        const fName = d.fieldName || 'NA';
        const fVal = d.fieldValue || 'NA';
        docRows.push([String(idx + 1), docName, fName, fVal]);
      });
    }

    if (docRows.length === 0) {
      docRows.push(['1', 'NA', 'NA', 'NA']);
    }

    const docHeaders = ['Sl No', 'Document Name', 'Field Name', 'Field Value'];
    const slW = 40;
    const remW = CONTENT_W - slW;
    const docW = remW * 0.4;
    const fnW = remW * 0.3;
    const fvW = remW * 0.3;

    this.drawTable(
      docHeaders,
      docRows,
      [slW, docW, fnW, fvW],
      [],
      [],
      [],
      [],
      [],
      ['center', 'left', 'left', 'left'],
      ['center', 'left', 'left', 'left']
    );

    this.cursorY += 10;

    // ── SECTION 6: BOUNDARIES ON SITE ───────────────────────────────
    this.drawSectionHeader('6. BOUNDARIES ON SITE', false);
    this.drawSectionHeader('Site Directions & Verification', false);

    const boundaryHeaders = ['Direction', 'As Per Sale Deed', 'Actual at Site'];
    const boundaryRows = [
      ['North', this.getF('icicinpaNorthDeed') || 'NA', this.getF('icicinpaNorthActual') || 'NA'],
      ['South', this.getF('icicinpaSouthDeed') || 'NA', this.getF('icicinpaSouthActual') || 'NA'],
      ['East', this.getF('icicinpaEastDeed') || 'NA', this.getF('icicinpaEastActual') || 'NA'],
      ['West', this.getF('icicinpaWestDeed') || 'NA', this.getF('icicinpaWestActual') || 'NA'],
    ];

    const dirW = 90;
    const eachValW = (CONTENT_W - dirW) / 2;

    this.drawTable(
      boundaryHeaders,
      boundaryRows,
      [dirW, eachValW, eachValW],
      [],
      [0],
      [],
      [],
      [],
      ['left', 'left', 'left'],
      ['left', 'left', 'left']
    );

    // Auto-compute boundary matching fallback if not set
    const northM = (this.getF('icicinpaNorthDeed') || '').trim().toLowerCase() === (this.getF('icicinpaNorthActual') || '').trim().toLowerCase() && !!(this.getF('icicinpaNorthDeed') || '').trim();
    const southM = (this.getF('icicinpaSouthDeed') || '').trim().toLowerCase() === (this.getF('icicinpaSouthActual') || '').trim().toLowerCase() && !!(this.getF('icicinpaSouthDeed') || '').trim();
    const eastM = (this.getF('icicinpaEastDeed') || '').trim().toLowerCase() === (this.getF('icicinpaEastActual') || '').trim().toLowerCase() && !!(this.getF('icicinpaEastDeed') || '').trim();
    const westM = (this.getF('icicinpaWestDeed') || '').trim().toLowerCase() === (this.getF('icicinpaWestActual') || '').trim().toLowerCase() && !!(this.getF('icicinpaWestDeed') || '').trim();
    const autoM = (northM && southM && eastM && westM) ? 'Yes' : ((this.getF('icicinpaNorthDeed') || this.getF('icicinpaSouthDeed')) ? 'No' : 'NA');

    const boundaryMatching = this.getF('icicinpaBoundaryMatching') || autoM;
    this.drawKeyValueRow([
      { label: 'Boundary Matching', value: boundaryMatching, labelWidth: 200, valueWidth: CONTENT_W - 200 }
    ]);

    this.cursorY += 10;

    // ── SECTION 7: PROPERTY DETAILS ─────────────────────────────────
    this.drawSectionHeader('7. PROPERTY DETAILS', false);
    this.drawSectionHeader('Technical Specifications', false);

    const plotArea = this.getF('icicinpaPlotArea') ? `${this.getF('icicinpaPlotArea')} sqft` : 'NA';
    this.drawKeyValueRow([
      { label: 'Plot Area', value: plotArea, labelWidth: 200, valueWidth: CONTENT_W - 200 }
    ]);
    this.drawKeyValueRow([
      { label: 'Plot Demarcated At Site', value: this.getF('icicinpaPlotDemarcated') || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }
    ]);
    const landUse = this.getF('icicinpaApprovedLandUse') === 'Custom' ? this.getF('icicinpaApprovedLandUseCustom') : this.getF('icicinpaApprovedLandUse');
    this.drawKeyValueRow([
      { label: 'Approved Land Use', value: landUse || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }
    ]);
    const infra = this.getF('icicinpaInfrastructureSurrounding') === 'Custom' ? this.getF('icicinpaInfrastructureSurroundingCustom') : this.getF('icicinpaInfrastructureSurrounding');
    this.drawKeyValueRow([
      { label: 'Infrastructure of Surrounding Area', value: infra || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }
    ]);
    const nature = this.getF('icicinpaNatureOfLocality') === 'Custom' ? this.getF('icicinpaNatureOfLocalityCustom') : this.getF('icicinpaNatureOfLocality');
    this.drawKeyValueRow([
      { label: 'Nature of Locality', value: nature || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }
    ]);
    const classLoc = this.getF('icicinpaClassOfLocality') === 'Custom' ? this.getF('icicinpaClassOfLocalityCustom') : this.getF('icicinpaClassOfLocality');
    this.drawKeyValueRow([
      { label: 'Class of Locality', value: classLoc || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }
    ]);
    this.drawKeyValueRow([
      { label: 'Property Area(BUA)RCC G+1', value: this.getF('icicinpaPropertyAreaBua') || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }
    ]);
    const propLoc = this.getF('icicinpaPropertyLocation') === 'Custom' ? this.getF('icicinpaPropertyLocationCustom') : this.getF('icicinpaPropertyLocation');
    this.drawKeyValueRow([
      { label: 'Property Location', value: propLoc || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }
    ]);
    this.drawKeyValueRow([
      { label: 'Distance From City Center(Km)', value: this.getF('icicinpaDistanceFromCityCenter') || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }
    ]);
    const propType = this.getF('icicinpaTypeOfProperty') === 'Custom' ? this.getF('icicinpaTypeOfPropertyCustom') : this.getF('icicinpaTypeOfProperty');
    this.drawKeyValueRow([
      { label: 'Type of Property', value: propType || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }
    ]);
    const floors = this.getF('icicinpaNoOfFloors') === 'Custom' ? this.getF('icicinpaNoOfFloorsCustom') : this.getF('icicinpaNoOfFloors');
    this.drawKeyValueRow([
      { label: 'No. of Floors', value: floors || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }
    ]);

    // Distress & Realize Values calculation
    const mv = Number(this.getF('icicinpaRoundOffTotal') || this.getF('icicinpaPresentMarketValue') || 0);
    const dPct = this.getF('icicinpaDistressPct') !== undefined && this.getF('icicinpaDistressPct') !== '' ? Number(this.getF('icicinpaDistressPct')) : 80;
    const rPct = this.getF('icicinpaRealizePct') !== undefined && this.getF('icicinpaRealizePct') !== '' ? Number(this.getF('icicinpaRealizePct')) : 85;

    const calcDistress = mv > 0 ? String(Math.round(mv * (dPct / 100))) : 'NA';
    const calcRealize = mv > 0 ? String(Math.round(mv * (rPct / 100))) : 'NA';

    const distressVal = this.getF('icicinpaDistressValue') || calcDistress;
    const realizeVal = this.getF('icicinpaRealizeValue') || calcRealize;

    this.drawKeyValueRow([
      { label: `Distress Value (@${dPct}% of MV)`, value: distressVal && distressVal !== 'NA' ? (isNaN(Number(distressVal)) ? distressVal : `Rs. ${distressVal}/-`) : 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }
    ]);
    this.drawKeyValueRow([
      { label: `Realize Value (@${rPct}% of MV)`, value: realizeVal && realizeVal !== 'NA' ? (isNaN(Number(realizeVal)) ? realizeVal : `Rs. ${realizeVal}/-`) : 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }
    ]);
    const costConst = this.getF('icicinpaCostOfConstruction');
    this.drawKeyValueRow([
      { label: 'Cost of Construction', value: costConst ? (isNaN(Number(costConst)) ? costConst : `Rs. ${costConst}/-`) : 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }
    ]);
    this.drawKeyValueRow([
      { label: 'To Be Billed', value: this.getF('icicinpaToBeBilled') || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }
    ]);
    const carpetArea = this.getF('icicinpaCarpetAreaMeasured') ? `${this.getF('icicinpaCarpetAreaMeasured')} sqft` : 'NA';
    this.drawKeyValueRow([
      { label: 'Carpet Area (Measured)', value: carpetArea, labelWidth: 200, valueWidth: CONTENT_W - 200 }
    ]);

    this.cursorY += 10;

    // ── SECTION 8: UNIT DETAILS ─────────────────────────────────────
    this.drawSectionHeader('8. UNIT DETAILS', false);
    this.drawSectionHeader('Room Usage', false);

    const rawRooms = this.getF('icicinpaRoomUsage') || [];
    const roomRows: string[][] = [];

    if (Array.isArray(rawRooms) && rawRooms.length > 0) {
      rawRooms.forEach((r: any, idx: number) => {
        const details = r.details === 'Custom' ? (r.detailsCustom || 'Custom') : (r.details || 'GF');
        const roomsCount = r.rooms || '0';
        const kitchenCount = r.kitchen || '0';
        const bathCount = r.bathrooms || '0';
        const remarks = r.remarks || 'NA';
        roomRows.push([String(idx + 1), details, String(roomsCount), String(kitchenCount), String(bathCount), remarks]);
      });
    }

    if (roomRows.length === 0) {
      roomRows.push(['1', 'GF', '0', '0', '0', 'NA']);
    }

    const roomHeaders = ['Sl No', 'Details', 'Rooms', 'Kitchen', 'Bathrooms', 'Usages and Remarks'];
    const rSlW = 35;
    const rDetW = 75;
    const rCountW = 55;
    const rRemW = CONTENT_W - (rSlW + rDetW + rCountW * 3);

    this.drawTable(
      roomHeaders,
      roomRows,
      [rSlW, rDetW, rCountW, rCountW, rCountW, rRemW],
      [],
      [],
      [],
      [],
      [],
      ['center', 'center', 'center', 'center', 'center', 'left'],
      ['center', 'center', 'center', 'center', 'center', 'left']
    );

    this.cursorY += 8;

    this.drawSectionHeader('Structure & Occupancy', false);

    const structure = this.getF('icicinpaStructure') === 'Custom' ? this.getF('icicinpaStructureCustom') : this.getF('icicinpaStructure');
    this.drawKeyValueRow([
      { label: 'Structure', value: structure || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }
    ]);
    const interior = this.getF('icicinpaInterior') === 'Custom' ? this.getF('icicinpaInteriorCustom') : this.getF('icicinpaInterior');
    this.drawKeyValueRow([
      { label: 'Interior', value: interior || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }
    ]);
    const exterior = this.getF('icicinpaExterior') === 'Custom' ? this.getF('icicinpaExteriorCustom') : this.getF('icicinpaExterior');
    this.drawKeyValueRow([
      { label: 'Exterior', value: exterior || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }
    ]);
    const maint = this.getF('icicinpaMaintenanceLevel') === 'Custom' ? this.getF('icicinpaMaintenanceLevelCustom') : this.getF('icicinpaMaintenanceLevel');
    this.drawKeyValueRow([
      { label: 'Maintenance Level', value: maint || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }
    ]);
    const approxAge = this.getF('icicinpaApproxAgeOfProperty') ? `${this.getF('icicinpaApproxAgeOfProperty')} Years` : 'NA';
    this.drawKeyValueRow([
      { label: 'Approx. Age Of Property', value: approxAge, labelWidth: 200, valueWidth: CONTENT_W - 200 }
    ]);
    const occStatus = this.getF('icicinpaStatusOfOccupancy') === 'Custom' ? this.getF('icicinpaStatusOfOccupancyCustom') : this.getF('icicinpaStatusOfOccupancy');
    this.drawKeyValueRow([
      { label: 'Status Of Occupancy', value: occStatus || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }
    ]);
    const occBy = this.getF('icicinpaOccupiedBy') === 'Custom' ? this.getF('icicinpaOccupiedByCustom') : this.getF('icicinpaOccupiedBy');
    this.drawKeyValueRow([
      { label: 'Occupied By', value: occBy || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }
    ]);
    const relOccupant = this.getF('icicinpaRelationshipOfOccupant') === 'Custom' ? this.getF('icicinpaRelationshipOfOccupantCustom') : this.getF('icicinpaRelationshipOfOccupant');
    this.drawKeyValueRow([
      { label: 'Relationship Of Occupant With Customer', value: relOccupant || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }
    ]);
    this.drawKeyValueRow([
      { label: 'Occupied Since', value: this.getF('icicinpaOccupiedSince') || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }
    ]);

    const lifespan = this.getF('icicinpaTotalLifespan') !== undefined && this.getF('icicinpaTotalLifespan') !== '' ? Number(this.getF('icicinpaTotalLifespan')) : 60;
    const ageNum = Number(this.getF('icicinpaApproxAgeOfProperty') || 0);
    const calcResidual = this.getF('icicinpaApproxAgeOfProperty') !== undefined && this.getF('icicinpaApproxAgeOfProperty') !== '' ? String(Math.max(0, lifespan - ageNum)) : 'NA';
    const residualVal = this.getF('icicinpaResidualAge') || calcResidual;
    const residualDisplay = residualVal && residualVal !== 'NA' ? `${residualVal} Years` : 'NA';
    this.drawKeyValueRow([
      { label: 'Residual Age of Property', value: residualDisplay, labelWidth: 200, valueWidth: CONTENT_W - 200 }
    ]);

    this.cursorY += 10;

    // ── SECTION 9: VALUATION ────────────────────────────────────────
    this.drawSectionHeader('9. VALUATION', false);
    this.drawSectionHeader('Calculation Output', false);

    const valRowsRaw = this.getF('icicinpaValuationRows') || [];
    const tableRows: string[][] = [];

    let computedTotal = 0;

    if (Array.isArray(valRowsRaw) && valRowsRaw.length > 0) {
      valRowsRaw.forEach((row: any, idx: number) => {
        const desc = row.description === 'Custom' ? (row.descriptionCustom || 'Custom') : (row.description || 'Land');
        const area = Number(row.area || (desc === 'Land' ? this.getF('icicinpaPlotArea') : this.getF('icicinpaCarpetAreaMeasured')) || 0);
        const rate = Number(row.rate || 0);
        const amt = row.amount !== undefined && row.amount !== '' ? Number(row.amount) : (area * rate);
        computedTotal += amt;

        tableRows.push([
          String(idx + 1),
          desc,
          area > 0 ? String(area) : '0',
          rate > 0 ? `Rs. ${rate}` : '0',
          amt > 0 ? `Rs. ${Math.round(amt)}` : '0'
        ]);
      });
    }

    if (tableRows.length === 0) {
      tableRows.push(['1', 'Land', '0', '0', '0']);
    }

    const valHeaders = ['Sl No', 'Description', 'Area (Sqft)', 'Rate / Sqft (INR)', 'Amount (INR)'];
    const slCol = 35;
    const descCol = 145;
    const areaCol = 70;
    const rateCol = 90;
    const amtCol = CONTENT_W - (slCol + descCol + areaCol + rateCol);

    this.drawTable(
      valHeaders,
      tableRows,
      [slCol, descCol, areaCol, rateCol, amtCol],
      [],
      [],
      [],
      [],
      [],
      ['center', 'left', 'right', 'right', 'right'],
      ['center', 'left', 'right', 'right', 'right']
    );

    this.cursorY += 8;

    this.drawSectionHeader('Final Calculation', false);

    const totalVal = this.getF('icicinpaTotalAmount') || (computedTotal > 0 ? String(Math.round(computedTotal)) : '0');
    const roundOffVal = this.getF('icicinpaRoundOffTotal') || totalVal;
    const inWordsVal = this.getF('icicinpaRoundOffTotalInWords') || (Number(roundOffVal) > 0 ? rupeesInWords(Number(roundOffVal)) : 'NA');

    this.drawKeyValueRow([
      { label: 'TOTAL', value: totalVal ? `Rs. ${totalVal}/-` : 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }
    ]);
    this.drawKeyValueRow([
      { label: 'Round Off Total', value: roundOffVal ? `Rs. ${roundOffVal}/-` : 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }
    ]);
    this.drawKeyValueRow([
      { label: 'Round Off Total In Words', value: inWordsVal, labelWidth: 200, valueWidth: CONTENT_W - 200 }
    ]);

    this.cursorY += 10;

    // ── SECTION 10: VALUATION AS PER GOVT. APPROVED RATE & MISCELLANEOUS ─
    this.drawSectionHeader('10. VALUATION AS PER GOVT. APPROVED RATE & MISCELLANEOUS', false);
    this.drawSectionHeader('Government Rates', false);

    const gLandArea = this.getF('icicinpaGovtLandArea') || this.getF('icicinpaPlotArea') || '0';
    const gAreaRate = this.getF('icicinpaGovtAreaRate') || '0';
    const gConstArea = this.getF('icicinpaGovtConstructedArea') || this.getF('icicinpaCarpetAreaMeasured') || '0';
    const gConstRate = this.getF('icicinpaGovtConstructedRate') || this.getF('icicinpaCostOfConstruction') || '0';

    const autoGTot = ((Number(gLandArea) * Number(gAreaRate)) + (Number(gConstArea) * Number(gConstRate))) > 0
      ? String(Math.round((Number(gLandArea) * Number(gAreaRate)) + (Number(gConstArea) * Number(gConstRate))))
      : '0';
    const gTotal = this.getF('icicinpaGovtTotalValue') || autoGTot;

    this.drawKeyValueRow([
      { label: 'Land Area / Built Up Area (Sq.Ft.)', value: gLandArea && gLandArea !== '0' ? `${gLandArea} sqft` : 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }
    ]);
    this.drawKeyValueRow([
      { label: 'Area Rate (Per Sq. Ft.)', value: gAreaRate && gAreaRate !== '0' ? `Rs. ${gAreaRate}/-` : 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }
    ]);
    this.drawKeyValueRow([
      { label: 'Constructed Area (BUA)', value: gConstArea && gConstArea !== '0' ? `${gConstArea} sqft` : 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }
    ]);
    this.drawKeyValueRow([
      { label: 'Constructed Rate (Per Sq. Ft.)', value: gConstRate && gConstRate !== '0' ? `Rs. ${gConstRate}/-` : 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }
    ]);
    this.drawKeyValueRow([
      { label: 'Total Value', value: gTotal && gTotal !== '0' ? `Rs. ${gTotal}/-` : 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }
    ]);
    const floorUsage = this.getF('icicinpaFloorwiseUsage') === 'Custom' ? this.getF('icicinpaFloorwiseUsageCustom') : this.getF('icicinpaFloorwiseUsage');
    this.drawKeyValueRow([
      { label: 'Floor wise Building Usage', value: floorUsage || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }
    ]);

    this.cursorY += 8;

    this.drawSectionHeader('Request Data', false);

    const reqCode = this.getF('icicinpaRequestId') || 'NA';
    const reqDate = this.getF('icicinpaDate') || this.getF('valuationDate') || 'NA';
    const parentProd = this.getF('icicinpaProductName') || this.getF('icicinpaProductType') || 'NA';
    const prodType = this.getF('icicinpaProductType') || 'NA';

    this.drawKeyValueRow([
      { label: 'Request Code', value: reqCode, labelWidth: 130, valueWidth: (CONTENT_W / 2) - 130 },
      { label: 'Request Date', value: reqDate, labelWidth: 130, valueWidth: (CONTENT_W / 2) - 130 }
    ]);
    this.drawKeyValueRow([
      { label: 'Parent Prod.Type', value: parentProd, labelWidth: 130, valueWidth: (CONTENT_W / 2) - 130 },
      { label: 'Product Type', value: prodType, labelWidth: 130, valueWidth: (CONTENT_W / 2) - 130 }
    ]);

    this.cursorY += 8;

    this.drawSectionHeader('Construction Status', false);

    const constRowsRaw = this.getF('icicinpaConstructionRows') || [];
    const cTableRows: string[][] = [];

    if (Array.isArray(constRowsRaw) && constRowsRaw.length > 0) {
      constRowsRaw.forEach((row: any, idx: number) => {
        cTableRows.push([
          String(idx + 1),
          row.stage || 'Completed',
          row.structure || 'RCC Framed',
          row.stageDesc || 'Finishing complete',
          row.pctComplete ? `${row.pctComplete}%` : '100%',
          row.pctRecommended ? `${row.pctRecommended}%` : '100%'
        ]);
      });
    }

    if (cTableRows.length === 0) {
      cTableRows.push(['1', 'Completed', 'RCC Framed Structure', 'Finishing complete', '100%', '100%']);
    }

    const cHeaders = ['Sl No', 'Stage of Construction', 'Structure', 'Description of Stage', '% Complete', '% Recom.'];
    const cSl = 35;
    const cStage = 100;
    const cStruct = 110;
    const cComp = 60;
    const cRec = 60;
    const cDesc = CONTENT_W - (cSl + cStage + cStruct + cComp + cRec);

    this.drawTable(
      cHeaders,
      cTableRows,
      [cSl, cStage, cStruct, cDesc, cComp, cRec],
      [],
      [],
      [],
      [],
      [],
      ['center', 'left', 'left', 'left', 'center', 'center'],
      ['center', 'left', 'left', 'left', 'center', 'center']
    );

    this.cursorY += 8;

    this.drawSectionHeader('Verification Status', false);

    const isAll100 = constRowsRaw.length > 0 ? constRowsRaw.every((r: any) => Number(r.pctComplete) === 100) : true;
    const autoStatus = isAll100 ? 'Completed' : 'Under Construction';
    const compStatus = this.getF('icicinpaCompletionStatus') || autoStatus;

    this.drawKeyValueRow([
      { label: 'Completion Status', value: compStatus, labelWidth: 200, valueWidth: CONTENT_W - 200 }
    ]);
    this.drawKeyValueRow([
      { label: 'Violations Observed If Any', value: this.getF('icicinpaViolationsObserved') || 'None observed', labelWidth: 200, valueWidth: CONTENT_W - 200 }
    ]);

    this.cursorY += 10;

    // ── SECTION 11: REMARKS & DECLARATION ─
    this.drawSectionHeader('11. REMARKS & DECLARATION', false);

    // Container: Evaluator Notes
    this.drawSectionHeader('Evaluator Notes', false);
    const remarks = this.getF('icicinpaRemarks') || 'The property was visually inspected and assessed. Building construction is sound and matches development guidelines. Assessed on prevailing market rate.';
    this.drawKeyValueRow([
      { label: 'Remarks', value: remarks, labelWidth: 100, valueWidth: CONTENT_W - 100 }
    ]);

    this.cursorY += 8;

    // Container: Tracking & Approvals
    this.drawSectionHeader('Tracking & Approvals', false);
    const visitedBy = this.getF('icicinpaVisitedBy') || this.getF('valuerName') || 'Er. Satyajit Mohanty';
    const visitedOn = this.getF('icicinpaVisitedOn') || this.getF('dateOfInspection') || this.getF('icicinpaDate') || 'NA';
    const visitedUserType = this.getF('icicinpaVisitedUserType') === 'Custom' ? this.getF('icicinpaVisitedUserTypeCustom') : (this.getF('icicinpaVisitedUserType') || 'Technical Valuer');
    const enteredOn = this.getF('icicinpaEnteredOn') || this.getF('icicinpaDate') || 'NA';
    const enteredBy = this.getF('icicinpaEnteredBy') || this.getF('valuerName') || 'Er. Satyajit Mohanty';
    const approverName = this.getF('icicinpaApproverName') || this.getF('valuerName') || 'Er. Satyajit Mohanty';
    const approverId = this.getF('icicinpaApproverId') || 'SMA/VAL/01';
    const approverRemarks = this.getF('icicinpaApproverRemarks') || 'Approved';
    const approverDesig = this.getF('icicinpaApproverDesignation') || 'Chief Valuer';

    this.drawKeyValueRow([
      { label: 'Visited By', value: visitedBy, labelWidth: 130, valueWidth: (CONTENT_W / 2) - 130 },
      { label: 'Visited On', value: visitedOn, labelWidth: 130, valueWidth: (CONTENT_W / 2) - 130 }
    ]);
    this.drawKeyValueRow([
      { label: 'Visited User Type', value: visitedUserType || 'Technical Valuer', labelWidth: 130, valueWidth: (CONTENT_W / 2) - 130 },
      { label: 'Entered On', value: enteredOn, labelWidth: 130, valueWidth: (CONTENT_W / 2) - 130 }
    ]);
    this.drawKeyValueRow([
      { label: 'Entered By', value: enteredBy, labelWidth: 130, valueWidth: (CONTENT_W / 2) - 130 },
      { label: 'Approver ID', value: approverId, labelWidth: 130, valueWidth: (CONTENT_W / 2) - 130 }
    ]);
    this.drawKeyValueRow([
      { label: 'Approver Name', value: approverName, labelWidth: 130, valueWidth: (CONTENT_W / 2) - 130 },
      { label: 'Approver Designation', value: approverDesig, labelWidth: 130, valueWidth: (CONTENT_W / 2) - 130 }
    ]);
    this.drawKeyValueRow([
      { label: 'Approver Remarks', value: approverRemarks, labelWidth: 130, valueWidth: CONTENT_W - 130 }
    ]);

    this.cursorY += 8;

    // Container: Image Links
    this.drawSectionHeader('Image Links', false);
    const doc1 = this.getF('icicinpaImageDoc1Name') || (this.getF('icicinpaImageDoc1') ? 'Image/Document Attached' : 'NA');
    const doc2 = this.getF('icicinpaImageDoc2Name') || (this.getF('icicinpaImageDoc2') ? 'Image/Document Attached' : 'NA');
    this.drawKeyValueRow([
      { label: 'Image / Document :1', value: doc1, labelWidth: 160, valueWidth: (CONTENT_W / 2) - 160 },
      { label: 'Image / Document :2', value: doc2, labelWidth: 160, valueWidth: (CONTENT_W / 2) - 160 }
    ]);

    this.cursorY += 8;

    // Table/Container: Parameter Info
    this.drawSectionHeader('Parameter Info', false);
    const appNo = this.getF('icicinpaApplicationNo') || 'NA';
    const custName = this.getF('icicinpaCustomerName') || 'NA';
    const chanEmp = (this.getF('icicinpaChannelName') ? this.getF('icicinpaChannelName') + (this.getF('icicinpaPreparedBy') ? ' / ' + this.getF('icicinpaPreparedBy') : '') : (this.getF('icicinpaPreparedBy') || 'NA'));
    const pDate = this.getF('icicinpaDate') || this.getF('valuationDate') || 'NA';

    this.drawKeyValueRow([
      { label: 'Application No.', value: appNo, labelWidth: 130, valueWidth: (CONTENT_W / 2) - 130 },
      { label: 'Customer Name', value: custName, labelWidth: 130, valueWidth: (CONTENT_W / 2) - 130 }
    ]);
    this.drawKeyValueRow([
      { label: 'Channel / Emp Name', value: chanEmp, labelWidth: 130, valueWidth: (CONTENT_W / 2) - 130 },
      { label: 'Date', value: pDate, labelWidth: 130, valueWidth: (CONTENT_W / 2) - 130 }
    ]);

    this.cursorY += 8;

    // Container: Signatories
    this.drawSectionHeader('Signatories & Declarations', false);
    const isDecl = this.getF('icicinpaDeclarationAccepted') !== false;
    const declMark = isDecl ? '[X]' : '[ ]';
    this.drawKeyValueRow([
      {
        label: `${declMark} Mandatory Declaration`,
        value: 'I/We hereby declare that 1. The property was inspected by us. 2. We have no direct or indirect interest in the property valued. 3. The information furnished above is true and correct to the best of our knowledge and belief.',
        labelWidth: 180,
        valueWidth: CONTENT_W - 180
      }
    ]);

    const sigDate = this.getF('icicinpaSignDate') || this.getF('icicinpaDate') || 'NA';
    const sigPlace = this.getF('icicinpaSignPlace') || this.getF('valuerCity') || 'Bhubaneswar';
    const sigValuer = this.getF('valuerName') || 'Er. Satyajit Mohanty';

    this.drawKeyValueRow([
      { label: 'Signature with seal', value: sigValuer, labelWidth: 150, valueWidth: (CONTENT_W / 2) - 150 },
      { label: 'Date', value: sigDate, labelWidth: 100, valueWidth: (CONTENT_W / 2) - 100 }
    ]);
    this.drawKeyValueRow([
      { label: 'Place', value: sigPlace, labelWidth: 150, valueWidth: (CONTENT_W / 2) - 150 }
    ]);

    this.cursorY += 8;

    // Container: Legal Statement
    this.drawSectionHeader('Legal Statement', false);
    const disclaimer = 'DISCLAIMER: This valuation report has been prepared solely for the technical assessment and internal guidance of ICICI Bank. The valuation is carried out in good faith based on the documents, visual physical inspection, information, and representations furnished by the applicant/bank. No warranty is given or implied regarding structural stability, hidden foundations, soil strata, concealed installations, or legal title correctness. This report is confidential and cannot be reproduced, transferred, or used by any third party without prior written permission of S Mohanty Associates.';
    this.drawKeyValueRow([
      { label: 'DISCLAIMER', value: disclaimer, labelWidth: 100, valueWidth: CONTENT_W - 100 }
    ]);

    this.cursorY += 10;

    // ── (Additional sections will be added here as prompts are provided) ──

  }
}
