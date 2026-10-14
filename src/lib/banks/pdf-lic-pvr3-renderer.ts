import {
  PDFBankRenderer,
  CONTENT_W,
} from '../pdf-bank-renderer';
import { formatIndianCurrency, rupeesInWords } from '../numberToWords';

export class PDFLICPVR3Renderer extends PDFBankRenderer {
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
      { label: value || 'NA', value: '', labelWidth: valW, valueWidth: 0, labelBold: boldVal },
    ]);
  }

  async drawContent(): Promise<void> {
    this.addPage();

    // Top Header Banner
    this.drawCenteredTitle('PVR-3', 13, true);
    this.drawCenteredTitle('LIC HOUSING FINANCE LIMITED', 14, true);
    this.drawCenteredTitle(`Area Office: ${this.getF('areaOffice', 'Bhubaneswar')}.`, 10, false);
    this.drawCenteredTitle('COMPLETED BUILDING', 11, true);
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
      { label: '* Appointing Authority:', value: this.getF('appointingAuthority', 'LIC HFL(Cuttack)'), labelWidth: 110, valueWidth: halfW - 110 },
      { label: '* RERA No.(For Flats):', value: this.getF('reraNo', 'NA'), labelWidth: 110, valueWidth: halfW - 110 },
    ]);

    this.advanceCursor(4);

    // ==========================================
    // 1. PROPERTY DETAILS
    // ==========================================
    this.drawSectionHeader('1. PROPERTY DETAILS :');
    this.drawLICRow('a)', '* Name of the Applicant', this.getF('applicantName', ''));
    this.drawLICRow('b)', 'Document perused', this.getF('documentPerused', 'Copy of Sale Deed, ROR, Rent receipt & Approved Plan'));
    this.drawLICRow('c)', '* Location of the Property', '');
    this.drawLICRow('', 'Survey Number', this.getF('surveyNumber', ''));
    this.drawLICRow('', 'Block No./Village', this.getF('blockVillage', ''));
    this.drawLICRow('', 'Ward No./Taluk', this.getF('wardTaluk', ''));
    this.drawLICRow('', 'District/Municipality/Corporation', this.getF('districtMunicipality', ''));
    this.drawLICRow('d)', 'Location Sketch verified', this.getF('locationSketchVerified', 'Yes'));

    // Boundaries Grid
    this.drawLICRow('e)', 'Boundaries and Dimensions', '');
    const bSubW = (CONTENT_W - 24) / 2;
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 24, valueWidth: 0 },
      { label: `North/Front: ${this.getF('boundaryNorth', '')}`, value: '', labelWidth: bSubW, valueWidth: 0 },
      { label: `South/Rear: ${this.getF('boundarySouth', '')}`, value: '', labelWidth: bSubW, valueWidth: 0 },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 24, valueWidth: 0 },
      { label: `East/Left (side 1): ${this.getF('boundaryEast', '')}`, value: '', labelWidth: bSubW, valueWidth: 0 },
      { label: `West/Right (side 2): ${this.getF('boundaryWest', '')}`, value: '', labelWidth: bSubW, valueWidth: 0 },
    ]);

    this.drawLICRow('', 'Extent', `Plot Area: ${this.getF('plotAreaSqft', '')} sqft | Appr BUA: ${this.getF('approvedBua', '')} sqft | Meas BUA: ${this.getF('measuredBua', '')} sqft`);
    this.drawLICRow('f)', 'Type of the property', this.getF('propertyType', 'Bungalow'));
    this.drawLICRow('g)', 'Occupant', `Status: ${this.getF('occupantStatus', 'Self-Occupied')} | Name: ${this.getF('occupantName', 'NA')}`);
    this.drawLICRow('h)', 'Usage of the Building', this.getF('buildingUsage', 'Residential'));
    this.drawLICRow('i)', 'Details of the Nearby Landmark', this.getF('landmark', ''));
    this.drawLICRow('j)', 'Development of surrounding area', this.getF('surroundingDevelopment', 'Middle Class'));
    this.drawLICRow('k)', 'Basic amenities (water, electricity, roads, sewerage)', this.getF('basicAmenitiesAvailable', 'Yes'));
    this.drawLICRow('l)', 'Any negatives to locality/property', this.getF('negativesToLocality', 'No'));
    this.drawLICRow('m)', 'Favourable considerations for addl value', this.getF('favourableConsiderations', 'All civic amenities are within 1-2Kms.'));
    this.drawLICRow('n)', 'Any other feature (notice of court/authority/financier)', this.getF('otherFinancierNotice', 'Not Observed'));

    this.advanceCursor(4);

    // ==========================================
    // 2. DRAWING
    // ==========================================
    this.drawSectionHeader('2. DRAWING');
    this.drawLICRow('a)', 'Whether approved drawing is available?', this.getF('approvedDrawingAvailable', 'Yes'));
    this.drawLICRow('b)', 'Approval No. & date', this.getF('approvalNoDate', ''));
    this.drawLICRow('c)', 'Whether construction is as per approved plan?', this.getF('constructionAsPerPlan', 'Yes'));
    this.drawLICRow('d)', 'Deviations between approved drawing & actual?', this.getF('deviationsDrawingActual', 'NA'));
    this.drawLICRow('e)', 'Whether deviations are minor/major in nature', this.getF('deviationsNature', 'NA'));

    this.advanceCursor(4);

    // ==========================================
    // 3. BUILDING DETAILS
    // ==========================================
    this.drawSectionHeader('3. BUILDING DETAILS');
    this.drawLICRow('a)', 'Marketability of the Property', this.getF('marketability', 'Good'));
    this.drawLICRow('b)', 'Age of the building', `${this.getF('ageOfBuilding', '2')} Years`);
    this.drawLICRow('c)', 'Future residual life expected', `${this.getF('residualLife', '58')} Years`);
    this.drawLICRow('d)', 'Floor Space Index (FSI)', `Approved: ${this.getF('fsiApproved', '0.60')} | Actual: ${this.getF('fsiActual', '0.90')}`);
    this.drawLICRow('e)', 'Specifications (Foundation / Roof / Flooring)', `Found: ${this.getF('specFoundation', 'RCC Framed')} | Roof: ${this.getF('specRoof', 'RCC')} | Floor: ${this.getF('specFlooring', 'Marble/Tiles')}`);
    this.drawLICRow('f)', 'Quality of Construction (Exterior & Interior)', this.getF('qualityConstruction', 'Good'));
    this.drawLICRow('g)', 'Adheres to Safety specs (NBC 2005 & NDMA)?', this.getF('safetySpecsComplied', 'Yes'));
    this.drawLICRow('h)', 'High Tension Wire lines passing through?', this.getF('highTensionLines', 'No'));

    this.advanceCursor(4);

    // ==========================================
    // 4. VALUATION DETAILS
    // ==========================================
    this.drawSectionHeader('4. VALUATION DETAILS');

    const vColW = [120, 75, 75, 95, 80, CONTENT_W - 445];
    this.drawKeyValueRow([
      { label: 'Description', value: '', labelWidth: vColW[0], valueWidth: 0, labelBold: true, highlight: true },
      { label: 'Area sqft', value: '', labelWidth: vColW[1], valueWidth: 0, labelBold: true, highlight: true },
      { label: 'Market Rate', value: '', labelWidth: vColW[2], valueWidth: 0, labelBold: true, highlight: true },
      { label: 'Estimated MV', value: '', labelWidth: vColW[3], valueWidth: 0, labelBold: true, highlight: true },
      { label: 'Guide Rate', value: '', labelWidth: vColW[4], valueWidth: 0, labelBold: true, highlight: true },
      { label: 'Guide Value', value: '', labelWidth: vColW[5], valueWidth: 0, labelBold: true, highlight: true },
    ]);

    const landArea = parseFloat(this.getF('landAreaSqft', '0')) || 0;
    const landRate = parseFloat(this.getF('landRateSft', '0')) || 0;
    const landVal = Math.round(landArea * landRate);
    const landGuideRate = parseFloat(this.getF('landGuidelineRate', '0')) || 0;
    const landGuideVal = Math.round(landArea * landGuideRate);

    const gfArea = parseFloat(this.getF('bldgGfArea', '0')) || 0;
    const gfRate = parseFloat(this.getF('bldgGfRate', '0')) || 0;
    const gfVal = Math.round(gfArea * gfRate);
    const gfGuideRate = parseFloat(this.getF('bldgGfGuideRate', '0')) || 0;
    const gfGuideVal = Math.round(gfArea * gfGuideRate);

    const ffArea = parseFloat(this.getF('bldgFfArea', '0')) || 0;
    const ffRate = parseFloat(this.getF('bldgFfRate', '0')) || 0;
    const ffVal = Math.round(ffArea * ffRate);
    const ffGuideRate = parseFloat(this.getF('bldgFfGuideRate', '0')) || 0;
    const ffGuideVal = Math.round(ffArea * ffGuideRate);

    const totalMV = landVal + gfVal + ffVal;
    const totalGV = landGuideVal + gfGuideVal + ffGuideVal;

    // Land row
    this.drawKeyValueRow([
      { label: 'Land', value: '', labelWidth: vColW[0], valueWidth: 0, labelBold: true },
      { label: `${landArea} sqft`, value: '', labelWidth: vColW[1], valueWidth: 0 },
      { label: `Rs.${formatIndianCurrency(landRate)}/-`, value: '', labelWidth: vColW[2], valueWidth: 0 },
      { label: `Rs.${formatIndianCurrency(landVal)}/-`, value: '', labelWidth: vColW[3], valueWidth: 0, labelBold: true },
      { label: `Rs.${formatIndianCurrency(landGuideRate)}/-`, value: '', labelWidth: vColW[4], valueWidth: 0 },
      { label: `Rs.${formatIndianCurrency(landGuideVal)}/-`, value: '', labelWidth: vColW[5], valueWidth: 0 },
    ]);

    // Building GF
    this.drawKeyValueRow([
      { label: 'Building GF', value: '', labelWidth: vColW[0], valueWidth: 0 },
      { label: `${gfArea} sqft`, value: '', labelWidth: vColW[1], valueWidth: 0 },
      { label: `Rs.${formatIndianCurrency(gfRate)}/-`, value: '', labelWidth: vColW[2], valueWidth: 0 },
      { label: `Rs.${formatIndianCurrency(gfVal)}/-`, value: '', labelWidth: vColW[3], valueWidth: 0 },
      { label: `Rs.${formatIndianCurrency(gfGuideRate)}/-`, value: '', labelWidth: vColW[4], valueWidth: 0 },
      { label: `Rs.${formatIndianCurrency(gfGuideVal)}/-`, value: '', labelWidth: vColW[5], valueWidth: 0 },
    ]);

    // Building FF
    this.drawKeyValueRow([
      { label: 'Building FF', value: '', labelWidth: vColW[0], valueWidth: 0 },
      { label: `${ffArea} sqft`, value: '', labelWidth: vColW[1], valueWidth: 0 },
      { label: `Rs.${formatIndianCurrency(ffRate)}/-`, value: '', labelWidth: vColW[2], valueWidth: 0 },
      { label: `Rs.${formatIndianCurrency(ffVal)}/-`, value: '', labelWidth: vColW[3], valueWidth: 0 },
      { label: `Rs.${formatIndianCurrency(ffGuideRate)}/-`, value: '', labelWidth: vColW[4], valueWidth: 0 },
      { label: `Rs.${formatIndianCurrency(ffGuideVal)}/-`, value: '', labelWidth: vColW[5], valueWidth: 0 },
    ]);

    // Total Value
    this.drawKeyValueRow([
      { label: 'Total Value:', value: '', labelWidth: vColW[0] + vColW[1] + vColW[2], valueWidth: 0, labelBold: true, highlight: true },
      { label: `Rs.${formatIndianCurrency(totalMV)}/-`, value: '', labelWidth: vColW[3], valueWidth: 0, labelBold: true, highlight: true },
      { label: '', value: '', labelWidth: vColW[4], valueWidth: 0, highlight: true },
      { label: `Rs.${formatIndianCurrency(totalGV)}/-`, value: '', labelWidth: vColW[5], valueWidth: 0, labelBold: true, highlight: true },
    ]);

    this.drawLICRow('', 'State the source for arriving at Market Value', this.getF('marketValueSource', 'By analysis of rates of material, labour etc & from local market data of similar properties.'));

    this.advanceCursor(4);

    // ==========================================
    // 5 & 6. IMPROVEMENTS & REMARKS
    // ==========================================
    this.drawSectionHeader('5. ESTIMATE FOR IMPROVEMENT & 6. PROGRESS OF WORK');
    this.drawLICRow('5.', 'Estimated Value of Property after improvements', this.getF('estimatedValueAfterImprovements', 'NA'));
    this.drawLICRow('8.', 'Remarks if any', this.getF('technicalRemarks', 'Subject property is a G+1 storied residential building. Valuation has been done for land & approved built-up area of G+1 only.'));

    this.advanceCursor(4);

    // 5 Mandatory Methodology Bullet Points
    this.drawSectionHeader('MANDATORY VALUATION METHODOLOGY STATEMENTS :');
    const statements = [
      `• Background information of the asset being valued: ${this.getF('methodologyBackground', 'Subject property is a G+1 storied residential building accessed via 20-feet wide road.')}`,
      `• Sources of information used for valuation of property: ${this.getF('methodologySources', 'Recent transactions, Property Brokers, local market feedback.')}`,
      `• Procedures adopted in carrying out the valuation: ${this.getF('methodologyProcedures', 'Land value arrived by comparing similar land parcels; building value arrived by cost incurred.')}`,
      `• Valuation methodology: ${this.getF('methodologyAdopted', 'Land & Building method of valuation adopted.')}`,
      `• Major factors that influenced the valuation: ${this.getF('methodologyFactors', 'Location & accessibility to civic amenities etc.')}`,
    ];
    statements.forEach((stmt) => {
      this.drawKeyValueRow([
        { label: stmt, value: '', labelWidth: CONTENT_W, valueWidth: 0 },
      ]);
    });

    this.advanceCursor(6);

    // ==========================================
    // 9. CERTIFICATE
    // ==========================================
    this.drawSectionHeader('9. CERTIFICATE');
    const certText = `I declare that I am not associated with the builder or with any of his associate companies or with the borrower directly or indirectly in the past or in the present and this report has been prepared by me with highest professional integrity.\n\nI further declare that I have personally inspected the site and building on ${this.getF('inspectionDate', '13/12/2020')}.\n\nI further declare that all the above particulars and information given in this report are true to the best of my knowledge and belief.`;
    this.drawKeyValueRow([
      { label: certText, value: '', labelWidth: CONTENT_W, valueWidth: 0 },
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
