import {
  PDFBankRenderer,
  CONTENT_W,
} from '../pdf-bank-renderer';
import { formatIndianCurrency } from '../numberToWords';

export class PDFLICPVR4Renderer extends PDFBankRenderer {
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

  private drawLICRow(letter: string, label: string, value: string, boldVal: boolean = false) {
    const numW = 24;
    const labelW = 230;
    const valW = CONTENT_W - numW - labelW;

    this.drawKeyValueRow([
      { label: letter, value: '', labelWidth: numW, valueWidth: 0, labelBold: true },
      { label, value: '', labelWidth: labelW, valueWidth: 0 },
      { label: '', value: value || 'NA', labelWidth: 0, valueWidth: valW, valueBold: boldVal },
    ]);
  }

  async drawContent(): Promise<void> {
    // Top Header Banner
    this.drawCenteredTitle('PVR-4', 13, true);
    this.drawCenteredTitle('LIC HOUSING FINANCE LIMITED', 14, true);
    this.drawCenteredTitle(`Area Office: ${this.getF('areaOffice', 'Bhubaneswar')}.`, 10, false);
    this.drawCenteredTitle('PURCHASE OF RESIDENTIAL PLOT', 11, true);
    this.advanceCursor(4);
    this.drawCenteredTitle('VALUATION REPORT BY PANEL VALUER FOR HOME LOAN', 10, true);
    this.advanceCursor(6);

    // Meta Grid: File No, Name of Valuer, Code No, Appointing Authority, Date of Valuation, RERA No
    const halfW = CONTENT_W / 2;
    this.drawKeyValueRow([
      { label: '* File No.:', value: this.getF('fileNo', ''), labelWidth: 100, valueWidth: halfW - 100, labelBold: true },
      { label: '* Date of Valuation:', value: this.getF('dateOfValuation', ''), labelWidth: 110, valueWidth: halfW - 110, labelBold: true },
    ]);
    this.drawKeyValueRow([
      { label: '* Name of the Valuer:', value: this.getF('nameOfValuer', 'Er. Satyajit Mohanty'), labelWidth: 110, valueWidth: halfW - 110 },
      { label: '* Code No.:', value: this.getF('codeNo', 'BH-AOV0078'), labelWidth: 80, valueWidth: halfW - 80 },
    ]);
    this.drawKeyValueRow([
      { label: '* Appointing Authority:', value: this.getF('appointingAuthority', 'LIC HFL(BR-I)'), labelWidth: 110, valueWidth: halfW - 110 },
      { label: '* RERA No.(For Flats):', value: this.getF('reraNo', 'NA'), labelWidth: 110, valueWidth: halfW - 110 },
    ]);

    this.advanceCursor(4);

    // ==========================================
    // A. GENERAL
    // ==========================================
    this.drawSectionHeader('A. GENERAL');
    this.drawLICRow('a)', '* Application No.', this.getF('applicationNo', this.getF('fileNo', '')));
    this.drawLICRow('b)', '* Name of the Customer', this.getF('customerName', ''));
    this.drawLICRow('c)', '* Address of Property', '');
    this.drawLICRow('d)', 'Plot No.', this.getF('plotNo', ''));
    this.drawLICRow('e)', 'Village/Block No./Taluk/Ward', this.getF('villageTaluk', ''));
    this.drawLICRow('f)', 'District/Corporation/Municipality', this.getF('districtMunicipality', ''));
    this.drawLICRow('g)', 'Details of the Nearby Landmark', this.getF('landmark', ''));

    this.advanceCursor(4);

    // ==========================================
    // B. INSPECTION
    // ==========================================
    this.drawSectionHeader('B. INSPECTION');
    this.drawLICRow('a)', 'The boundaries of property are as under:', '');

    const bSubW = (CONTENT_W - 24) / 2;
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 24, valueWidth: 0 },
      { label: 'North/Front:', value: this.getF('boundaryNorth', 'NA'), labelWidth: 80, valueWidth: bSubW - 80 },
      { label: 'East/Left (side 1):', value: this.getF('boundaryEast', 'NA'), labelWidth: 100, valueWidth: bSubW - 100 },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 24, valueWidth: 0 },
      { label: 'South/Rear:', value: this.getF('boundarySouth', 'NA'), labelWidth: 80, valueWidth: bSubW - 80 },
      { label: 'West/Right (side 2):', value: this.getF('boundaryWest', 'NA'), labelWidth: 100, valueWidth: bSubW - 100 },
    ]);

    this.drawLICRow('1)', 'Location sketch verified', this.getF('locationSketchVerified', 'Yes'));
    this.drawLICRow('2)', 'Survey No., Village, Taluk', this.getF('surveyVillageTaluk', ''));
    this.drawLICRow('3)', 'Character of locality', this.getF('characterOfLocality', 'Residential'));
    this.drawLICRow('4)', 'Lay Out Approval by (Authority)', this.getF('layoutApprovalAuthority', ''));
    this.drawLICRow('', 'Layout Planning Approval No.', this.getF('layoutApprovalNo', ''));
    this.drawLICRow('5)', 'Development of surrounding area', this.getF('surroundingDevelopment', 'Middle'));
    this.drawLICRow('6)', 'Basic amenities (water, electricity, roads, telephone)', this.getF('basicAmenitiesAvailable', 'Yes'));
    this.drawLICRow('7)', 'Level of plot relative to road', this.getF('levelRelativeToRoad', 'Road level is equal to plot level'));
    this.drawLICRow('8)', 'Shape of plot', this.getF('shapeOfPlot', 'Regular'));
    this.drawLICRow('9)', 'Plot/Land demarcated, with proper boundaries', this.getF('plotDemarcated', 'Yes'));
    this.drawLICRow('10)', 'Any other features like board of other financier', this.getF('otherFinancierNotice', 'No'));
    this.drawLICRow('11)', 'Approximate width of plot on road facing side', this.getF('widthOnRoadFacing', 'NA'));
    this.drawLICRow('12)', 'Is it a corner plot', this.getF('isCornerPlot', 'No'));
    this.drawLICRow('13)', 'Any negatives to locality/property', this.getF('negativesToLocality', 'No'));
    this.drawLICRow('14)', 'Any favourable considerations for addl cost/value', this.getF('favourableConsiderations', 'All civic amenities like school, hospital, market area are within 1-2Kms.'));
    this.drawLICRow('15)', 'Marketability of the Property', this.getF('marketability', 'Good'));
    this.drawLICRow('16)', 'Whether the plot has clear access', this.getF('clearAccess', 'Yes'));
    this.drawLICRow('17)', 'Whether any High Tension Wire Lines passing through?', this.getF('highTensionLines', 'No'));
    this.drawLICRow('18)', 'Area of plot in sqft', this.getF('plotAreaSqft', '') ? `${this.getF('plotAreaSqft')} sqft` : 'NA', true);

    this.advanceCursor(4);

    // ==========================================
    // 19. LAND VALUE & VALUATION TABLE
    // ==========================================
    this.drawSectionHeader('19. LAND VALUE & VALUATION COMPUTATION');

    const vColW = [140, 85, 95, 85, CONTENT_W - 405];
    this.drawKeyValueRow([
      { label: 'Description', value: '', labelWidth: vColW[0], valueWidth: 0, labelBold: true, highlight: true },
      { label: 'Unit Rate (MV)', value: '', labelWidth: vColW[1], valueWidth: 0, labelBold: true, highlight: true },
      { label: 'Market Value (Rs.)', value: '', labelWidth: vColW[2], valueWidth: 0, labelBold: true, highlight: true },
      { label: 'Guideline Rate', value: '', labelWidth: vColW[3], valueWidth: 0, labelBold: true, highlight: true },
      { label: 'Guideline Value (Rs.)', value: '', labelWidth: vColW[4], valueWidth: 0, labelBold: true, highlight: true },
    ]);

    const plotArea = parseFloat(this.getF('plotAreaSqft', '0')) || 0;
    const unitRateMV = parseFloat(this.getF('unitRateMV', '0')) || 0;
    const marketVal = Math.round(plotArea * unitRateMV);
    const unitRateGV = parseFloat(this.getF('unitRateGV', '0')) || 0;
    const guideVal = Math.round(plotArea * unitRateGV);

    this.drawKeyValueRow([
      { label: '', value: `Land Value (${plotArea} sqft)`, labelWidth: 0, valueWidth: vColW[0], valueBold: true },
      { label: '', value: `Rs.${formatIndianCurrency(unitRateMV)}/-`, labelWidth: 0, valueWidth: vColW[1] },
      { label: '', value: `Rs.${formatIndianCurrency(marketVal)}/-`, labelWidth: 0, valueWidth: vColW[2], valueBold: true },
      { label: '', value: `Rs.${formatIndianCurrency(unitRateGV)}/-`, labelWidth: 0, valueWidth: vColW[3] },
      { label: '', value: `Rs.${formatIndianCurrency(guideVal)}/-`, labelWidth: 0, valueWidth: vColW[4], valueBold: true },
    ]);

    this.drawLICRow('20)', 'Acceptable Mortgage Value', this.getF('acceptableMortgageValue', 'NA'));
    this.drawLICRow('21)', 'State the source for arriving at Market Value', this.getF('marketValueSource', 'By analysis of rates of material, labour etc & from local market data of similar properties.'));
    this.drawLICRow('22)', 'Other remarks', this.getF('otherRemarks', ''));

    this.advanceCursor(4);

    // 5 Mandatory Methodology Bullet Points
    this.drawSectionHeader('MANDATORY VALUATION METHODOLOGY STATEMENTS :');
    const statements = [
      `• Background information of the asset being valued: ${this.getF('methodologyBackground', 'Subject property is a vacant residential plot located in a developing area.')}`,
      `• Sources of information used for valuation of property: ${this.getF('methodologySources', 'Recent transactions, Property Brokers, local market feedback.')}`,
      `• Procedures adopted in carrying out the valuation: ${this.getF('methodologyProcedures', 'Land value arrived by comparing similar land parcels in that locality.')}`,
      `• Valuation methodology: ${this.getF('methodologyAdopted', 'Sales comparison method of valuation adopted.')}`,
      `• Major factors that influenced the valuation: ${this.getF('methodologyFactors', 'Location & accessibility to civic amenities etc.')}`,
    ];
    statements.forEach((stmt) => {
      this.drawKeyValueRow([
        { label: '', value: stmt, labelWidth: 0, valueWidth: CONTENT_W },
      ]);
    });

    this.advanceCursor(6);

    // ==========================================
    // G. CERTIFICATE
    // ==========================================
    this.drawSectionHeader('G. CERTIFICATE');
    const certText = `I declare that I am not associated with the builder or with any of his associate companies or with the borrower directly or indirectly in the past or in the present and this report has been prepared by me with highest professional integrity.\n\nI further declare that I have personally inspected the site and building on ${this.getF('inspectionDate', '') || 'NA'}.\n\nI further declare that all the above particulars and information given in this report are true to the best of my knowledge and belief.`;
    this.drawKeyValueRow([
      { label: '', value: certText, labelWidth: 0, valueWidth: CONTENT_W },
    ]);

    this.advanceCursor(12);

    this.drawKeyValueRow([
      { label: `Station: ${this.getF('valuationStation', 'Bhubaneswar')}.\nDate: ${this.getF('dateOfValuation', '')}`, value: '', labelWidth: halfW, valueWidth: 0, labelBold: true },
      { label: 'SIGNATURE OF THE VALUER\n(M/s. S MOHANTY ASSOCIATES)', value: '', labelWidth: halfW, valueWidth: 0, labelBold: true },
    ]);

    // Attachments
    if (this.fields.documentImages?.length > 0) {
      await this.drawDocumentsGallery(this.fields.documentImages);
    }
    if (this.fields.locationMapImages?.length > 0 || this.fields.mouzaMapImages?.length > 0) {
      await this.drawMapGallery([...(this.fields.locationMapImages || []), ...(this.fields.mouzaMapImages || [])], 'LOCATION SKETCH / ROUTE MAP');
    }
    if (this.fields.propertyImages?.length > 0) {
      await this.drawPhotoGrid(this.fields.propertyImages);
    }
  }
}
