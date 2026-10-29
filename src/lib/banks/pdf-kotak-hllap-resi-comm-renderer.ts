import { PDFKotakHLLAPBaseRenderer } from './pdf-kotak-hllap-base-renderer';
import { CONTENT_W } from '../pdf-bank-renderer';

export class PDFKotakHLLAPResiCommRenderer extends PDFKotakHLLAPBaseRenderer {
  override async render(): Promise<Uint8Array> {
    await this.init();

    // 1. Kotak Format Header
    this.drawKotakHeader('Residential cum Commercial Method');

    // 2. Section 1: General
    this.drawGeneralSection(false);

    // 3. Section 2: Property
    this.drawPropertySection(false);

    // 4. Section 3: Surroundings
    this.drawSurroundingsSection();

    // 5. Section 4: Construction
    this.drawConstructionSection();

    // 6. Section 5: Documents Verified
    this.drawDocumentsSection(false, false);

    // 7. Section 6: Valuation Report (Residential cum Commercial Method)
    this.drawSectionHeader('6. VALUATION REPORT');

    this.drawKeyValueRow([
      {
        label: 'Area measured on site',
        value: `${this.cleanStr(this.getF('areaMeasuredOnSite'))} [Basis: ${this.cleanStr(this.getF('areaMeasuredBasis'), 'Built up Area')}]`,
        labelWidth: 180,
        valueWidth: CONTENT_W - 180,
      },
    ]);

    // Land Sub-Table (UDS)
    this.drawKeyValueRow([
      { label: 'A. LAND EXTENT / SHARE', value: '', labelWidth: CONTENT_W, valueWidth: 0, labelBold: true },
    ]);
    this.drawKeyValueRow([
      {
        label: 'Undivided share of land (UDS)',
        value: this.cleanStr(this.getF('udsShare')),
        labelWidth: 180,
        valueWidth: CONTENT_W - 180,
      },
    ]);

    // Building Sub-Table
    this.drawKeyValueRow([
      { label: 'B. RESIDENTIAL CUM COMMERCIAL UNIT MEASUREMENT & VALUATION', value: '', labelWidth: CONTENT_W, valueWidth: 0, labelBold: true },
    ]);

    // Carpet Area comparison
    this.drawKeyValueRow([
      { label: 'Carpet Area: As per Site', value: this.cleanStr(this.getF('carpetAreaSiteSqFt')), labelWidth: 140, valueWidth: 70 },
      { label: 'As per Plan', value: this.cleanStr(this.getF('carpetAreaPlanSqFt')), labelWidth: 80, valueWidth: 70 },
      { label: 'As per Legal Doc', value: this.cleanStr(this.getF('carpetAreaDeedSqFt')), labelWidth: 100, valueWidth: CONTENT_W - 460 },
    ]);

    // Built Up Area comparison
    this.drawKeyValueRow([
      { label: 'Built Up Area: As per Site', value: this.cleanStr(this.getF('buaSiteSqFt')), labelWidth: 140, valueWidth: 70 },
      { label: 'As per Plan', value: this.cleanStr(this.getF('buaPlanSqFt')), labelWidth: 80, valueWidth: 70 },
      { label: 'As per Legal Doc', value: this.cleanStr(this.getF('buaDeedSqFt')), labelWidth: 100, valueWidth: CONTENT_W - 460 },
    ]);

    // Super BUA & Adopted Area
    this.drawKeyValueRow([
      { label: 'Super BUA (SuBA)', value: this.cleanStr(this.getF('superBuaSqFt')), labelWidth: 180, valueWidth: 120 },
      { label: 'Adopted Area as per', value: this.cleanStr(this.getF('adoptedAreaBasis'), 'Built Up Area As per Legal Doc'), labelWidth: 130, valueWidth: CONTENT_W - 430 },
    ]);
    this.drawKeyValueRow([
      { label: 'Adopted Area (in Sq.Ft)', value: this.cleanStr(this.getF('adoptedAreaSqFt')), labelWidth: 180, valueWidth: 120, valueBold: true },
      { label: 'Final Adopted Rate (in Rs.)', value: this.cleanStr(this.getF('finalAdoptedRatePerSqFt')), labelWidth: 140, valueWidth: CONTENT_W - 440, valueBold: true },
    ]);
    this.drawKeyValueRow([
      { label: 'Market Value without Amenities (in Rs.)', value: this.cleanStr(this.getF('marketValueWithoutAmenities')), labelWidth: 220, valueWidth: CONTENT_W - 220, valueBold: true },
    ]);
    this.drawKeyValueRow([
      { label: 'Market Value w/o Amenities (Present Stage)', value: this.cleanStr(this.getF('marketValuePresentStage')), labelWidth: 220, valueWidth: CONTENT_W - 220 },
    ]);

    // Amenities Sub-Table
    this.drawAmenitiesSubTable();

    // Valuation Totals
    this.drawKeyValueRow([
      {
        label: 'Market Value as per Residential cum Commercial Method (in Rs.)',
        value: this.cleanStr(this.getF('marketValueAsPerMethod') || this.getF('finalMarketValue')),
        labelWidth: 320,
        valueWidth: CONTENT_W - 320,
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
