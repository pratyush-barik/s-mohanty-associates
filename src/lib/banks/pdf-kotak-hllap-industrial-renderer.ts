import { PDFKotakHLLAPBaseRenderer } from './pdf-kotak-hllap-base-renderer';
import { CONTENT_W } from '../pdf-bank-renderer';

export class PDFKotakHLLAPIndustrialRenderer extends PDFKotakHLLAPBaseRenderer {
  override async render(): Promise<Uint8Array> {
    await this.init();

    // 1. Kotak Format Header
    this.drawKotakHeader('Industrial Property Method');

    // 2. Section 1: General
    this.drawGeneralSection(false);

    // 3. Section 2: Property
    this.drawPropertySection(false);

    // 4. Section 3: Surroundings
    this.drawSurroundingsSection();

    // 5. Section 4: Construction
    this.drawConstructionSection();

    // 6. Section 5: Documents Verified (with Industrial extended utility bills)
    this.drawDocumentsSection(false, true);

    // 7. Section 6: Valuation Report (Industrial Property Method)
    this.drawSectionHeader('6. VALUATION REPORT');

    this.drawKeyValueRow([
      {
        label: 'Area measured on site',
        value: `${this.cleanStr(this.getF('areaMeasuredOnSite'))} [Basis: ${this.cleanStr(this.getF('areaMeasuredBasis'), 'Plot Area')}]`,
        labelWidth: 180,
        valueWidth: CONTENT_W - 180,
      },
    ]);

    // A. Land Sub-Table
    this.drawKeyValueRow([
      { label: 'A. INDUSTRIAL LAND MEASUREMENT & VALUATION', value: '', labelWidth: CONTENT_W, valueWidth: 0, labelBold: true },
    ]);
    this.drawKeyValueRow([
      { label: 'Gross Land Area (in Sq.Ft)', value: this.cleanStr(this.getF('grossLandAreaSqFt')), labelWidth: 180, valueWidth: CONTENT_W - 180 },
    ]);
    this.drawKeyValueRow([
      { label: 'Net Land Area: As per Site', value: this.cleanStr(this.getF('netLandAreaSiteSqFt')), labelWidth: 140, valueWidth: 70 },
      { label: 'As per Plan', value: this.cleanStr(this.getF('netLandAreaPlanSqFt')), labelWidth: 80, valueWidth: 70 },
      { label: 'As per Legal Doc', value: this.cleanStr(this.getF('netLandAreaDeedSqFt')), labelWidth: 100, valueWidth: CONTENT_W - 460 },
    ]);
    this.drawKeyValueRow([
      { label: 'Undivided share of land (UDS)', value: this.cleanStr(this.getF('udsShare'), 'NA'), labelWidth: 180, valueWidth: 120 },
      { label: 'Adopted Land Area as per', value: this.cleanStr(this.getF('adoptedLandAreaBasis'), 'Net Land Area As per Legal Doc'), labelWidth: 130, valueWidth: CONTENT_W - 430 },
    ]);
    this.drawKeyValueRow([
      { label: 'Adopted Land Area (in Sq.Ft)', value: this.cleanStr(this.getF('adoptedLandAreaSqFt')), labelWidth: 180, valueWidth: 120, valueBold: true },
      { label: 'Adopted Land Rate (in Rs.)', value: this.cleanStr(this.getF('adoptedLandRatePerSqFt')), labelWidth: 130, valueWidth: CONTENT_W - 430, valueBold: true },
    ]);
    this.drawKeyValueRow([
      { label: 'Govt Guideline Rate - Land (in Rs.)', value: this.cleanStr(this.getF('govtGuidelineRateLand')), labelWidth: 180, valueWidth: 120 },
      { label: 'LAND VALUE: (in Rs.) (i)', value: this.cleanStr(this.getF('landValueI')), labelWidth: 130, valueWidth: CONTENT_W - 430, valueBold: true, highlight: true },
    ]);

    // B. Building / Shed Sub-Table
    this.drawKeyValueRow([
      { label: 'B. INDUSTRIAL SHED / STRUCTURE VALUATION', value: '', labelWidth: CONTENT_W, valueWidth: 0, labelBold: true },
    ]);
    this.drawKeyValueRow([
      { label: 'Carpet Area: As per Site', value: this.cleanStr(this.getF('carpetAreaSiteSqFt')), labelWidth: 140, valueWidth: 70 },
      { label: 'As per Plan', value: this.cleanStr(this.getF('carpetAreaPlanSqFt')), labelWidth: 80, valueWidth: 70 },
      { label: 'As per Legal Doc', value: this.cleanStr(this.getF('carpetAreaDeedSqFt')), labelWidth: 100, valueWidth: CONTENT_W - 460 },
    ]);
    this.drawKeyValueRow([
      { label: 'Built Up Area: As per Site', value: this.cleanStr(this.getF('buaSiteSqFt')), labelWidth: 140, valueWidth: 70 },
      { label: 'As per Plan', value: this.cleanStr(this.getF('buaPlanSqFt')), labelWidth: 80, valueWidth: 70 },
      { label: 'As per Legal Doc', value: this.cleanStr(this.getF('buaDeedSqFt')), labelWidth: 100, valueWidth: CONTENT_W - 460 },
    ]);

    // Floor-wise Area Matrix
    const floorRows = this.fields.floorWiseRows || [];
    if (floorRows.length > 0) {
      this.drawKeyValueRow([
        { label: 'Floor-wise Area Breakdown (Industrial Shed / Admin Block)', value: '', labelWidth: CONTENT_W, valueWidth: 0, labelBold: true },
      ]);
      for (const f of floorRows) {
        this.drawKeyValueRow([
          { label: `${f.floor} (Site BUA)`, value: this.cleanStr(f.siteBua), labelWidth: 140, valueWidth: 100 },
          { label: 'Plan BUA', value: this.cleanStr(f.planBua), labelWidth: 80, valueWidth: CONTENT_W - 320 },
        ]);
      }
    }

    this.drawKeyValueRow([
      { label: 'Super BUA (SuBA)', value: this.cleanStr(this.getF('superBuaSqFt')), labelWidth: 180, valueWidth: 120 },
      { label: 'Adopted Area as per', value: this.cleanStr(this.getF('adoptedAreaBasis'), 'Built Up Area As per Legal Doc'), labelWidth: 130, valueWidth: CONTENT_W - 430 },
    ]);
    this.drawKeyValueRow([
      { label: 'Adopted Structure Area (Sq.Ft)', value: this.cleanStr(this.getF('adoptedAreaSqFt')), labelWidth: 180, valueWidth: 120, valueBold: true },
      { label: 'Adopted Construction Rate (in Rs.)', value: this.cleanStr(this.getF('adoptedConstructionMarketRate')), labelWidth: 140, valueWidth: CONTENT_W - 440, valueBold: true },
    ]);
    this.drawKeyValueRow([
      { label: 'Building Value as per Govt Guideline', value: this.cleanStr(this.getF('bldgValueGovtGuideline')), labelWidth: 180, valueWidth: 120 },
      { label: 'Construction Value – Present Stage', value: this.cleanStr(this.getF('constructionValuePresentStage')), labelWidth: 140, valueWidth: CONTENT_W - 440 },
    ]);
    this.drawKeyValueRow([
      { label: 'Estimated Cost to complete property', value: this.cleanStr(this.getF('estimatedCostToComplete')), labelWidth: 180, valueWidth: 120 },
      { label: 'Construction Value - 100% Complete (ii)', value: this.cleanStr(this.getF('constructionValueIi')), labelWidth: 150, valueWidth: CONTENT_W - 450, valueBold: true, highlight: true },
    ]);

    // C. Amenities Sub-Table
    this.drawAmenitiesSubTable();

    // D. Valuation Totals
    this.drawKeyValueRow([
      {
        label: 'Market Value as per Industrial Property Method (in Rs.)',
        value: this.cleanStr(this.getF('marketValueAsPerMethod') || this.getF('finalMarketValue')),
        labelWidth: 260,
        valueWidth: CONTENT_W - 260,
        labelBold: true,
        valueBold: true,
        highlight: true,
      },
    ]);

    // 8. Section 7: Final Values & Declaration (with Insurable Value)
    this.drawFinalValuesSection(true, false);

    // 9. Universal Enclosures
    await this.drawKotakEnclosures();

    return await this.save();
  }
}
