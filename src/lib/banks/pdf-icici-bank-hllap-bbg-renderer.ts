import { PDFBankRenderer } from '../pdf-bank-renderer';
import { rgb } from 'pdf-lib';
import {
  FONT_SIZE,
  FONT_SIZE_HEADER,
  LINE_HEIGHT,
  BORDER_W,
  LBL_BG,
  OPT_BG,
  BG_OPACITY,
  hexToRgb,
  MARGIN_L,
  CONTENT_W,
} from '../pdf-bank-renderer';

export class PDFIciciBankHlLapBbgRenderer extends PDFBankRenderer {
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
    // Draw Title
    this.page.drawRectangle({
      x: MARGIN_L, y: this.pdfY(this.cursorY) - 25, width: CONTENT_W, height: 25,
      color: rgb(1, 1, 1), borderColor: rgb(0,0,0), borderWidth: BORDER_W
    });
    this.page.drawText('VALUATION REPORT FOR ICICI BANK LIMITED', {
      x: MARGIN_L + CONTENT_W / 2 - 140, y: this.pdfY(this.cursorY) - 17,
      size: FONT_SIZE_HEADER + 1, font: this.fontBold, color: rgb(0,0,0)
    });
    this.cursorY += 25;

    // SECTION 1
    this.drawSectionHeader('1 CUSTOMER DETAILS');
    
    this.drawKeyValueRow([
      { label: 'Ref No', value: this.getF('iciciBbgRefNo') || 'NA' },
      { label: 'Date', value: this.getF('iciciBbgDate') || 'NA' }
    ]);
    
    this.drawKeyValueRow([
      { label: 'Format for Resale / LAP / Builder (if non APF) / Balance Transfer/ Land Loan', value: this.getF('iciciBbgFormat') || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }
    ]);

    this.drawKeyValueRow([
      { label: 'Customer Name', value: this.getF('iciciBbgCustomerName') || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }
    ]);

    this.drawKeyValueRow([
      { label: 'Application Number', value: this.getF('iciciBbgAppNo') || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }
    ]);
    
    this.drawKeyValueRow([
      { label: 'DMA/ Nodal Point', value: this.getF('iciciBbgDmaNodal') || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }
    ]);

    const caseType = this.getF('iciciBbgCaseType') === 'Custom' ? this.getF('iciciBbgCaseTypeCustom') : this.getF('iciciBbgCaseType');
    this.drawKeyValueRow([
      { label: 'Case Type', value: caseType || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }
    ]);
    
    this.cursorY += 10;

    // SECTION 2
    this.drawSectionHeader('2 PROPERTY DETAILS');
    this.drawKeyValueRow([
      { label: 'Address of Property', value: this.getF('iciciBbgAddressOfProperty') || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }
    ]);
    const legalAddr = this.getF('iciciBbgLegalAddressSame') ? this.getF('iciciBbgAddressOfProperty') : this.getF('iciciBbgLegalAddress');
    this.drawKeyValueRow([
      { label: 'Legal Address (Survey No. / FP No. / Khasra No./ Plot No)', value: legalAddr || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }
    ]);
    this.drawKeyValueRow([
      { label: 'Nearby landmark', value: this.getF('iciciBbgNearbyLandmark') || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }
    ]);
    this.cursorY += 10;

    // SECTION 3
    this.drawSectionHeader('3 DOCUMENT DETAILS');
    this.drawKeyValueRow([
      { label: 'Layout Plan Provided', value: this.getF('iciciBbgLayoutProvided') || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }
    ]);
    this.drawKeyValueRow([
      { label: 'Approving Authority', value: this.getF('iciciBbgLayoutAuth') || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }
    ]);
    this.drawKeyValueRow([
      { label: 'Approval Number', value: this.getF('iciciBbgLayoutApprovalNo') || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }
    ]);
    this.drawKeyValueRow([
      { label: 'Building Plan Provided', value: this.getF('iciciBbgBldgPlanProvided') || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }
    ]);
    this.drawKeyValueRow([
      { label: 'Approving Authority', value: this.getF('iciciBbgBldgPlanAuth') || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }
    ]);
    this.drawKeyValueRow([
      { label: 'Number of Floors', value: this.getF('iciciBbgBldgPlanFloors') || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }
    ]);
    this.drawKeyValueRow([
      { label: 'Construction Permission', value: this.getF('iciciBbgConstPermProvided') || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }
    ]);
    this.drawKeyValueRow([
      { label: 'Approving Authority', value: this.getF('iciciBbgConstPermAuth') || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }
    ]);
    this.drawKeyValueRow([
      { label: 'Number of Floors', value: this.getF('iciciBbgConstPermFloors') || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }
    ]);
    
