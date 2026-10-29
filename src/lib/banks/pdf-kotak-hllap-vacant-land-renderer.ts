import { PDFKotakHLLAPBaseRenderer } from './pdf-kotak-hllap-base-renderer';
import { CONTENT_W } from '../pdf-bank-renderer';

export class PDFKotakHLLAPVacantLandRenderer extends PDFKotakHLLAPBaseRenderer {
  override async render(): Promise<Uint8Array> {
    await this.init();

    // 1. Kotak Format Header
    this.drawKotakHeader('Land Only Method');

    // 2. Section 1: General (isVacantLand = true, omits project/society name)
    this.drawGeneralSection(true);

    // 3. Section 2: Property (isVacantLand = true, includes roads amenities & encroachment, omits building details)
    this.drawPropertySection(true);

    // 4. Section 3: Surroundings
    this.drawSurroundingsSection();

    // NOTE: Section 4: SURVEY OF CONSTRUCTION is 100% OMITTED for Vacant Land!

    // 5. Section 4: Documents Verified (Numbered 4 for Vacant Land)
    this.drawDocumentsSection(true, false);

    // 6. Section 5: Valuation Report (Numbered 5 for Vacant Land)
    this.drawSectionHeader('5. VALUATION REPORT');

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
      { label: 'A. VACANT LAND MEASUREMENT & VALUATION', value: '', labelWidth: CONTENT_W, valueWidth: 0, labelBold: true },
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
      { label: 'Undivided share of land (UDS)', value: 'NA', labelWidth: 180, valueWidth: 120 },
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

    // NOTE: Building Sub-Table is 100% OMITTED for Vacant Land!

    // C. Amenities Sub-Table
    this.drawAmenitiesSubTable();

    // D. Valuation Totals
    this.drawKeyValueRow([
      {
        label: 'Market Value as per Land Only Method (in Rs.)',
        value: this.cleanStr(this.getF('marketValueAsPerMethod') || this.getF('finalMarketValue')),
        labelWidth: 260,
        valueWidth: CONTENT_W - 260,
        labelBold: true,
        valueBold: true,
        highlight: true,
      },
    ]);

    // 7. Section 6: Final Values & Declaration (Numbered 6, includeInsurable = false, isVacantLand = true)
    this.drawFinalValuesSection(false, true);

    // 8. Universal Enclosures
    await this.drawKotakEnclosures();

    return await this.save();
  }
}
