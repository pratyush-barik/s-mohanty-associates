import {
  PDFBankRenderer,
  CONTENT_W,
} from '../pdf-bank-renderer';
import { formatIndianCurrency } from '../numberToWords';

export class PDFLICPVR5Renderer extends PDFBankRenderer {
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

  private drawLICRow(num: string, label: string, value: string, boldVal: boolean = false) {
    const numW = 24;
    const labelW = 240;
    const valW = CONTENT_W - numW - labelW;

    this.drawKeyValueRow([
      { label: num, value: '', labelWidth: numW, valueWidth: 0, labelBold: true },
      { label, value: '', labelWidth: labelW, valueWidth: 0 },
      { label: '', value: value || 'NA', labelWidth: 0, valueWidth: valW, valueBold: boldVal },
    ]);
  }

  async drawContent(): Promise<void> {
    // Top Header Banner
    this.drawCenteredTitle('PVR-5', 13, true);
    this.drawCenteredTitle('LIC HOUSING FINANCE LIMITED', 14, true);
    this.drawCenteredTitle(`Area Office: ${this.getF('areaOffice', 'Bhubaneswar')}.`, 10, false);
    this.drawCenteredTitle('HOUSE CONSTRUCTION', 11, true);
    this.advanceCursor(4);
    this.drawCenteredTitle('SUBSEQUENT VALUATION REPORT BY PANEL VALUER FOR HOME LOAN', 10, true);
    this.advanceCursor(6);

    // Meta Grid: File No, Name of Valuer, Code No, Date of Valuation
    const halfW = CONTENT_W / 2;
    this.drawKeyValueRow([
      { label: '* File No.:', value: this.getF('fileNo', ''), labelWidth: 100, valueWidth: halfW - 100, labelBold: true },
      { label: 'Date of Valuation:', value: this.getF('dateOfValuation', ''), labelWidth: 110, valueWidth: halfW - 110, labelBold: true },
    ]);
    this.drawKeyValueRow([
      { label: '* Name of the Valuer:', value: this.getF('nameOfValuer', 'Er. Satyajit Mohanty'), labelWidth: 110, valueWidth: halfW - 110 },
      { label: '* Code No.:', value: this.getF('codeNo', 'BH-AOV0078'), labelWidth: 80, valueWidth: halfW - 80 },
    ]);

    this.advanceCursor(4);

    // ==========================================
    // A. GENERAL
    // ==========================================
    this.drawSectionHeader('A. GENERAL');
    this.drawLICRow('1.', '* File No.', this.getF('fileNo', ''));
    this.drawLICRow('2.', 'Previous report date and reference no.', this.getF('previousReportDateRef', ''));
    this.drawLICRow('3.', '* Name of the Applicant', this.getF('applicantName', ''));
    this.drawLICRow('4.', 'Date of inspection', this.getF('dateOfInspection', ''));
    this.drawLICRow('5.', '* Location of the property', this.getF('propertyLocation', ''));
    this.drawLICRow('6.', 'Plot No./ S. No./C.T.S.No. /R.S.No.', this.getF('plotSurveyNo', ''));
    this.drawLICRow('7.', 'Village Block No. / Taluk / Ward.', this.getF('villageTalukWard', ''));
    this.drawLICRow('8.', 'District / Corporation / Municipality', this.getF('districtMunicipality', ''));

    this.advanceCursor(4);

    // ==========================================
    // B. INSPECTION
    // ==========================================
    this.drawSectionHeader('B. INSPECTION');
    this.drawLICRow('1', 'Construction Details', '');

    const cColW = [210, 140, CONTENT_W - 350];
    this.drawKeyValueRow([
      { label: 'Description', value: '', labelWidth: cColW[0], valueWidth: 0, labelBold: true, highlight: true },
      { label: 'As per approved plan', value: '', labelWidth: cColW[1], valueWidth: 0, labelBold: true, highlight: true },
      { label: 'As per actual', value: '', labelWidth: cColW[2], valueWidth: 0, labelBold: true, highlight: true },
    ]);
    this.drawKeyValueRow([
      { label: '', value: 'i) Plinth area', labelWidth: 0, valueWidth: cColW[0] },
      { label: '', value: this.getF('plinthApproved', 'NA'), labelWidth: 0, valueWidth: cColW[1] },
      { label: '', value: this.getF('plinthActual', 'NA'), labelWidth: 0, valueWidth: cColW[2] },
    ]);
    this.drawKeyValueRow([
      { label: '', value: 'ii) F.S.I.', labelWidth: 0, valueWidth: cColW[0] },
      { label: '', value: this.getF('fsiApproved', 'NA'), labelWidth: 0, valueWidth: cColW[1] },
      { label: '', value: this.getF('fsiActual', 'NA'), labelWidth: 0, valueWidth: cColW[2] },
    ]);
    this.drawKeyValueRow([
      { label: '', value: 'iii) No. Of dwelling units', labelWidth: 0, valueWidth: cColW[0] },
      { label: '', value: this.getF('unitsApproved', '1'), labelWidth: 0, valueWidth: cColW[1] },
      { label: '', value: this.getF('unitsActual', '1'), labelWidth: 0, valueWidth: cColW[2] },
    ]);

    this.drawLICRow('2', 'Whether construction is as per approved plan?', this.getF('constructionAsPerPlan', 'Yes'));
    this.drawLICRow('3', 'Deviations (Please mention in detail)', '');
    this.drawLICRow('', 'i) What are deviations between approved & actual?', this.getF('deviationApprovedActual', 'NA'));
    this.drawLICRow('', 'ii) Whether deviation are minor/major nature', this.getF('deviationMinorMajor', 'NA'));
    this.drawLICRow('', 'iii) Whether revised approval is necessary', this.getF('deviationRevisedApproval', 'No'));
    this.drawLICRow('4', 'Safety specs adherence (NBC 2005)?', this.getF('safetySpecsComplied', 'Yes'));
    this.drawLICRow('5', 'High Tension Wire Lines passing through?', this.getF('highTensionLines', 'No'));

    this.advanceCursor(4);

    // ==========================================
    // C. TOTAL VALUE
    // ==========================================
    this.drawSectionHeader('C. TOTAL VALUE');

    const tvColW = [35, 190, 85, 85, CONTENT_W - 395];
    this.drawKeyValueRow([
      { label: '#', value: '', labelWidth: tvColW[0], valueWidth: 0, labelBold: true, highlight: true },
      { label: 'Description', value: '', labelWidth: tvColW[1], valueWidth: 0, labelBold: true, highlight: true },
      { label: 'As per App', value: '', labelWidth: tvColW[2], valueWidth: 0, labelBold: true, highlight: true },
      { label: 'Guideline', value: '', labelWidth: tvColW[3], valueWidth: 0, labelBold: true, highlight: true },
      { label: 'Market Value (Rs.)', value: '', labelWidth: tvColW[4], valueWidth: 0, labelBold: true, highlight: true },
    ]);

    const landVal = parseFloat(this.getF('landMarketValue', '0')) || 0;
    const stagePct = this.getF('stageOfConstructionPct', '100');
    const stageConstVal = parseFloat(this.getF('stageConstMarketValue', '0')) || 0;
    const totalPresentVal = landVal + stageConstVal;
    const bldg100Val = parseFloat(this.getF('bldg100CompletionValue', '0')) || 0;

    this.drawKeyValueRow([
      { label: '', value: '1', labelWidth: 0, valueWidth: tvColW[0], valueBold: true },
      { label: '', value: 'Value of land *', labelWidth: 0, valueWidth: tvColW[1] },
      { label: '', value: this.getF('landAsPerApp', 'NA'), labelWidth: 0, valueWidth: tvColW[2] },
      { label: '', value: this.getF('landGuidelineVal', 'NA'), labelWidth: 0, valueWidth: tvColW[3] },
      { label: '', value: `Rs.${formatIndianCurrency(landVal)}/-`, labelWidth: 0, valueWidth: tvColW[4], valueBold: true },
    ]);

    this.drawKeyValueRow([
      { label: '', value: '2', labelWidth: 0, valueWidth: tvColW[0], valueBold: true },
      { label: '', value: `Present Stage of construction is ${stagePct}%`, labelWidth: 0, valueWidth: tvColW[1] },
      { label: '', value: `Rs.${formatIndianCurrency(bldg100Val)}/-`, labelWidth: 0, valueWidth: tvColW[2] },
      { label: '', value: this.getF('stageGuidelineVal', 'NA'), labelWidth: 0, valueWidth: tvColW[3] },
      { label: '', value: `Rs.${formatIndianCurrency(stageConstVal)}/-`, labelWidth: 0, valueWidth: tvColW[4], valueBold: true },
    ]);

    this.drawKeyValueRow([
      { label: '', value: '3', labelWidth: 0, valueWidth: tvColW[0], valueBold: true },
      { label: '', value: 'Total present value of existing building (1+2)', labelWidth: 0, valueWidth: tvColW[1], valueBold: true },
      { label: '', value: '', labelWidth: 0, valueWidth: tvColW[2] },
      { label: '', value: '', labelWidth: 0, valueWidth: tvColW[3] },
      { label: '', value: `Rs.${formatIndianCurrency(totalPresentVal)}/-`, labelWidth: 0, valueWidth: tvColW[4], valueBold: true, highlight: true },
    ]);

    this.drawKeyValueRow([
      { label: '', value: '4', labelWidth: 0, valueWidth: tvColW[0], valueBold: true },
      { label: '', value: 'Value of building on 100% completion', labelWidth: 0, valueWidth: tvColW[1], valueBold: true },
      { label: '', value: '', labelWidth: 0, valueWidth: tvColW[2] },
      { label: '', value: '', labelWidth: 0, valueWidth: tvColW[3] },
      { label: '', value: `Rs.${formatIndianCurrency(bldg100Val)}/-`, labelWidth: 0, valueWidth: tvColW[4], valueBold: true, highlight: true },
    ]);

    this.advanceCursor(6);

    // ==========================================
    // D. CERTIFICATE
    // ==========================================
    this.drawSectionHeader('D. CERTIFICATE');
    const certBullet1 = `• I declare that I am not associated with the builder or with any of his associate companies or with the borrower directly or indirectly in the past or in the present and this report has been prepared by me with highest professional integrity.`;
    const certBullet2 = `• I further declare that I have personally inspected the site and building on ${this.getF('inspectionDate', '') || 'NA'}.`;
    const certBullet3 = `• I further declare that all the above particulars and information given in this report are true to the best of my knowledge and belief.`;

    this.drawKeyValueRow([{ label: '', value: certBullet1, labelWidth: 0, valueWidth: CONTENT_W }]);
    this.drawKeyValueRow([{ label: '', value: certBullet2, labelWidth: 0, valueWidth: CONTENT_W }]);
    this.drawKeyValueRow([{ label: '', value: certBullet3, labelWidth: 0, valueWidth: CONTENT_W }]);

    this.advanceCursor(12);

    this.drawKeyValueRow([
      { label: `Station: ${this.getF('valuationStation', 'Bhubaneswar')}.\nDate: ${this.getF('dateOfValuation', '')}`, value: '', labelWidth: halfW, valueWidth: 0, labelBold: true },
      { label: 'SIGNATURE OF THE VALUER\n(M/s. S MOHANTY ASSOCIATES)', value: '', labelWidth: halfW, valueWidth: 0, labelBold: true },
    ]);

    // Attachments
    if (this.fields.propertyImages?.length > 0) {
      await this.drawPhotoGrid(this.fields.propertyImages);
    }
    if (this.fields.locationMapImages?.length > 0 || this.fields.mouzaMapImages?.length > 0) {
      await this.drawMapGallery([...(this.fields.locationMapImages || []), ...(this.fields.mouzaMapImages || [])], 'LOCATION SKETCH / PROGRESS MAPS');
    }
    if (this.fields.documentImages?.length > 0) {
      await this.drawDocumentsGallery(this.fields.documentImages);
    }
  }
}
