import {
  PDFBankRenderer,
  CONTENT_W,
  MARGIN_L,
} from '../pdf-bank-renderer';

export interface CholaUnitLevel {
  level: string;
  rooms: string;
  kitchenToilet: string;
  others: string;
}

export interface CholaCostingRow {
  description: string;
  areaPlan: string;
  areaActual: string;
  rate: string;
  amountPlan: string;
  amountActual: string;
}

export interface CholaDocSubmitted {
  slNo: number | string;
  description: string;
  refNoDate: string;
}

export interface CholaChecklistItem {
  slNo: number | string;
  item: string;
  status: string;
  remarks: string;
}

export interface CholaInvestmentFields {
  // Header / Reference
  refNo?: string;
  referenceNo?: string;
  reportDate?: string;
  reportTitle?: string;

  // 1. Customer Details
  customerName?: string;
  applicationNo?: string;
  dateOfVisit?: string;
  nameOfOwner?: string;
  contactNo?: string;
  personContacted?: string;

  // 2. Property Details
  postalAddress?: string;
  addressAsPerDocument?: string;
  nearbyLandmark?: string;
  situatedIn?: string;
  distanceRailway?: string;
  distanceBusStand?: string;
  distanceAirport?: string;
  structure?: string;
  usageOfProperty?: string;
  shareOfUsage?: string;

  // 3. Boundaries
  boundNorthSaleDeed?: string;
  boundSouthSaleDeed?: string;
  boundEastSaleDeed?: string;
  boundWestSaleDeed?: string;

  boundNorthActual?: string;
  boundSouthActual?: string;
  boundEastActual?: string;
  boundWestActual?: string;

  boundNorthSketch?: string;
  boundSouthSketch?: string;
  boundEastSketch?: string;
  boundWestSketch?: string;

  ageOfProperty?: string;
  residualAgeOfProperty?: string;
  occupiedBy?: string;

  // 4. Unit Details
  unitLevels?: CholaUnitLevel[];

  // 5. Structure & Interiors
  structureFoundation?: string;
  gfFlooring?: string;
  ffFlooring?: string;
  sfFlooring?: string;
  tfFlooring?: string;
  maintenanceLevel?: string;

  // 6. Land and Construction Details
  costingRows?: CholaCostingRow[];
  totalValueApprovedArea?: string;
  totalValueActualConstruction?: string;
  marketableConfirmation?: string;
  valuationNote?: string;

  // 7. Details Documents Submitted
  documentsSubmitted?: CholaDocSubmitted[];

  // 8. Visit Details
  visitPersonName?: string;
  visitContactDetails?: string;
  visitDateTime?: string;
  visitDiscrepancies?: string;

  // 9. Electricity Connection Details
  electricityConnectionName?: string;
  electricityReferenceNo?: string;
  electricityLatestBillDate?: string;

  // 10. Risk of Demolition & Benchmark Value
  demolitionRisk?: string;
  demolitionRemark?: string;
  govtBenchmarkValue?: string;

  // 11. Checklist
  checklist?: CholaChecklistItem[];

  // 12. Remarks
  remarks?: string;

  // 13. Declaration / Footer
  declarationDate?: string;
  declarationPlace?: string;
  valuerName?: string;

  // Attachments
  locationMaps?: any[];
  propertyDocuments?: any[];
  propertyPhotos?: any[];
  latitude?: string;
  longitude?: string;
  projectCode?: string;
}

export class PDFCholaInvestmentRenderer extends PDFBankRenderer {
  private f: CholaInvestmentFields;

  constructor(fields: CholaInvestmentFields) {
    super();
    this.f = fields || {};
  }

  private getF(key: keyof CholaInvestmentFields, fallback: string = '-'): string {
    const val = this.f[key];
    if (val === undefined || val === null || String(val).trim() === '') {
      return fallback;
    }
    return String(val).trim();
  }

