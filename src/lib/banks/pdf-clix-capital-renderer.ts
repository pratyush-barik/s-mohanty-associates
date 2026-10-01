import { PDFBankRenderer } from './pdf-bank-renderer';
import { rgb } from 'pdf-lib';
import {
  PDFBankRenderer,
  FONT_SIZE,
  FONT_SIZE_HEADER,
  FONT_SIZE_TITLE,
  LINE_HEIGHT,
  BORDER_W,
  LBL_BG,
  OPT_BG,
  VAL_BG,
  BG_OPACITY,
  hexToRgb,
  MARGIN_L,
  CONTENT_W,
} from './pdf-bank-renderer';

export class PDFClixCapitalRenderer extends PDFBankRenderer {
  async drawContent(): Promise<void> {
    this.addPage();
    this.drawMainHeader('VALUATION REPORT');

    this.drawSectionHeader('1. REPORT TYPE');
    this.drawKeyValueRow([
      { label: 'Report Type', value: this.getF('clixReportType') === 'Custom' ? this.getF('clixReportTypeCustom') : this.getF('clixReportType') },
      { label: 'LAP/HL/Top up', value: this.getF('clixLoanType') === 'Others' ? this.getF('clixLoanTypeOthers') : this.getF('clixLoanType') },
    ]);
    this.drawKeyValueRow([
      { label: 'Application No', value: this.getF('clixApplicationNoNA') ? 'NA' : this.getF('clixApplicationNo') },
      { label: 'Collateral ID', value: this.getF('clixCollateralIdNA') ? 'NA' : this.getF('clixCollateralId') },
    ]);

    this.drawSectionHeader('2. CUSTOMER DETAILS');
    this.drawKeyValueRow([
      { label: 'Borrower Name', value: this.getF('clixBorrowerName') },
      { label: 'Borrower Contact No', value: this.getF('clixBorrowerContactNoNA') ? 'NA' : this.getF('clixBorrowerContactNo') },
    ]);
    this.drawKeyValueRow([
      { label: 'Borrower Representative Name', value: this.getF('clixBorrowerRepNameNA') ? 'NA' : this.getF('clixBorrowerRepName') },
      { label: 'Borrower Rep Contact No', value: this.getF('clixBorrowerRepContactNoNA') ? 'NA' : this.getF('clixBorrowerRepContactNo') },
    ]);
    this.drawKeyValueRow([
      { label: 'Relationship Manager Name', value: this.getF('clixRmNameNA') ? 'NA' : this.getF('clixRmName') },
      { label: 'Relationship Manager Contact No', value: this.getF('clixRmContactNoNA') ? 'NA' : this.getF('clixRmContactNo') },
    ]);

    this.drawSectionHeader('3. PROPERTY ADDRESS');
    this.drawKeyValueRow([
      { label: 'Property Address (as per initiation)', value: this.getF('clixPropertyAddressInitiation'), labelWidth: 150, valueWidth: CONTENT_W - 150 },
    ]);
    this.drawKeyValueRow([
      { label: 'Property Address (as per site)', value: this.getF('clixPropertyAddressSite'), labelWidth: 150, valueWidth: CONTENT_W - 150 },
    ]);
    this.drawKeyValueRow([
      { label: 'Property Address (as per documents)', value: this.getF('clixPropertyAddressDocs'), labelWidth: 150, valueWidth: CONTENT_W - 150 },
    ]);
    this.drawKeyValueRow([
      { label: 'Nearest Landmark', value: this.getF('clixNearestLandmarkNA') ? 'NA' : this.getF('clixNearestLandmark') },
      { label: 'City', value: this.getF('clixCity') === 'Custom' ? this.getF('clixCityCustom') : this.getF('clixCity') },
    ]);
    this.drawKeyValueRow([
      { label: 'State', value: this.getF('clixState') === 'Custom' ? this.getF('clixStateCustom') : this.getF('clixState') },
      { label: 'Pin Code', value: this.getF('clixPinCode') },
    ]);

    this.drawSectionHeader('4. VISIT DETAILS');
    this.drawKeyValueRow([
      { label: 'Contact Person Name', value: this.getF('clixContactPersonNameNA') ? 'NA' : this.getF('clixContactPersonName') },
      { label: 'Contact Person Mobile No', value: this.getF('clixContactPersonMobileNoNA') ? 'NA' : this.getF('clixContactPersonMobileNo') },
    ]);
    this.drawKeyValueRow([
      { label: 'Relationship with Customer', value: this.getF('clixRelationshipWithCustomer') === 'Custom' ? this.getF('clixRelationshipWithCustomerCustom') : this.getF('clixRelationshipWithCustomer') },
      { label: 'ID Proof details', value: this.getF('clixIdProofDetailsNA') ? 'NA' : `${this.getF('clixIdProofType') === 'Custom' ? this.getF('clixIdProofTypeCustom') : this.getF('clixIdProofType')} - ${this.getF('clixIdProofNumber')}` },
    ]);
    this.drawKeyValueRow([
      { label: 'Property identified through', value: this.getF('clixPropertyIdentifiedThroughNA') ? 'NA' : (Array.isArray(this.getF('clixPropertyIdentifiedThrough')) ? this.getF('clixPropertyIdentifiedThrough').map((opt: string) => opt === 'Custom' ? this.getF('clixPropertyIdentifiedThroughCustom') : opt).join(', ') : ''), labelWidth: 150, valueWidth: CONTENT_W - 150 },
    ]);

    this.drawSectionHeader('5. DOCUMENT DETAILS');
    // Draw Legal Documents Table
    const legalDocs = this.getF('clixLegalDocs') || [];
    if (legalDocs.length > 0) {
      this.drawKeyValueRow([{ label: 'Legal Documents:', value: '', labelWidth: CONTENT_W, valueWidth: 0, labelBold: true }]);
      for (let i = 0; i < legalDocs.length; i++) {
        const doc = legalDocs[i];
        const docName = doc.docNameNA ? 'NA' : (doc.docName === 'Custom' ? doc.docNameCustom : doc.docName);
        const status = doc.status === 'Custom' ? doc.statusCustom : doc.status;
        this.drawKeyValueRow([
          { label: `${i + 1}. Document Name`, value: docName, labelWidth: 120, valueWidth: 150 },
          { label: 'Status', value: status, labelWidth: 100, valueWidth: CONTENT_W - 370 },
        ]);
      }
    }
    
    const accFloors = this.getF('clixAccFloors') || [];
    if (accFloors.length > 0) {
      this.drawKeyValueRow([{ label: 'Accommodation Details:', value: '', labelWidth: CONTENT_W, valueWidth: 0, labelBold: true }]);
      for (const floor of accFloors) {
        this.drawKeyValueRow([
          { label: floor.label || 'Floor', value: floor.isNA ? 'Not Constructed/NA' : floor.description, labelWidth: 150, valueWidth: CONTENT_W - 150 },
        ]);
      }
    }

    this.drawSectionHeader('6. PROPERTY DETAILS');
    this.drawKeyValueRow([
      { label: 'Property Type', value: this.getF('clixPropertyTypeNA') ? 'NA' : (this.getF('clixPropertyType') === 'Custom' ? this.getF('clixPropertyTypeCustom') : this.getF('clixPropertyType')) },
      { label: 'Property Sub Type', value: this.getF('clixPropertySubTypeNA') ? 'NA' : (this.getF('clixPropertySubType') === 'Custom' ? this.getF('clixPropertySubTypeCustom') : this.getF('clixPropertySubType')) },
    ]);
    this.drawKeyValueRow([
      { label: 'Type of Ownership', value: this.getF('clixOwnershipTypeNA') ? 'NA' : this.getF('clixOwnershipType') },
      { label: 'Geo Location (Latitude)', value: this.getF('clixGeoLatitudeNA') ? 'NA' : this.getF('clixGeoLatitude') },
    ]);
    this.drawKeyValueRow([
      { label: 'Longitude', value: this.getF('clixGeoLongitudeNA') ? 'NA' : this.getF('clixGeoLongitude') },
      { label: 'Property Identification Number', value: this.getF('clixPropertyIdNumberNA') ? 'NA' : this.getF('clixPropertyIdNumber') },
    ]);
    this.drawKeyValueRow([
      { label: 'Electricity Meter Number', value: this.getF('clixElectricityMeterNoNA') ? 'NA' : this.getF('clixElectricityMeterNo') },
      { label: 'Distance from City Center (Kms)', value: this.getF('clixDistanceFromCityNA') ? 'NA' : this.getF('clixDistanceFromCity') },
    ]);
    this.drawKeyValueRow([
      { label: 'Distance from Branch (Kms)', value: this.getF('clixDistanceFromBranchNA') ? 'NA' : this.getF('clixDistanceFromBranch') },
      { label: 'Property Location', value: this.getF('clixPropertyLocationNA') ? 'NA' : (this.getF('clixPropertyLocation') === 'Custom' ? this.getF('clixPropertyLocationCustom') : this.getF('clixPropertyLocation')) },
    ]);
    this.drawKeyValueRow([
      { label: 'Access Road', value: this.getF('clixAccessRoadNA') ? 'NA' : this.getF('clixAccessRoad') },
      { label: 'Surrounding Infrastructure', value: this.getF('clixSurroundingInfraNA') ? 'NA' : (this.getF('clixSurroundingInfra') === 'Custom' ? this.getF('clixSurroundingInfraCustom') : this.getF('clixSurroundingInfra')) },
    ]);
    this.drawKeyValueRow([
      { label: 'Class of Locality', value: this.getF('clixClassOfLocalityNA') ? 'NA' : (this.getF('clixClassOfLocality') === 'Custom' ? this.getF('clixClassOfLocalityCustom') : this.getF('clixClassOfLocality')) },
      { label: 'Permitted Usage / Zoning', value: this.getF('clixPermittedUsageNA') ? 'NA' : (this.getF('clixPermittedUsage') === 'Custom' ? this.getF('clixPermittedUsageCustom') : this.getF('clixPermittedUsage')) },
    ]);
    this.drawKeyValueRow([
      { label: 'Existing Usage', value: this.getF('clixExistingUsageNA') ? 'NA' : this.getF('clixExistingUsage') },
      { label: 'Age of Property (Years)', value: this.getF('clixAgeOfPropertyNA') ? 'NA' : this.getF('clixAgeOfProperty') },
    ]);
    this.drawKeyValueRow([
      { label: 'Residual Age (Years)', value: this.getF('clixResidualAgeNA') ? 'NA' : this.getF('clixResidualAge') },
      { label: 'Marketability', value: this.getF('clixMarketabilityNA') ? 'NA' : (this.getF('clixMarketability') === 'Custom' ? this.getF('clixMarketabilityCustom') : this.getF('clixMarketability')) },
    ]);

    this.drawSectionHeader('7. SPECIFICATIONS');
    this.drawKeyValueRow([
      { label: 'Type of Structure', value: this.getF('clixTypeOfStructureNA') ? 'NA' : this.getF('clixTypeOfStructure') },
      { label: 'Painting', value: this.getF('clixPaintingNA') ? 'NA' : this.getF('clixPainting') },
    ]);
    this.drawKeyValueRow([
      { label: 'Flooring', value: this.getF('clixFlooringNA') ? 'NA' : this.getF('clixFlooring') },
      { label: 'Bathroom/ Plumbing fittings', value: this.getF('clixBathroomFittingsNA') ? 'NA' : this.getF('clixBathroomFittings') },
    ]);
    this.drawKeyValueRow([
      { label: 'Electrical Fittings', value: this.getF('clixElectricalFittingsNA') ? 'NA' : this.getF('clixElectricalFittings') },
      { label: 'Kitchen', value: this.getF('clixKitchenNA') ? 'NA' : this.getF('clixKitchen') },
    ]);
    this.drawKeyValueRow([
      { label: 'Interiors', value: this.getF('clixInteriorsNA') ? 'NA' : this.getF('clixInteriors'), labelWidth: 140, valueWidth: CONTENT_W - 140 },
    ]);

    this.drawSectionHeader('8. BOUNDARIES AND SET BACKS');
    this.drawKeyValueRow([{ label: 'Boundaries Details:', value: '', labelWidth: CONTENT_W, valueWidth: 0, labelBold: true }]);
    this.drawKeyValueRow([
      { label: 'Direction', value: 'As Per Document', labelWidth: 80, valueWidth: (CONTENT_W - 160) / 2, bold: true, labelBold: true },
      { label: 'As Per Site', value: 'Dimension (Ft.)', labelWidth: (CONTENT_W - 160) / 2, valueWidth: 80, bold: true, labelBold: true },
    ]);
    const dirs = [
      { d: 'North', pd: 'clixS8BoundariesNorthAsPerDoc', ps: 'clixS8BoundariesNorthAsPerSite', dim: 'clixS8BoundariesNorthDimension', pna: 'clixS8BoundariesNorthAsPerDocNA', sna: 'clixS8BoundariesNorthAsPerSiteNA', dna: 'clixS8BoundariesNorthDimensionNA' },
      { d: 'South', pd: 'clixS8BoundariesSouthAsPerDoc', ps: 'clixS8BoundariesSouthAsPerSite', dim: 'clixS8BoundariesSouthDimension', pna: 'clixS8BoundariesSouthAsPerDocNA', sna: 'clixS8BoundariesSouthAsPerSiteNA', dna: 'clixS8BoundariesSouthDimensionNA' },
      { d: 'East', pd: 'clixS8BoundariesEastAsPerDoc', ps: 'clixS8BoundariesEastAsPerSite', dim: 'clixS8BoundariesEastDimension', pna: 'clixS8BoundariesEastAsPerDocNA', sna: 'clixS8BoundariesEastAsPerSiteNA', dna: 'clixS8BoundariesEastDimensionNA' },
      { d: 'West', pd: 'clixS8BoundariesWestAsPerDoc', ps: 'clixS8BoundariesWestAsPerSite', dim: 'clixS8BoundariesWestDimension', pna: 'clixS8BoundariesWestAsPerDocNA', sna: 'clixS8BoundariesWestAsPerSiteNA', dna: 'clixS8BoundariesWestDimensionNA' },
    ];
    for (const dir of dirs) {
      this.drawKeyValueRow([
        { label: dir.d, value: this.getF(dir.pna) ? 'NA' : this.getF(dir.pd), labelWidth: 80, valueWidth: (CONTENT_W - 160) / 2 },
        { label: this.getF(dir.sna) ? 'NA' : this.getF(dir.ps), value: this.getF(dir.dna) ? 'NA' : this.getF(dir.dim), labelWidth: (CONTENT_W - 160) / 2, valueWidth: 80, labelBold: false },
      ]);
    }
    this.drawKeyValueRow([
      { label: 'Are Demarcations Matching?', value: this.getF('clixS8DemarcationMatchingNA') ? 'NA' : this.getF('clixS8DemarcationMatching') },
      { label: 'Mismatch Explanation', value: this.getF('clixS8DemarcationMismatchExplanation') || '' },
    ]);
    this.drawKeyValueRow([{ label: 'Notes on Demarcation', value: this.getF('clixS8NotesForDemarcationNA') ? 'NA' : this.getF('clixS8NotesForDemarcation'), labelWidth: 150, valueWidth: CONTENT_W - 150 }]);

    this.drawKeyValueRow([{ label: 'Setbacks Details:', value: '', labelWidth: CONTENT_W, valueWidth: 0, labelBold: true }]);
    this.drawKeyValueRow([
      { label: 'Direction', value: 'Approved (Ft.)', labelWidth: 80, valueWidth: (CONTENT_W - 180) / 3, bold: true, labelBold: true },
      { label: 'Actual (Ft.)', value: 'Deviations', labelWidth: (CONTENT_W - 180) / 3, valueWidth: (CONTENT_W - 180) / 3, bold: true, labelBold: true },
      { label: 'Remarks', value: '', labelWidth: 100, valueWidth: 0, bold: true, labelBold: true },
    ]);
    const sdirs = [
      { d: 'Front', app: 'clixS8SetbacksFrontApproved', act: 'clixS8SetbacksFrontActual', dev: 'clixS8SetbacksFrontDeviations', rem: 'clixS8SetbacksFrontRemarks', ana: 'clixS8SetbacksFrontApprovedNA', acna: 'clixS8SetbacksFrontActualNA', dna: 'clixS8SetbacksFrontDeviationsNA', rna: 'clixS8SetbacksFrontRemarksNA' },
      { d: 'Rear', app: 'clixS8SetbacksRearApproved', act: 'clixS8SetbacksRearActual', dev: 'clixS8SetbacksRearDeviations', rem: 'clixS8SetbacksRearRemarks', ana: 'clixS8SetbacksRearApprovedNA', acna: 'clixS8SetbacksRearActualNA', dna: 'clixS8SetbacksRearDeviationsNA', rna: 'clixS8SetbacksRearRemarksNA' },
      { d: 'Left Side', app: 'clixS8SetbacksLeftSideApproved', act: 'clixS8SetbacksLeftSideActual', dev: 'clixS8SetbacksLeftSideDeviations', rem: 'clixS8SetbacksLeftSideRemarks', ana: 'clixS8SetbacksLeftSideApprovedNA', acna: 'clixS8SetbacksLeftSideActualNA', dna: 'clixS8SetbacksLeftSideDeviationsNA', rna: 'clixS8SetbacksLeftSideRemarksNA' },
      { d: 'Right Side', app: 'clixS8SetbacksRightSideApproved', act: 'clixS8SetbacksRightSideActual', dev: 'clixS8SetbacksRightSideDeviations', rem: 'clixS8SetbacksRightSideRemarks', ana: 'clixS8SetbacksRightSideApprovedNA', acna: 'clixS8SetbacksRightSideActualNA', dna: 'clixS8SetbacksRightSideDeviationsNA', rna: 'clixS8SetbacksRightSideRemarksNA' },
    ];
    for (const dir of sdirs) {
      this.drawKeyValueRow([
        { label: dir.d, value: this.getF(dir.ana) ? 'NA' : this.getF(dir.app), labelWidth: 80, valueWidth: (CONTENT_W - 180) / 3 },
        { label: this.getF(dir.acna) ? 'NA' : this.getF(dir.act), value: this.getF(dir.dna) ? 'NA' : this.getF(dir.dev), labelWidth: (CONTENT_W - 180) / 3, valueWidth: (CONTENT_W - 180) / 3, labelBold: false },
        { label: this.getF(dir.rna) ? 'NA' : this.getF(dir.rem), value: '', labelWidth: 100, valueWidth: 0, labelBold: false },
      ]);
    }

    this.drawSectionHeader('9. AREA AND USAGE DETAIL');
    const buaRows = this.getF('clixS9BuaRows') || [];
    if (buaRows.length > 0) {
      this.drawKeyValueRow([
        { label: 'Floor', value: 'As Per Deed (Sqft)', labelWidth: 80, valueWidth: (CONTENT_W - 80) / 4, bold: true, labelBold: true },
        { label: 'As Per Site (Sqft)', value: 'Adopted (Sqft)', labelWidth: (CONTENT_W - 80) / 4, valueWidth: (CONTENT_W - 80) / 4, bold: true, labelBold: true },
        { label: 'Usage', value: '', labelWidth: (CONTENT_W - 80) / 4, valueWidth: 0, bold: true, labelBold: true },
      ]);
      for (const row of buaRows) {
        this.drawKeyValueRow([
          { label: row.floor || '', value: row.asPerDeedNA ? 'NA' : row.asPerDeed, labelWidth: 80, valueWidth: (CONTENT_W - 80) / 4 },
          { label: row.asPerSiteNA ? 'NA' : row.asPerSite, value: row.adoptedNA ? 'NA' : row.adopted, labelWidth: (CONTENT_W - 80) / 4, valueWidth: (CONTENT_W - 80) / 4, labelBold: false },
          { label: row.usageNA ? 'NA' : row.usage, value: '', labelWidth: (CONTENT_W - 80) / 4, valueWidth: 0, labelBold: false },
        ]);
      }
    }
    this.drawKeyValueRow([
      { label: 'Total BUA Adopted', value: this.getF('clixS9TotalBuaAdoptedNA') ? 'NA' : this.getF('clixS9TotalBuaAdopted'), labelWidth: 150, valueWidth: CONTENT_W - 150 },
    ]);
    this.drawKeyValueRow([
      { label: 'No. of Floors Approved', value: this.getF('clixS9FloorsApprovedNA') ? 'NA' : this.getF('clixS9FloorsApproved') },
      { label: 'No. of Floors Constructed', value: this.getF('clixS9FloorsConstructedNA') ? 'NA' : this.getF('clixS9FloorsConstructed') },
    ]);
    this.drawKeyValueRow([
      { label: 'Floors Deviation', value: this.getF('clixS9FloorsDeviationNA') ? 'NA' : this.getF('clixS9FloorsDeviation') },
      { label: 'Demolition List', value: this.getF('clixS9DemolitionList') },
    ]);

    this.drawSectionHeader('10. FAIR MARKET VALUE');
    const valRows = this.getF('clixS10ValuationRows') || [];
    if (valRows.length > 0) {
      this.drawKeyValueRow([
        { label: 'Floor', value: 'Area (Sqft)', labelWidth: 80, valueWidth: (CONTENT_W - 80) / 3, bold: true, labelBold: true },
        { label: 'Rate (Per Sqft)', value: 'Amount (Rs)', labelWidth: (CONTENT_W - 80) / 3, valueWidth: (CONTENT_W - 80) / 3, bold: true, labelBold: true },
      ]);
      for (const row of valRows) {
        this.drawKeyValueRow([
          { label: row.floor || '', value: row.areaNA ? 'NA' : row.area, labelWidth: 80, valueWidth: (CONTENT_W - 80) / 3 },
          { label: row.rateNA ? 'NA' : row.rate, value: row.amountNA ? 'NA' : row.amount, labelWidth: (CONTENT_W - 80) / 3, valueWidth: (CONTENT_W - 80) / 3, labelBold: false },
        ]);
      }
    }
    this.drawKeyValueRow([
      { label: 'Land Amount (Rs)', value: this.getF('clixS10LandAmountNA') ? 'NA' : this.getF('clixS10LandAmount') },
      { label: 'Total BUA Value (Rs)', value: this.getF('clixS10TotalBuaNA') ? 'NA' : this.getF('clixS10TotalBua') },
    ]);
    this.drawKeyValueRow([
      { label: 'Fair Market Value (Rs)', value: this.getF('clixS10FmvNA') ? 'NA' : this.getF('clixS10Fmv'), highlight: true, valueBold: true, labelWidth: 150, valueWidth: CONTENT_W - 150 },
    ]);

    this.drawSectionHeader('11. DERIVED VALUES (REALIZABLE & DISTRESS)');
    this.drawKeyValueRow([
      { label: 'Realizable Value (Rs)', value: this.getF('clixS11RealizableNA') ? 'NA' : this.getF('clixS11Realizable'), highlight: true, valueBold: true },
      { label: 'Distress Value (Rs)', value: this.getF('clixS11DistressNA') ? 'NA' : this.getF('clixS11Distress'), highlight: true, valueBold: true },
    ]);
    this.drawKeyValueRow([
      { label: 'Govt Value (Rs)', value: this.getF('clixS11GovtValueNA') ? 'NA' : this.getF('clixS11GovtValue') },
      { label: 'Insurance Value (Rs)', value: this.getF('clixS11InsuranceNA') ? 'NA' : this.getF('clixS11Insurance') },
    ]);

    this.drawSectionHeader('12. GENERAL REMARKS, DECLARATIONS & ATTACHMENTS');
    
    // Check if we need to fall back to generic remarks
    let genRemarks = this.getF('clixS12GeneralRemarksNA') ? 'NA' : this.getF('clixS12GeneralRemarks');
    if (!genRemarks) genRemarks = this.getF('generalRemarks');
    
    this.drawKeyValueRow([{ label: 'General Remarks / Special Observations', value: this.stripHtml(genRemarks || ''), labelWidth: 200, valueWidth: CONTENT_W - 200 }]);
    this.drawKeyValueRow([{ label: 'Any Legal/Structural Issues Observed', value: this.getF('clixS12LegalIssuesNA') ? 'NA' : this.stripHtml(this.getF('clixS12LegalIssues') || ''), labelWidth: 200, valueWidth: CONTENT_W - 200 }]);
    
    const mortgage = this.getF('clixS12MortgageabilityNA') ? 'NA' : (this.getF('clixS12MortgageabilityDropdown') === 'Custom' ? this.getF('clixS12Mortgageability') : this.getF('clixS12MortgageabilityDropdown'));
    this.drawKeyValueRow([
      { label: 'Mortgageability (Suitable for Collateral Security)', value: mortgage || '', labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);
    
    const attachments = this.getF('clixS12AttachmentsNA') ? 'NA' : (Array.isArray(this.getF('clixS12Attachments')) ? this.getF('clixS12Attachments').map((a: string) => a === 'Custom' ? this.getF('clixS12AttachmentsCustom') : a).join(', ') : '');
    this.drawKeyValueRow([
      { label: 'Attachments Enclosed', value: attachments || '', labelWidth: 150, valueWidth: CONTENT_W - 150 },
    ]);

    this.checkPageBreak(80);
    this.cursorY += 15;
    this.drawKeyValueRow([
      { label: 'Date of Valuation', value: this.getF('clixS12DateOfValuationNA') ? 'NA' : this.getF('clixS12DateOfValuation'), hideBottom: true },
      { label: 'Place', value: this.getF('clixS12PlaceNA') ? 'NA' : this.getF('clixS12Place'), hideBottom: true },
    ]);
    this.drawKeyValueRow([
      { label: 'Valuer\'s Name / Executed By', value: this.getF('clixS12ValuerNameNA') ? 'NA' : this.getF('clixS12ValuerName'), hideTop: true },
      { label: 'Digital Signature appended?', value: this.getF('clixS12DigitalSignature') ? 'Yes' : 'No (Requires manual wet signature)', hideTop: true },
    ]);
  }
}