    let docsArr = [];
    if (this.getF('iciciBbgDocRor')) docsArr.push('COPY OF ROR');
    if (this.getF('iciciBbgDocSaleDeed')) docsArr.push('SALE DEED');
    if (this.getF('iciciBbgDocOther') && this.getF('iciciBbgDocOtherText')) docsArr.push(this.getF('iciciBbgDocOtherText'));
    const legalDocs = docsArr.length > 0 ? docsArr.join(', ') : 'NA';
    this.drawKeyValueRow([
      { label: 'Legal Document (Resale/LAP)', value: legalDocs, labelWidth: 200, valueWidth: CONTENT_W - 200 }
    ]);
    this.cursorY += 10;

    // SECTION 4
    this.drawSectionHeader('4 PHYSICAL DETAILS');
    
    // Boundaries
    this.drawSectionHeader('Boundaries on Site', { bg: rgb(0.9, 0.9, 0.9), fontSize: FONT_SIZE });
    this.drawKeyValueRow([{ label: '', value: 'As per Sale Deed', labelWidth: 100, valueWidth: 150 }, { label: '', value: 'Actual at site', labelWidth: 0, valueWidth: 150 }]);
    
    const boundsMatchSiteAndDeed = this.getF('iciciBbgBoundsMatchToggle');
    const eDeed = this.getF('iciciBbgBoundEastDeed');
    const eSite = boundsMatchSiteAndDeed ? eDeed : this.getF('iciciBbgBoundEastSite');
    this.drawKeyValueRow([{ label: 'East', value: eDeed || 'NA', labelWidth: 100, valueWidth: 150 }, { label: '', value: eSite || 'NA', labelWidth: 0, valueWidth: 150 }]);
    const nDeed = this.getF('iciciBbgBoundNorthDeed');
    const nSite = boundsMatchSiteAndDeed ? nDeed : this.getF('iciciBbgBoundNorthSite');
    this.drawKeyValueRow([{ label: 'North', value: nDeed || 'NA', labelWidth: 100, valueWidth: 150 }, { label: '', value: nSite || 'NA', labelWidth: 0, valueWidth: 150 }]);
    const wDeed = this.getF('iciciBbgBoundWestDeed');
    const wSite = boundsMatchSiteAndDeed ? wDeed : this.getF('iciciBbgBoundWestSite');
    this.drawKeyValueRow([{ label: 'West', value: wDeed || 'NA', labelWidth: 100, valueWidth: 150 }, { label: '', value: wSite || 'NA', labelWidth: 0, valueWidth: 150 }]);
    const sDeed = this.getF('iciciBbgBoundSouthDeed');
    const sSite = boundsMatchSiteAndDeed ? sDeed : this.getF('iciciBbgBoundSouthSite');
    this.drawKeyValueRow([{ label: 'South', value: sDeed || 'NA', labelWidth: 100, valueWidth: 150 }, { label: '', value: sSite || 'NA', labelWidth: 0, valueWidth: 150 }]);
    
    const boundsMatchResult = (eDeed === eSite && nDeed === nSite && wDeed === wSite && sDeed === sSite && !!eDeed) ? 'YES' : 'NO';
    const boundsMatchVal = this.getF('iciciBbgBoundariesMatching') || boundsMatchResult;
    this.drawKeyValueRow([{ label: 'Boundaries Matching', value: boundsMatchVal, labelWidth: 200, valueWidth: CONTENT_W - 200 }]);
    this.drawKeyValueRow([{ label: 'Remarks', value: this.getF('iciciBbgPhysRemarks') || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }]);