  async generateAndDownload(fileName: string): Promise<void> {
    const pdfBytes = await this.render();
    if (typeof window !== 'undefined') {
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }

  private draw2Col(label: string, value: string, boldVal: boolean = false, labelW = 160) {
    this.drawKeyValueRow([
      {
        label,
        value: value || '-',
        labelWidth: labelW,
        valueWidth: CONTENT_W - labelW,
        labelBold: true,
        bold: boldVal,
      },
    ]);
  }

  private draw3Col(l1: string, v1: string, l2: string, v2: string, l3: string, v3: string) {
    const w = CONTENT_W / 3;
    const lw = 90;
    const vw = w - lw;
    this.drawKeyValueRow([
      { label: l1, value: v1 || '-', labelWidth: lw, valueWidth: vw, labelBold: true },
      { label: l2, value: v2 || '-', labelWidth: lw, valueWidth: vw, labelBold: true },
      { label: l3, value: v3 || '-', labelWidth: lw, valueWidth: vw, labelBold: true },
    ]);
  }

  private draw4Col(l1: string, v1: string, l2: string, v2: string, bold2: boolean = false) {
    const halfW = CONTENT_W / 2;
    const labelW = 130;
    const valW = halfW - labelW;
    this.drawKeyValueRow([
      { label: l1, value: v1 || '-', labelWidth: labelW, valueWidth: valW, labelBold: true },
      { label: l2, value: v2 || '-', labelWidth: labelW, valueWidth: valW, labelBold: true, bold: bold2 },
    ]);
  }

  async render(): Promise<Uint8Array> {
    await this.init();

    // ══════════════════════════════════════════════════════════════
    // TOP REFERENCE & REPORT TITLE
    // ══════════════════════════════════════════════════════════════
    const refNo = this.getF('refNo', this.f.projectCode || '');
    const repDate = this.getF('reportDate', '12/05/2026');

    this.drawKeyValueRow([
      {
        label: 'REFERENCE NO',
        value: refNo,
        labelWidth: 100,
        valueWidth: 200,
        labelBold: true,
        bold: true,
      },
      {
        label: 'DATE',
        value: repDate,
        labelWidth: 60,
        valueWidth: CONTENT_W - 360,
        labelBold: true,
        bold: true,
      },
    ]);

    const title = this.getF(
      'reportTitle',
      'PROPERTY VALUATION REPORT FOR HOME EQUITY - CHOLAMANDALAM INVESTMENT FINANCE CO PVT LTD.'
    );
    this.drawSectionHeader(title, false);

    // ══════════════════════════════════════════════════════════════
    // 1. CUSTOMER DETAILS (Table without redundant header, matching format)
    // ══════════════════════════════════════════════════════════════
    const custName = this.getF('customerName', 'BAJENDRA SAHU');
    const appNo = this.getF('applicationNo', '61931532');
    const visitDate = this.getF('dateOfVisit', '10/05/2026');
    const ownerName = this.getF('nameOfOwner', 'SANJUKTA SAHU, W/O- BAJENDRA SAHU');
    const contactNo = this.getF('contactNo', 'MOB:7008119899');
    const personContacted = this.getF('personContacted', 'BAJENDRA SAHU, MOB- 7008119899');

    this.drawKeyValueRow([
      { label: 'CUSTOMER NAME', value: custName, labelWidth: 120, valueWidth: 150, labelBold: true },
      { label: 'APPLICATION NO.', value: appNo, labelWidth: 110, valueWidth: CONTENT_W - 380, labelBold: true },
    ]);
    this.drawKeyValueRow([
      { label: 'NAME OF OWNER', value: ownerName, labelWidth: 120, valueWidth: 150, labelBold: true, bold: true },
      { label: 'DATE OF VISIT', value: visitDate, labelWidth: 110, valueWidth: CONTENT_W - 380, labelBold: true },
    ]);
    this.draw2Col('CONTACT NO.', contactNo, false, 120);
    this.draw2Col('PERSON CONTACTED', personContacted, false, 120);

    // ══════════════════════════════════════════════════════════════
    // 2. PROPERTY DETAILS
    // ══════════════════════════════════════════════════════════════
    this.drawSectionHeader('PROPERTY DETAILS:-');
    this.draw2Col('POSTAL ADDRESS', this.getF('postalAddress'));
    this.draw2Col('ADDRESS AS PER DOCUMENT (AS PER SALE DEED)', this.getF('addressAsPerDocument'), false, 200);
    this.draw2Col('NEARBY LANDMARK:-', this.getF('nearbyLandmark', 'Near Shridi Sai Baba Temple'));

    // Situated in & Transit distances
    this.draw4Col('THE PROPERTY IS SITUATED IN A', this.getF('situatedIn', 'RESIDENTIAL AREA.'), 'RAILWAY STATION', this.getF('distanceRailway', '7-KM'));
    this.draw4Col('BUS STAND', this.getF('distanceBusStand', '1-KMS'), 'AIRPORT', this.getF('distanceAirport', '30-KMS'));

    this.draw3Col(
      'STRUCTURE',
      this.getF('structure', 'R.C.C. FRAMED STRUCTURE'),
      'USAGE OF PROPERTY',
      this.getF('usageOfProperty', 'RESIDENTIAL'),
      'SHARE OF USAGE',
      this.getF('shareOfUsage', 'UNDER CONSTRUCTION')
    );

    // ══════════════════════════════════════════════════════════════
    // 3. BOUNDARIES
    // ══════════════════════════════════════════════════════════════
    this.drawSectionHeader('BOUNDERIES');
    const boundHeaders = ['BOUNDERIES', 'NORTH', 'SOUTH', 'EAST', 'WEST'];
    const boundRows = [
      [
        'AS PER SALE DEED',
        this.getF('boundNorthSaleDeed', 'Road'),
        this.getF('boundSouthSaleDeed', 'Drain'),
        this.getF('boundEastSaleDeed', 'Sub Plot No-13'),
        this.getF('boundWestSaleDeed', 'Sub Plot No-11'),
      ],
      [
        'AS PER ACTUAL',
        this.getF('boundNorthActual', 'Road'),
        this.getF('boundSouthActual', 'Vacant Land'),
        this.getF('boundEastActual', 'Vacant Land'),
        this.getF('boundWestActual', 'Vacant Land'),
      ],
      [
        'AS PER SKETCH MAP',
        this.getF('boundNorthSketch', 'NA'),
        this.getF('boundSouthSketch', 'NA'),
        this.getF('boundEastSketch', 'NA'),
        this.getF('boundWestSketch', 'NA'),
      ],
    ];
    const bColW = [CONTENT_W * 0.24, CONTENT_W * 0.19, CONTENT_W * 0.19, CONTENT_W * 0.19, CONTENT_W * 0.19];
    this.drawTable(boundHeaders, boundRows, bColW, [], [0]);

    this.draw3Col(
      'AGE OF THE PROPERTY',
      this.getF('ageOfProperty', '0-YEARS'),
      'RESIDUAL AGE OF PROPERTY',
      this.getF('residualAgeOfProperty', '60-YEARS'),
      'OCCUPIED BY',
      this.getF('occupiedBy', 'VACANT')
    );

    // ══════════════════════════════════════════════════════════════
    // 4. UNIT DETAILS
    // ══════════════════════════════════════════════════════════════
    this.drawSectionHeader('UNITE DETAILS');
    const uHeaders = ['DETAILS OF LEVELS', 'NO OF ROOMS', 'NO OF KITCHEN & TOILET', 'OTHERS'];
    const uLevels = this.f.unitLevels && this.f.unitLevels.length > 0
      ? this.f.unitLevels
      : [
          { level: 'GROUND FLOOR', rooms: 'NA', kitchenToilet: '1-KITCHEN', others: 'NA' },
          { level: 'FIRST FLOOR', rooms: 'NA', kitchenToilet: 'NA', others: 'NA' },
        ];
    const uRows = uLevels.map(u => [u.level, u.rooms, u.kitchenToilet, u.others]);
    const uColW = [CONTENT_W * 0.28, CONTENT_W * 0.24, CONTENT_W * 0.28, CONTENT_W * 0.20];
    this.drawTable(uHeaders, uRows, uColW, [], [0]);

    // ══════════════════════════════════════════════════════════════
    // 5. STRUCTURE & INTERIORS
    // ══════════════════════════════════════════════════════════════
    this.drawSectionHeader('STRUCTURE & INTERIORS');
    this.draw2Col(
      'STRUCTURE',
      this.getF('structureFoundation', 'R.C.C. COLUMN FOUNDATION WITH BRICK MASONRY PARTITION WALLS'),
      false,
      130
    );

    // Interior floors grid
    const fHeaders = ['G.F. - R.C.C', 'F.F. - R.C.C', 'S.F.- R.C.C', 'T.F.- R.C.C'];
    const fRows = [
      [
        this.getF('gfFlooring', 'FLOORING:- GROUND FLOOR- NOT DONE'),
        this.getF('ffFlooring', 'FLOORING:- FIRST FLOOR- NOT DONE'),
        this.getF('sfFlooring', 'FLOORING:- SECOND FLOOR- NA'),
        this.getF('tfFlooring', 'FLOORING:- THIRD FLOOR- NA'),
      ],
    ];
    const fColW = [CONTENT_W * 0.25, CONTENT_W * 0.25, CONTENT_W * 0.25, CONTENT_W * 0.25];
    this.drawTable(fHeaders, fRows, fColW, [], [], [], [], [], ['center', 'center', 'center', 'center'], ['center', 'center', 'center', 'center']);

    this.draw2Col('MAINTENANCE LEVEL', this.getF('maintenanceLevel', 'GOOD'), true, 160);

    // ══════════════════════════════════════════════════════════════
    // 6. LAND AND CONSTRUCTION DETAILS (COSTING / VALUATION) - PAGE 2
    // ══════════════════════════════════════════════════════════════
    this.addNewPage();
    this.drawSectionHeader('LAND AND CONSTRUCTION DETAILS:-', false);
    const cHeaders = [
      'DESCRIPTION',
      'AREA AS PER PLAN/DOC (SQFT)',
      'AREA AS PER ACTUAL (SQFT)',
      'RATE PER SQFT',
      'AMOUNT AS PER PLAN',
      'AMOUNT AS PER ACTUAL',
    ];

    const defaultCostingRows: CholaCostingRow[] = [
      {
        description: 'LAND EXTENT',
        areaPlan: '3484 SQFT',
        areaActual: '3484 SQFT',
        rate: '300/-',
        amountPlan: '---',
        amountActual: 'Rs. 10,45,200/-',
      },
      {
        description: 'CARPET AREA',
        areaPlan: '--',
        areaActual: '--',
        rate: '--',
        amountPlan: '--',
        amountActual: '--',
      },
      {
        description: 'BUILT UP AREA',
        areaPlan: 'MENTIONED BELOW',
        areaActual: '--',
        rate: '--',
        amountPlan: '--',
        amountActual: '--',
      },
      {
        description: 'GROUND FLOOR (BUA) ON 100% COMPLETION',
        areaPlan: '900 SQFT',
        areaActual: '900 SQFT',
        rate: '1500/-',
        amountPlan: '------',
        amountActual: 'Rs. 13,50,000/-',
      },
      {
        description: 'GROUND FLOOR (BUA) AS ON DATE 10%',
        areaPlan: '900 SQFT',
        areaActual: '900 SQFT',
        rate: '150/-',
        amountPlan: '------',
        amountActual: 'Rs. 1,35,000/-',
      },
      {
        description: 'TOTAL:',
        areaPlan: '---',
        areaActual: '---',
        rate: '---',
        amountPlan: '---',
        amountActual: 'Rs. 11,80,200/-',
      },
      {
        description: 'LESS: DEPRECIATION (0% PER YEAR)',
        areaPlan: '---',
        areaActual: '---',
        rate: '---',
        amountPlan: '---',
        amountActual: 'Rs. 0/-',
      },
      {
        description: 'TOTAL AFTER DEPRECIATION:',
        areaPlan: '---',
        areaActual: '---',
        rate: '---',
        amountPlan: '---',
        amountActual: 'Rs. 11,80,200/-',
      },
      {
        description: 'TOTAL VALUE OF PROPERTY:',
        areaPlan: '---',
        areaActual: '---',
        rate: '---',
        amountPlan: '---',
        amountActual: 'Rs. 11,80,200/-',
      },
    ];

    const cRowsData = this.f.costingRows && this.f.costingRows.length > 0 ? this.f.costingRows : defaultCostingRows;
    const cRows = cRowsData.map(r => [
      r.description,
      r.areaPlan,
      r.areaActual,
      r.rate,
      r.amountPlan,
      r.amountActual,
    ]);
    const cColW = [
      CONTENT_W * 0.32,
      CONTENT_W * 0.16,
      CONTENT_W * 0.16,
      CONTENT_W * 0.12,
      CONTENT_W * 0.12,
      CONTENT_W * 0.12,
    ];

    // Bold highlight for totals
    const highlightRowIdxs: number[] = [];
    cRowsData.forEach((row, idx) => {
      if (row.description.includes('TOTAL') || row.description.includes('TOTAL VALUE')) {
        highlightRowIdxs.push(idx);
      }
    });

    this.drawTable(
      cHeaders,
      cRows,
      cColW,
      highlightRowIdxs,
      [0],
      [5],
      [],
      [],
      ['left', 'center', 'center', 'right', 'right', 'right'],
      ['center', 'center', 'center', 'center', 'center', 'center'],
      7.5
    );

    // Valuation Summary Callouts
    this.draw2Col(
      'TOTAL VALUE OF THE PROPERTY AS PER THE APPROVED AREA:',
      this.getF('totalValueApprovedArea', 'NA'),
      false,
      300
    );
    this.draw2Col(
      'TOTAL VALUE OF PROPERTY AS PER ACTUAL CONSTRUCTION:',
      this.getF(
        'totalValueActualConstruction',
        'Rs. 11,80,200/- OR Say- RS. 11,80,000/- (ELEVEN LAKHS EIGHTY THOUSAND ONLY)'
      ),
      true,
      300
    );

    const confText = this.getF(
      'marketableConfirmation',
      'WE HEREBY CONFIRM THAT THE ABOVE MENTIONED PROPERTY HAS MARKETABLE AND RECOMMANDED TO ACCEPT AFTER VERIFICATION.'
    );
    this.drawWrappedTextAt(confText, MARGIN_L, this.cursorY, CONTENT_W, { bold: true });
    this.advanceCursor(16);

    const noteText = this.getF('valuationNote', 'NOTE:- MEASURED BUA AREA CONSIDER FOR VALUATION');
    this.drawWrappedTextAt(noteText, MARGIN_L, this.cursorY, CONTENT_W, { bold: true });
    this.advanceCursor(16);

    // ══════════════════════════════════════════════════════════════
    // 7. DETAILS DOCUMENTS SUBMITTED
    // ══════════════════════════════════════════════════════════════
    this.drawSectionHeader('DETAILS DOCUMENTS SUBMITTED:-');
    const docHeaders = ['SL NO.', 'DESCRIPTION', 'REFERENCE NO. & DATE'];
    const defaultDocs: CholaDocSubmitted[] = [
      { slNo: 1, description: 'SANCTION PLAN DETAILS', refNoDate: 'APPROVED PLAN IS NOT PROVIDED.' },
      { slNo: 2, description: 'SALE DEED PROVIDED', refNoDate: 'YES' },
      { slNo: 3, description: 'ROR', refNoDate: 'YES' },
      { slNo: 4, description: 'ARC COPY', refNoDate: 'NO' },
    ];
    const docsData = this.f.documentsSubmitted && this.f.documentsSubmitted.length > 0
      ? this.f.documentsSubmitted
      : defaultDocs;
    const docRows = docsData.map(d => [String(d.slNo), d.description, d.refNoDate]);
    const docColW = [CONTENT_W * 0.12, CONTENT_W * 0.48, CONTENT_W * 0.40];
    this.drawTable(docHeaders, docRows, docColW, [], [1], [], [], [], ['center', 'left', 'left']);

    // ══════════════════════════════════════════════════════════════
    // 8. VISIT DETAILS
    // ══════════════════════════════════════════════════════════════
    this.drawSectionHeader('VISIT DETAILS:-');
    this.draw4Col('NAME OF THE PERSON', this.getF('visitPersonName', 'MR. DIBYA'), 'CONTACT DETAILS', this.getF('visitContactDetails', 'MOB: NA'));
    this.draw4Col(
      'VISITED TIME',
      this.getF('visitDateTime', '04.23 PM, 10/05/2026'),
      'DISCREPANCIES / MISMATCH',
      this.getF('visitDiscrepancies', 'NA')
    );

    // ══════════════════════════════════════════════════════════════
    // 9. ELECTRICITY CONNECTION DETAILS
    // ══════════════════════════════════════════════════════════════
    this.drawSectionHeader('ELECTRICITY CONNECTION DETAILS:-');
    this.draw2Col('CONNECTION IN THE NAME OF', this.getF('electricityConnectionName', 'ELECTRIC CONNECTION AVAILABLE. BILL NOT PROVIDED'), false, 180);
    this.draw4Col('REFERENCE NUMBER', this.getF('electricityReferenceNo', 'NA'), 'LATEST BILL DATE AVAILABLE', this.getF('electricityLatestBillDate', 'NA'));

    // ══════════════════════════════════════════════════════════════
    // 10. RISK OF DEMOLITION & BENCHMARK VALUE - PAGE 3
    // ══════════════════════════════════════════════════════════════
    this.addNewPage();
    this.drawSectionHeader('RISK OF DEMOLITION:-', false);
    this.draw4Col('RISK OF DEMOLITION', this.getF('demolitionRisk', 'LOW'), 'REMARK', this.getF('demolitionRemark', 'AS PER LOCAL BY-LAWS'), true);
    this.drawSectionHeader('BENCHMARK VALUE', true);
    this.draw2Col('GOVT. BENCHMARK / GUIDELINE VALUE OF LAND PER SQFT.', this.getF('govtBenchmarkValue', 'RS. 189/- PER SQFT OF LAND.'), true, 260);

    // ══════════════════════════════════════════════════════════════
    // 11. CHECKLIST
    // ══════════════════════════════════════════════════════════════
    this.drawSectionHeader('CHECKLIST:-');
    const chkHeaders = ['#', 'CHECKLIST ITEM', 'STATUS', 'REMARKS'];
    const defaultChecklist: CholaChecklistItem[] = [
      { slNo: 1, item: 'DOCUMENTS DETAILS MATCH WITH ACTUAL PROPERTY AT SITE', status: 'YES', remarks: 'MATCHING' },
      { slNo: 2, item: 'DOCUMENTS SUBMITTED IS CLEAR AND LEGIBLE', status: 'YES', remarks: 'CLEAR' },
      { slNo: 3, item: 'STAMP AND SEAL BY PROPER APPROVING AUTHORITY IS AVAILABLE', status: 'NA', remarks: 'NOT PROVIDED' },
      { slNo: 4, item: 'ORIGINALS OF DOCUMENTS SUBMITTED IS VERIFIED', status: 'NO', remarks: 'COPY VERIFIED' },
      { slNo: 5, item: 'OWNERSHIP CONFIRMED BY ANY OTHER DOCUMENTS', status: 'YES', remarks: 'AS PER ROR' },
      { slNo: 6, item: 'CUSTOMER IS COOPERATIVE IN VALUATION', status: 'YES', remarks: 'COOPERATIVE' },
      { slNo: 7, item: 'PROPER ACCESSIBILITY IS AVAILABLE TO REACH THE PROPERTY', status: 'YES', remarks: 'ACCESSIBLE' },
    ];
    const chkData = this.f.checklist && this.f.checklist.length > 0 ? this.f.checklist : defaultChecklist;
    const chkRows = chkData.map(c => [String(c.slNo), c.item, c.status, c.remarks]);
    const chkColW = [CONTENT_W * 0.08, CONTENT_W * 0.52, CONTENT_W * 0.18, CONTENT_W * 0.22];
    this.drawTable(chkHeaders, chkRows, chkColW, [], [1], [], [], [], ['center', 'left', 'center', 'left']);

    // ══════════════════════════════════════════════════════════════
    // 12. REMARKS
    // ══════════════════════════════════════════════════════════════
    this.drawSectionHeader('REMARKS:-');
    const defaultRemarks =
      'Subject property is a single storied under construction building having land extent of 3484sqft. having measured BUA 900sqft. Approved plan is not provided. It is accessible with 20-feet wide road. The property is coming under Duarasuni GP limit. All civic amenities are present within 1-2 kms from the property. At present, GF piling work completed & present stage of construction is about 10%. Valuation has been done for land component only. BUA value is not considered as the approved plan & estimate is not provided.';
    const remText = this.getF('remarks', defaultRemarks);
    this.drawWrappedTextAt(remText, MARGIN_L, this.cursorY, CONTENT_W, {
      align: 'justify',
    });
    this.advanceCursor(22);

    // ══════════════════════════════════════════════════════════════
    // 13. DECLARATION
    // ══════════════════════════════════════════════════════════════
    this.drawSectionHeader('DECLARATION');
    const declarationPoints = [
      '1. I have no direct or indirect interest in the property valued.',
      '2. Information furnished in the report is true and correct to the best of my knowledge and belief.',
      '3. Fair market value indicated in the report is an opinion of the value prevailing on the date of the said report and is based on market feedback on values of similar properties. Client is free to obtain other independent opinions on the same. Fair, market value of such properties / localities may increase or decrease, depending on the future market conditions & scenarios.',
      '4. Report does not certify or confirm any ownership or title of the property that has been valued.',
      '5. No structural survey was conducted by us.',
    ];
    for (const pt of declarationPoints) {
      this.drawWrappedTextAt(pt, MARGIN_L, this.cursorY, CONTENT_W, { align: 'justify' });
      this.advanceCursor(14);
    }

    this.advanceCursor(10);
    this.checkPageBreak(50);
    const decDate = this.getF('declarationDate', repDate);
    const decPlace = this.getF('declarationPlace', 'BHUBANESWAR');
    const valuer = this.getF('valuerName', 'M/S. S MOHANTY ASSOCIATES');

    this.drawKeyValueRow([
      {
        label: `DATE:- ${decDate}\nPLACE:- ${decPlace}`,
        value: `FOR ${valuer}\n\n(AUTHORISED SIGNATORY)`,
        labelWidth: 260,
        valueWidth: CONTENT_W - 260,
        labelBold: true,
        bold: true,
      },
    ]);

    // ══════════════════════════════════════════════════════════════
    // ATTACHMENTS: MAPS, DOCUMENTS, PHOTOGRAPHS
    // ══════════════════════════════════════════════════════════════
    const lat = this.getF('latitude');
    const lng = this.getF('longitude');
    const mapTitle = lat && lng ? `LOCATION MAP:- (LATITUDE- ${lat}, LONGITUDE- ${lng})` : 'LOCATION MAP';

    const maps = this.f.locationMaps || [];
    const docs = this.f.propertyDocuments || [];
    const photos = this.f.propertyPhotos || [];

    if (maps.length > 0 || docs.length > 0 || photos.length > 0) {
      this.addNewPage();
    }

    if (maps && maps.length > 0) {
      await this.drawMapGallery(maps, mapTitle);
    }

    if (docs && docs.length > 0) {
      await this.drawDocumentsGallery(docs);
    }

    if (photos && photos.length > 0) {
      await this.drawPhotoGrid(photos, 'PROPERTY SITE PHOTOGRAPHS');
    }

    return await this.save();
  }
}