    const plotAreaStr = `${this.getF('iciciBbgPlotArea') || ''} ${this.getF('iciciBbgPlotAreaUnit') || ''}`.trim() || 'NA';
    this.drawKeyValueRow([{ label: 'Plot Area', value: plotAreaStr, labelWidth: 200, valueWidth: CONTENT_W - 200 }]);
    this.drawKeyValueRow([{ label: 'Plot demarcated at site', value: this.getF('iciciBbgPlotDemarcated') || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }]);
    this.drawKeyValueRow([{ label: 'Approved Land Use', value: this.getF('iciciBbgApprovedLandUse') || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }]);
    this.drawKeyValueRow([{ label: 'Nature of Locality', value: this.getF('iciciBbgLocalityNature') || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }]);
    this.drawKeyValueRow([{ label: 'Class of Locality', value: this.getF('iciciBbgLocalityClass') || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }]);
    this.drawKeyValueRow([{ label: 'Property Location (Distance from City Centre (Km))', value: this.getF('iciciBbgPropLocation') || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }]);
    this.drawKeyValueRow([{ label: 'Type of Property', value: this.getF('iciciBbgPropType') || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }]);

    // Unit Details Grid
    this.drawSectionHeader('Unit Details Grid', { bg: rgb(0.9, 0.9, 0.9), fontSize: FONT_SIZE });
    this.drawKeyValueRow([{ label: 'Detail', value: 'Rooms | Kitchen | Bath | Others', labelWidth: 100, valueWidth: CONTENT_W - 100 }]);
    ['Basement', 'Ground Floor', 'FIRST Floor', 'SECOND Floor', 'THIRD FLOOR', 'FOURTH FLOOR'].forEach(floor => {
      const fKey = floor.replace(/\s+/g, '');
      const rooms = this.getF(`iciciBbgUnit${fKey}Rooms`);
      const kit = this.getF(`iciciBbgUnit${fKey}Kitchen`);
      const bath = this.getF(`iciciBbgUnit${fKey}Bath`);
      const others = this.getF(`iciciBbgUnit${fKey}Others`);
      if (rooms || kit || bath || others) {
        this.drawKeyValueRow([{ label: floor, value: `${rooms || '-'} | ${kit || '-'} | ${bath || '-'} | ${others || '-'}`, labelWidth: 100, valueWidth: CONTENT_W - 100 }]);
      }
    });

    this.drawKeyValueRow([{ label: 'Structure', value: this.getF('iciciBbgStructure') || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }]);
    this.drawKeyValueRow([{ label: 'Interiors', value: this.getF('iciciBbgInteriors') || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }]);
    this.drawKeyValueRow([{ label: 'Exteriors', value: this.getF('iciciBbgExteriors') || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }]);
    this.drawKeyValueRow([{ label: 'Maintenance level', value: this.getF('iciciBbgMaintenance') || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }]);
    const ageStr = `${this.getF('iciciBbgAge') || ''} ${this.getF('iciciBbgAgeUnit') || ''}`.trim() || 'NA';
    this.drawKeyValueRow([{ label: 'Approx. Age of Property', value: ageStr, labelWidth: 200, valueWidth: CONTENT_W - 200 }]);
    this.cursorY += 10;

    // SECTION 6
    this.drawSectionHeader('6 VIOLATIONS OBSERVED IF');
    this.drawKeyValueRow([{ label: 'Violations observed if', value: this.getF('iciciBbgViolations') || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }]);
    this.cursorY += 10;

    // SECTION 7
    this.drawSectionHeader('7 VALUATION');
    
    const getNum = (val: any) => parseFloat(val) || 0;
    const landAmount = getNum(this.getF('iciciBbgValLandArea')) * getNum(this.getF('iciciBbgValLandRate'));
    const carpetAmount = getNum(this.getF('iciciBbgValCarpetArea')) * getNum(this.getF('iciciBbgValCarpetRate'));
    const builtUpAmount = getNum(this.getF('iciciBbgValBuiltUpArea')) * getNum(this.getF('iciciBbgValBuiltUpRate'));
    const superBuiltUpAmount = getNum(this.getF('iciciBbgValSuperArea')) * getNum(this.getF('iciciBbgValSuperRate'));
    const totalAmount = landAmount + carpetAmount + builtUpAmount + superBuiltUpAmount;

    this.drawSectionHeader('Valuation Grid', { bg: rgb(0.9, 0.9, 0.9), fontSize: FONT_SIZE });
    this.drawKeyValueRow([{ label: 'Description', value: 'Area | Rate | Amount', labelWidth: 150, valueWidth: CONTENT_W - 150 }]);
    this.drawKeyValueRow([{ label: 'Land Area', value: `${this.getF('iciciBbgValLandArea') || '-'} | ${this.getF('iciciBbgValLandRate') || '-'} | ${this.getF('iciciBbgValLandAmount') || (landAmount || '-')}`, labelWidth: 150, valueWidth: CONTENT_W - 150 }]);
    this.drawKeyValueRow([{ label: 'Carpet area', value: `${this.getF('iciciBbgValCarpetArea') || '-'} | ${this.getF('iciciBbgValCarpetRate') || '-'} | ${this.getF('iciciBbgValCarpetAmount') || (carpetAmount || '-')}`, labelWidth: 150, valueWidth: CONTENT_W - 150 }]);
    this.drawKeyValueRow([{ label: 'Built up area', value: `${this.getF('iciciBbgValBuiltUpArea') || '-'} | ${this.getF('iciciBbgValBuiltUpRate') || '-'} | ${this.getF('iciciBbgValBuiltUpAmount') || (builtUpAmount || '-')}`, labelWidth: 150, valueWidth: CONTENT_W - 150 }]);
    this.drawKeyValueRow([{ label: 'Super Built up area', value: `${this.getF('iciciBbgValSuperArea') || '-'} | ${this.getF('iciciBbgValSuperRate') || '-'} | ${this.getF('iciciBbgValSuperAmount') || (superBuiltUpAmount || '-')}`, labelWidth: 150, valueWidth: CONTENT_W - 150 }]);
    this.drawKeyValueRow([{ label: 'Total', value: this.getF('iciciBbgValTotalAmount') || (totalAmount || '-').toString(), labelWidth: 150, valueWidth: CONTENT_W - 150 }]);
    
    this.cursorY += 5;
    this.drawKeyValueRow([{ label: 'Total Value of property Post Completion', value: this.getF('iciciBbgValTotalPostComp') || (totalAmount || 'NA').toString(), labelWidth: 250, valueWidth: CONTENT_W - 250 }]);
    this.drawKeyValueRow([{ label: 'Total Current Value (P+C)', value: this.getF('iciciBbgValTotalCurrent') || (totalAmount || 'NA').toString(), labelWidth: 250, valueWidth: CONTENT_W - 250 }]);

    this.cursorY += 10;
    this.drawSectionHeader('Stage of Construction if Applicable (Builder Case)', { bg: rgb(0.9, 0.9, 0.9), fontSize: FONT_SIZE });
    this.drawKeyValueRow([{ label: 'Stage of Const.', value: this.getF('iciciBbgStageConst') || 'NA', labelWidth: 150, valueWidth: CONTENT_W - 150 }]);
    this.drawKeyValueRow([{ label: 'Structure Desc.', value: this.getF('iciciBbgStageDesc') || 'NA', labelWidth: 150, valueWidth: CONTENT_W - 150 }]);
    this.drawKeyValueRow([{ label: '% Completed', value: this.getF('iciciBbgStageComp') || 'NA', labelWidth: 150, valueWidth: CONTENT_W - 150 }]);
    this.drawKeyValueRow([{ label: '% Recommended', value: this.getF('iciciBbgStageRec') || 'NA', labelWidth: 150, valueWidth: CONTENT_W - 150 }]);
    this.cursorY += 10;
  }
}
