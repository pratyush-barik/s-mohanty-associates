/**
 * pdf-axis-sbb-renderer.ts — Dedicated PDF renderer for Axis Bank (SBB - Small Business Banking).
 *
 * Mirrors Axis Finance Ltd's PDF structure but reads from 'axisSbb' prefixed fields
 * so data is fully independent between the two templates.
 *
 * Section 1 (Cover Page): Double-border cover page with Property Owners, Address,
 * Value of Property, Purpose of Valuation, and Prepared By details.
 */

import { rgb } from 'pdf-lib';
import {
  PDFBankRenderer,
  PAGE_W,
  PAGE_H,
  MARGIN_L,
  CONTENT_W,
  FONT_SIZE,
  FONT_SIZE_HEADER,
  FONT_SIZE_TITLE,
  hexToRgb
} from '../pdf-bank-renderer';

export class PDFAxisSBBRenderer extends PDFBankRenderer {
  private fields: any;
  private drawnCover = false;
  private drawnMapHeader = false;
  private drawnAnnexureHeader = false;

  drawSectionSubtitle(title: string) {
    this.drawSectionHeader(title, false, false);
  }

  constructor(fields?: any) {
    super();
    this.fields = fields || {};
  }

  override drawKeyValueRow(cols: { label: string; value: string; labelWidth?: number; valueWidth?: number; highlight?: boolean; bold?: boolean; labelBold?: boolean; valueBold?: boolean; hideTop?: boolean; hideBottom?: boolean }[]): void {
    const newCols = cols.map(c => ({
      ...c,
      labelBold: true,
      valueBold: false
    }));
    super.drawKeyValueRow(newCols);
  }

  override drawSimpleRow(label: string, value: string, highlight?: boolean, bold?: boolean): void {
    const labelW = Math.round(CONTENT_W * 0.40);
    const valueW = CONTENT_W - labelW;
    super.drawKeyValueRow([{
      label,
      value: value || 'NA',
      labelWidth: labelW,
      valueWidth: valueW,
      highlight,
      labelBold: true,
      valueBold: false
    }]);
  }

  override drawCenteredTitle(title: string, fontSize?: number, underline?: boolean) {
    if (!this.drawnCover) {
      this.drawnCover = true;
      this.drawSbbCoverPage();
      return;
    }

    if (title.toUpperCase().startsWith('ANNEXURE')) {
      if (!this.drawnAnnexureHeader) {
        this.drawnAnnexureHeader = true;
        super.drawSectionHeader('13. DOCUMENTS AND ANNEXTURE', true, false);
        this.cursorY += 10;
      }
    }

    // Override the generic "Valuation Report" title
    const isValuationReport = title.trim().toLowerCase() === 'valuation report';
    const finalTitle = isValuationReport
      ? 'VALUATION REPORT FOR AXIS BANK — SBB'
      : title;

    super.drawCenteredTitle(finalTitle, fontSize, isValuationReport ? true : underline);
  }

  override drawSectionHeader(title: string, addSpaceBefore?: boolean, preserveCase?: boolean) {
    // Intercept standard section 2
    if (title.toUpperCase() === 'CASE DETAILS & REPORT METADATA') {
      if (this.doc.getPages().length === 1) {
        this.newPage();
      }
      
      super.drawCenteredTitle('VALUATION REPORT', FONT_SIZE_TITLE, false);
      super.drawCenteredTitle('FOR AXIS BANK – SMALL BUSINESS BANKING', FONT_SIZE_TITLE, true);
      this.cursorY += 15;

      const fv = (key: string, defaultVal = '') => String((this.fields as any)[key] || defaultVal).replace(/[\t\n\r]+/g, ' ').trim() || defaultVal;
      const refText = `REPORT REF: ${fv('axisSbbReportRefNo')}`;
      const dateText = `DATE OF REPORT: ${fv('axisSbbDateOfReport')}`;

      this.page.drawText(refText, { x: MARGIN_L, y: this.pdfY(this.cursorY), size: FONT_SIZE_HEADER, font: this.fontBold, color: rgb(0,0,0) });
      const dateW = this.fontBold.widthOfTextAtSize(dateText, FONT_SIZE_HEADER);
      this.page.drawText(dateText, { x: MARGIN_L + CONTENT_W - dateW, y: this.pdfY(this.cursorY), size: FONT_SIZE_HEADER, font: this.fontBold, color: rgb(0,0,0) });
      
      this.cursorY += 15;
      
      this.drawSbbSection2();
      return;
    }
    // Intercept standard section 3
    if (title.toUpperCase() === 'LEGAL VERIFICATION & PROPERTY CLASSIFICATION') {
      super.drawSectionHeader('LEGAL VERIFICATION & PROPERTY CLASSIFICATION', addSpaceBefore, preserveCase);
      this.drawSbbSection3();
      return;
    }
    // Intercept standard section 4
    if (title.toUpperCase() === 'PROPERTY IDENTIFICATION & POSTAL ADDRESS') {
      super.drawSectionHeader('PROPERTY IDENTIFICATION & POSTAL ADDRESS', addSpaceBefore, preserveCase);
      this.drawSbbSection4();
      return;
    }
    // Intercept standard section 5
    if (title.toUpperCase() === 'PROPERTY CHARACTERISTICS & PHYSICAL SITE ASSESSMENT') {
      super.drawSectionHeader('PROPERTY CHARACTERISTICS & PHYSICAL SITE ASSESSMENT', addSpaceBefore, preserveCase);
      this.drawSbbSection5();
      return;
    }
    // Intercept standard section 6
    if (title.toUpperCase() === 'BOUNDARIES, ACCESSIBILITY & SITE RISK CHECKS') {
      super.drawSectionHeader('BOUNDARIES, ACCESSIBILITY & SITE RISK CHECKS', addSpaceBefore, preserveCase);
      this.drawSbbSection6();
      return;
    }
    // Intercept standard section 7
    if (title.toUpperCase() === 'STRUCTURE, TENANCY & PLANNING APPROVALS') {
      super.drawSectionHeader('STRUCTURE, TENANCY & PLANNING APPROVALS', addSpaceBefore, preserveCase);
      this.drawSbbSection7();
      return;
    }
    // Intercept standard section 8
    if (title.toUpperCase() === 'CONSTRUCTION BREAKDOWN & BUILDING DETAILS') {
      super.drawSectionHeader('PLANNING, FLOOR BREAK UP & CONSTRUCTION COMPLIANCE', addSpaceBefore, preserveCase);
      this.drawSbbSection8();
      return;
    }
    // Intercept standard section 9
    if (title.toUpperCase() === '9. VALUATION OVERVIEW & REMARKS') {
      super.drawSectionHeader('9. VALUATION OVERVIEW & REMARKS', addSpaceBefore, preserveCase);
      this.drawSbbSection9();
      return;
    }
    // Intercept standard section 10
    if (title.toUpperCase().includes('10. REMARKS & UNDERTAKING')) {
      super.drawSectionHeader('10. REMARKS & UNDERTAKING', addSpaceBefore, preserveCase);
      this.drawSbbSection10();
      return;
    }
    // Intercept Photographs
    if (title.toUpperCase() === 'PROPERTY PHOTOGRAPHS') {
      super.drawSectionHeader('11. PROPERTY PHOTOGRAPHS', addSpaceBefore, preserveCase);
      return;
    }
    // Intercept Maps
    if (title.toUpperCase().includes('MAP')) {
      if (!this.drawnMapHeader) {
        this.drawnMapHeader = true;
        super.drawSectionHeader('12. LOCATION & SKECTH MAP OR MAPS', addSpaceBefore, preserveCase);
      }
      super.drawSectionHeader(title.toUpperCase(), false, preserveCase);
      return;
    }
    super.drawSectionHeader(title, addSpaceBefore, preserveCase);
  }

  private drawSbbSection7() {
    const fields = this.fields;
    
    const val = (key: string, computed?: string) => {
      if ((fields as any)[`${key}IsNA`]) return 'NA';
      if ((fields as any)[`${key}EditOn`] || !computed) {
        return String((fields as any)[key] || 'NA').replace(/[\t\n\r]+/g, ' ').trim() || 'NA';
      }
      return computed;
    };

    this.drawSectionSubtitle('OCCUPANCY DETAILS & STRUCTURE CLASSIFICATION');
    
    // Type of structure
    let structTypes = [];
    if ((fields as any).axisSbbTypeOfStructureGCI) structTypes.push('GCI');
    if ((fields as any).axisSbbTypeOfStructureTinShed) structTypes.push('TIN SHED');
    if ((fields as any).axisSbbTypeOfStructureRCC) structTypes.push('RCC');
    if ((fields as any).axisSbbTypeOfStructureAluform) structTypes.push('ALUFORM SHUTTERING');
    let structVal = structTypes.join(', ');
    if ((fields as any).axisSbbTypeOfStructureIsNA) structVal = 'NA';
    else if (structTypes.length === 0) structVal = 'NA';
    
    this.drawKeyValueRow([
      { label: 'Type of Structure', value: structVal },
      { label: 'No. of Floors', value: val('axisSbbNoOfFloors') }
    ]);
    
    this.drawKeyValueRow([
      { label: 'Occupancy Details', value: val('axisSbbOccupancyDetails') },
      { label: 'Is Property on Rent?', value: val('axisSbbPropertyOnRent') }
    ]);

    const isRentYes = (fields as any).axisSbbPropertyOnRent === 'YES' && !(fields as any).axisSbbPropertyOnRentIsNA;

    this.drawKeyValueRow([
      { label: 'Number of Tenants & Details', value: isRentYes ? val('axisSbbNumberOfTenantsDetails') : 'NA' },
      { label: 'Name of Tenant/Lease', value: isRentYes ? val('axisSbbNameOfTenantLease') : 'NA' }
    ]);

    this.drawKeyValueRow([
      { label: 'Years in Tenancy', value: isRentYes ? val('axisSbbYearsInTenancy') : 'NA' },
      { label: 'Any Resistance for Valuation?', value: val('axisSbbResistanceForValuation') }
    ]);

    this.drawKeyValueRow([
      { label: 'Resistance from Occupants?', value: val('axisSbbResistanceFromOccupants') },
      { label: 'Surrounding Area Development', value: val('axisSbbDevelopmentSurroundingArea') }
    ]);

    // Basic amenities
    let amenities = [];
    if ((fields as any).axisSbbBasicAmenitiesElectricity) amenities.push('ELECTRICITY');
    if ((fields as any).axisSbbBasicAmenitiesWater) amenities.push('WATER');
    if ((fields as any).axisSbbBasicAmenitiesDrainage) amenities.push('DRAINAGE CONNECTION');
    let amenVal = amenities.join(', ');
    if ((fields as any).axisSbbBasicAmenitiesIsNA) amenVal = 'NA';
    else if (amenities.length === 0) amenVal = 'NA';

    this.drawSimpleRow('Basic Amenities', amenVal);
    
    this.drawSectionSubtitle('APPROVAL DETAILS & BYE-LAWS COMPLIANCE');

    this.drawKeyValueRow([
      { label: 'Layout Approval No.', value: val('axisSbbLayoutApprovalNumber') },
      { label: 'Approval Date', value: val('axisSbbLayoutApprovalDate') }
    ]);

    this.drawKeyValueRow([
      { label: 'Expiry Date', value: val('axisSbbLayoutExpiryDate') },
      { label: 'Building Plan Approval No.', value: val('axisSbbBuildingPlanApprovalNumber') }
    ]);

    this.drawKeyValueRow([
      { label: 'Approval Date', value: val('axisSbbBuildingPlanApprovalDate') },
      { label: 'Expiry Date', value: val('axisSbbBuildingPlanExpiryDate') }
    ]);
  }

  private drawSbbSection8() {
    const fields = this.fields;
    
    const val = (key: string, computed?: string) => {
      if ((fields as any)[`${key}IsNA`]) return 'NA';
      if ((fields as any)[`${key}EditOn`] || !computed) {
        return String((fields as any)[key] || 'NA').replace(/[\t\n\r]+/g, ' ').trim() || 'NA';
      }
      return computed;
    };

    const floors = JSON.parse((fields as any).axisSbbFloorData || '[]');
    let sumConstructed = 0;
    let sumValuation = 0;
    floors.forEach((f: any) => {
      if (!f.constructedAreaIsNA && f.constructedArea) sumConstructed += Number(f.constructedArea) || 0;
      if (!f.valuationAreaIsNA && f.valuationArea) sumValuation += Number(f.valuationArea) || 0;
    });

    const computedConstructed = `${sumConstructed} SQFT`;
    const computedValuation = `${sumValuation} SQFT`;
    const computedCarpet = `${Math.round(sumConstructed * 0.85)} SQFT`;
    const computedSaleable = computedCarpet;

    this.drawSectionSubtitle('FLOOR WISE BREAK UP AS FOLLOWS IN SQ.FT.');
    
    const headers = [
      'FLOOR', 
      'CONSTRUCTED AREA', 
      'APPROVED AREA', 
      'PERMISSIBLE AREA', 
      'VALUATION AREA', 
      'ACCOMMODATION', 
      'CURRENT USAGE'
    ];
    
    const rows = floors.map((f: any) => {
      let usages = [];
      if (f.usageStorage) usages.push('STORAGE');
      if (f.usageParking) usages.push('PARKING');
      if (f.usageCommercial) usages.push('COMMERCIAL');
      if (f.usageResidential) usages.push('RESIDENTIAL');
      if (f.usageIndustry) usages.push('INDUSTRY');
      const usageStr = usages.join(', ') || 'NA';
      
      return [
        f.floorName || 'NA',
        f.constructedAreaIsNA ? 'NA' : (f.constructedArea ? `${f.constructedArea} SQFT` : '0 SQFT'),
        f.approvedAreaIsNA ? 'NA' : String(f.approvedArea || 'NA'),
        f.permissibleAreaIsNA ? 'NA' : String(f.permissibleArea || 'NA'),
        f.valuationAreaIsNA ? 'NA' : (f.valuationArea ? `${f.valuationArea} SQFT` : '0 SQFT'),
        f.accommodationIsNA ? 'NA' : String(f.accommodation || 'NA'),
        usageStr
      ];
    });

    this.drawTable(headers, rows, [70, 70, 70, 70, 70, 80, 78], [], [0]);
    this.advanceCursor(10);
    
    this.drawKeyValueRow([
      { label: 'Total Built Up Area', value: val('axisSbbTotalConstructedArea', computedConstructed) },
      { label: 'Approved/Permissible Area', value: 'NA' }
    ]);
    
    this.drawKeyValueRow([
      { label: 'Total Valuation Area', value: val('axisSbbTotalValuationArea', computedValuation) },
      { label: 'Total Carpet Area', value: val('axisSbbTotalCarpetArea', computedCarpet) }
    ]);
    
    this.drawSimpleRow('Total Saleable Area', val('axisSbbTotalSaleableArea', computedSaleable));
    
    this.drawSectionSubtitle('BYE-LAWS COMPLIANCE, QUALITY & STRUCTURE LIFE');

    this.drawSimpleRow('Construction As Per Approved Building Plan/Local Bye Laws', val('axisSbbConstructionAsPerApprovedPlan'));
    this.drawSimpleRow('FSI As Per Plan Approval / Govt. Guideline & Actual FSI', val('axisSbbFSIAsPerPlan'));

    this.drawKeyValueRow([
      { label: 'Details of Extra Construction', value: val('axisSbbExtraConstructionDetails') },
      { label: 'Percentage of Extra Construction', value: val('axisSbbExtraConstructionPercentage') }
    ]);

    this.drawKeyValueRow([
      { label: 'Compoundable / Non-Compoundable?', value: (fields as any).axisSbbCompoundableIsCustom ? val('axisSbbCompoundable') : val('axisSbbCompoundable') },
      { label: 'Maintenance of Property', value: (fields as any).axisSbbMaintenanceOfPropertyIsCustom ? val('axisSbbMaintenanceOfProperty') : val('axisSbbMaintenanceOfProperty') }
    ]);
    
    const roofTypes = [];
    if ((fields as any).axisSbbQualityOfConstructionRoofRCC) roofTypes.push('RCC');
    if ((fields as any).axisSbbQualityOfConstructionRoofPatti) roofTypes.push('PATTI');
    if ((fields as any).axisSbbQualityOfConstructionRoofTinShed) roofTypes.push('TIN SHED');
    if ((fields as any).axisSbbQualityOfConstructionRoofClayTiles) roofTypes.push('CLAY TILES');
    const roofStr = roofTypes.length ? roofTypes.join('/') + ' ROOF' : 'ROOF';

    const floorTypes = [];
    if ((fields as any).axisSbbQualityOfConstructionFloorTiles) floorTypes.push('TILES');
    if ((fields as any).axisSbbQualityOfConstructionFloorMarble) floorTypes.push('MARBLE');
    if ((fields as any).axisSbbQualityOfConstructionFloorKotaStone) floorTypes.push('KOTA STONE');
    if ((fields as any).axisSbbQualityOfConstructionFloorLocalStone) floorTypes.push('LOCAL STONE');
    if ((fields as any).axisSbbQualityOfConstructionFloorCC) floorTypes.push('C.C');
    
    const computedQuality = `${roofStr} WITH MASONRY WALLS WITH ${floorTypes.length ? floorTypes.join('/') + ' FLOOR' : 'FLOOR'}`;

    this.drawSimpleRow('Quality of Construction', val('axisSbbQualityOfConstruction', computedQuality));

    this.drawKeyValueRow([
      { label: 'Current Life of Structure (Years)', value: val('axisSbbCurrentLifeOfStructure') },
      { label: 'Projected Life of Structure (Years)', value: val('axisSbbProjectedLifeOfStructure') }
    ]);
  }

  private drawSbbSection6() {
    const fields = this.fields;
    
    const val = (key: string, computed?: string) => {
      if ((fields as any)[`${key}IsNA`]) return 'NA';
      if ((fields as any)[`${key}EditOn`] || !computed) {
        return String((fields as any)[key] || 'NA').replace(/[\t\n\r]+/g, ' ').trim() || 'NA';
      }
      return computed;
    };

    const remarkComputed = (String((fields as any).axisSbbRoadWidthMaterial || '20 FEET WIDE ROAD')).toUpperCase();
    const fireExtComputed = parseInt(String((fields as any).axisSbbRoadWidthMaterial || '0')) >= 15 ? 'YES' : 'NO';
    const sqft = (fields as any).axisSbbPlotAreaSqft || '0';
    const acres = (fields as any).axisSbbPlotAreaAcres || '0.000';
    const areaComputed = `${sqft} SQFT (AC.${acres}DECS)`.toUpperCase();

    this.drawSectionSubtitle('ACCESSIBILITY/ BOUNDARIES/OTHERS (Physical Access & Site Risk Checks)');
    
    this.drawKeyValueRow([
      { label: 'Does Approach Road is Small?', value: val('axisSbbApproachRoadSmall') },
      { label: 'Remark', value: val('axisSbbApproachRoadRemark', remarkComputed) }
    ]);
    
    this.drawKeyValueRow([
      { label: 'Can Accommodate Fire Extinguisher?', value: val('axisSbbFireExtinguisher', fireExtComputed) },
      { label: 'Property in Land Locked Area?', value: val('axisSbbLandLockedArea') }
    ]);
    
    this.drawKeyValueRow([
      { label: 'Property in Community Dominated Area?', value: val('axisSbbCommunityDominatedArea') },
      { label: 'Boundaries Match Documentation?', value: val('axisSbbBoundariesMatchDocument') }
    ]);

    this.drawSectionSubtitle('BOUNDARIES/DIMENSIONS (Comparison Matrix)');
    const headers = ['BOUNDARIES/DIMENSIONS', '(AS PER SALE DEED)', '(AS PER ACTUAL SITE)'];
    const rows = [
      ['NORTH', val('axisSbbNorthAsPerDeed'), val('axisSbbNorthAsPerActual')],
      ['SOUTH', val('axisSbbSouthAsPerDeed'), val('axisSbbSouthAsPerActual')],
      ['EAST', val('axisSbbEastAsPerDeed'), val('axisSbbEastAsPerActual')],
      ['WEST', val('axisSbbWestAsPerDeed'), val('axisSbbWestAsPerActual')]
    ];
    this.drawTable(headers, rows, [140, 184, 184], [], [0]);
    this.advanceCursor(10);
    
    this.drawSectionSubtitle('PLOT AREA, LOCALITY, INFRASTRUCTURE & USAGE');
    
    this.drawKeyValueRow([
      { label: 'Plot Area (As per Documents)', value: val('axisSbbPlotAreaAsPerDocument') },
      { label: 'Plot Area (As per Sale Deed)', value: val('axisSbbPlotAreaAsPerSaleDeed', areaComputed) }
    ]);
    
    this.drawKeyValueRow([
      { label: 'Class of Locality', value: val('axisSbbClassOfLocality') },
      { label: 'Quality of Infrastructure', value: val('axisSbbQualityOfInfrastructure') }
    ]);
    
    this.drawKeyValueRow([
      { label: 'Ownership Status', value: (fields as any).axisSbbOwnershipStatus === 'GOVT. AUTHORITY, SPECIFY' && !(fields as any).axisSbbOwnershipStatusIsNA ? val('axisSbbOwnershipStatusSpecify') : val('axisSbbOwnershipStatus') },
      { label: 'Approved Usage of Property', value: val('axisSbbApprovedUsage') }
    ]);
    
    this.drawKeyValueRow([
      { label: 'Actual Usage of Property', value: val('axisSbbActualUsage') },
      { label: 'Restrictive Covenants in regards to land use', value: val('axisSbbRestrictiveCovenants') }
    ]);
  }

  private drawSbbSection5() {
    const fields = this.fields;
    
    const val = (key: string, computed?: string) => {
      if ((fields as any)[`${key}IsNA`]) return 'NA';
      if ((fields as any)[`${key}EditOn`] || !computed) {
        const raw = (fields as any)[key];
        if (Array.isArray(raw)) return raw.length ? raw.join(', ') : 'NA';
        return String(raw || 'NA').replace(/[\t\n\r]+/g, ' ').trim() || 'NA';
      }
      return computed;
    };

    const address = (fields as any).axisSbbAddressOfTheProperty || '';
    const distMatch = address.match(/DIST(?:RICT)?[-\s]*(.*?)(?=,|-|PIN|$)/i);
    const mouzaMatch = address.match(/(?:MOUZA|VILLAGE)[-\s]*(.*?)(?=,|$|DIST)/i);
    const parsedCity = (distMatch ? distMatch[1] : (mouzaMatch ? mouzaMatch[1] : 'CITY')).trim().toUpperCase();

    const stationName = (fields as any).axisSbbDistRailwayStationName || parsedCity;
    const busStopName = (fields as any).axisSbbDistBusStopName || parsedCity;
    const stationDistKm = (fields as any).axisSbbDistRailwayStationKm || '03';
    const busStopDistKm = (fields as any).axisSbbDistBusStopKm || '03';

    const stationComputed = `${stationDistKm}-KMS (${stationName} RAILWAY STATION)`.toUpperCase();
    const busStopComputed = `${busStopDistKm}-KMS. (${busStopName} BUS STOP)`.toUpperCase();
    
    this.drawSectionSubtitle('TYPE OF PROPERTY');
    
    this.drawKeyValueRow([
      { label: '(A) PLOT/UNDER CONSTRUCTION', value: val('axisSbbPropertyType') },
      { label: 'Level of Land', value: val('axisSbbLevelOfLand', (fields as any).axisSbbLevelOfLandDropdown === 'CUSTOM' ? ((fields as any).axisSbbLevelOfLand || 'NA') : ((fields as any).axisSbbLevelOfLandDropdown || 'PLAIN')) }
    ]);
    
    this.drawKeyValueRow([
      { label: 'Any Construction Observed', value: val('axisSbbAnyConstructionObserved') },
      { label: '% of Construction', value: val('axisSbbPercentOfConstruction', '100%') + (val('axisSbbPercentOfConstruction') !== 'NA' && !(fields as any).axisSbbPercentOfConstructionEditOn ? '%' : '') }
    ]);
    
    this.drawKeyValueRow([
      { label: 'Vacant Land Demarcated', value: val('axisSbbVacantLandDemarcated') },
      { label: '(B) RESIDENTIAL PROPERTY', value: val('axisSbbResidentialProperty') }
    ]);
    
    this.drawSimpleRow('(C) COMMERCIAL/INDUSTRIAL PROPERTY', val('axisSbbCommercialIndustrialProperty'));
    
    this.drawSectionSubtitle('ACCESSIBILITY/ BOUNDARIES/OTHERS');
    
    this.drawKeyValueRow([
      { label: 'Civic Amenities (School, Hospital, Market)', value: val('axisSbbCivicAmenities') },
      { label: 'Local Transport', value: val('axisSbbLocalTransport') }
    ]);
    
    this.drawKeyValueRow([
      { label: 'Distance from Railway Station', value: val('axisSbbDistRailwayStation', stationComputed) },
      { label: 'Bus Stop/Taxi/Auto Stand', value: val('axisSbbDistBusStop', busStopComputed) }
    ]);
  }

  private drawSbbSection4() {
    const fields = this.fields;
    const address = (fields as any).axisSbbAddressOfTheProperty || '';
    
    // Auto-fill computations
    const plotComputed = address.split(/MOUZA|VILLAGE/i)[0].trim().toUpperCase() || 'KHATA NO. XX, PLOT NO. YY';
    const mouzaMatch = address.match(/(?:MOUZA|VILLAGE)[-\s]*(.*?)(?=,|$|DIST)/i);
    const mouzaComputed = mouzaMatch ? mouzaMatch[0].toUpperCase() : '';
    const distMatch = address.match(/DIST(?:RICT)?[-\s]*(.*?)(?=,|-|PIN|$)/i);
    const distComputed = distMatch ? distMatch[1].trim().toUpperCase() : '';
    const pinMatch = address.match(/PIN[-\s]*(\d{6})/i);
    const pinComputed = pinMatch ? pinMatch[1] : '';
    const distanceKm = (fields as any).axisSbbDistanceKm || '03';
    const refCity = distComputed || mouzaComputed || 'CITY';
    const distanceComputed = `${distanceKm}- KMS FROM ${refCity} CITY CENTRE`.toUpperCase();

    const val = (key: string, computed: string) => {
      if ((fields as any)[`${key}IsNA`]) return 'NA';
      if ((fields as any)[`${key}EditOn`]) {
        return String((fields as any)[key] || 'NA').replace(/[\t\n\r]+/g, ' ').trim() || 'NA';
      }
      return computed;
    };
    
    this.drawSectionSubtitle('CADASTRAL & POSTAL ADDRESS DETAILS');
    
    this.drawKeyValueRow([
      { label: 'Lease / Sale Deed Number(s) & Date', value: val('axisSbbDeedNumberDate', String((fields as any).axisSbbDeedNumberDate || 'NA')) },
      { label: 'Plot No / S.No / G.No / Khasra No', value: val('axisSbbPlotKhasraNo', plotComputed) }
    ]);
    
    this.drawKeyValueRow([
      { label: 'Road Width & Material', value: val('axisSbbRoadWidthMaterial', String((fields as any).axisSbbRoadWidthMaterial || 'NA')) },
      { label: 'Colony / Nagar / Sector', value: val('axisSbbColonySector', String((fields as any).axisSbbColonySector || 'NA')) }
    ]);
    
    this.drawKeyValueRow([
      { label: 'Locality / Landmark', value: val('axisSbbLocalityLandmark', String((fields as any).axisSbbLocalityLandmark || 'NA')) },
      { label: 'Village / Town / City (Mouza)', value: val('axisSbbVillageCity', mouzaComputed) }
    ]);
    
    this.drawKeyValueRow([
      { label: 'District', value: val('axisSbbDistrict', (fields as any).axisSbbDistrictDropdown === 'CUSTOM' ? ((fields as any).axisSbbDistrict || 'NA') : distComputed) },
      { label: 'State', value: val('axisSbbState', (fields as any).axisSbbStateDropdown === 'CUSTOM' ? ((fields as any).axisSbbState || 'NA') : ((fields as any).axisSbbStateDropdown || 'ODISHA')) }
    ]);
    
    this.drawKeyValueRow([
      { label: 'PIN Code', value: val('axisSbbPinCode', pinComputed) },
      { label: 'Distance from City Centre', value: val('axisSbbDistanceFromCityCenter', distanceComputed) }
    ]);
  }

  private drawSbbSection3() {
    const fields = this.fields;
    
    this.drawSectionSubtitle('DETAILS OF THE PROPERTY BEING VALUED');
    
    const drawCheckbox = (x: number, y: number, checked: boolean, text: string) => {
      const boxSize = 8;
      this.page.drawRectangle({
        x: x,
        y: this.pdfY(y) - boxSize + 1,
        width: boxSize,
        height: boxSize,
        borderColor: rgb(0,0,0),
        borderWidth: 1
      });
      const font = checked ? this.fontBold : this.fontRegular;
      this.page.drawText(text, {
        x: x + boxSize + 4,
        y: this.pdfY(y),
        size: FONT_SIZE,
        font: font,
        color: rgb(0,0,0)
      });
    };

    const drawRow = (leftText: string, drawRight: (x: number, y: number, w: number) => number) => {
      const startY = this.cursorY;
      const leftW = 160;
      const rightW = CONTENT_W - leftW;
      
      this.checkPageSpace(150);
      
      const rightX = MARGIN_L + leftW + 5;
      const finalY = drawRight(rightX, this.cursorY + 5, rightW - 10);
      
      const rowHeight = (finalY - this.cursorY) + 5;
      
      this.page.drawRectangle({
        x: MARGIN_L,
        y: this.pdfY(this.cursorY + rowHeight),
        width: CONTENT_W,
        height: rowHeight,
        borderColor: rgb(0,0,0),
        borderWidth: 1
      });
      
      this.page.drawLine({
        start: { x: MARGIN_L + leftW, y: this.pdfY(this.cursorY) },
        end: { x: MARGIN_L + leftW, y: this.pdfY(this.cursorY + rowHeight) },
        thickness: 1,
        color: rgb(0,0,0)
      });
      
      const leftLines = this.wrapText(leftText, leftW - 10, FONT_SIZE, false);
      const textH = leftLines.length * (FONT_SIZE + 4);
      let ty = this.cursorY + (rowHeight - textH) / 2 + FONT_SIZE;
      for (const line of leftLines) {
        this.page.drawText(line, { x: MARGIN_L + 5, y: this.pdfY(ty), size: FONT_SIZE, font: this.fontBold, color: rgb(0,0,0) });
        ty += FONT_SIZE + 4;
      }
      
      this.cursorY += rowHeight;
    };

    drawRow('LOCATION OF PROPERTY', (x, y, w) => {
      let cy = y;
      const loc = fields.axisSbbPropertyLocation || '';
      drawCheckbox(x, cy, loc === 'Urban', 'URBAN');
      drawCheckbox(x + 70, cy, loc === 'Semi-Urban', 'SEMI-URBAN');
      drawCheckbox(x + 165, cy, loc === 'Rural/Gram Panchayat', 'RURAL/GRAM PANCHAYAT');
      
      cy += 16;
      const gov = fields.axisSbbGoverningBody || '';
      drawCheckbox(x, cy, gov === 'Corporation', 'CORPORATION');
      drawCheckbox(x + 100, cy, gov === 'Municipality', 'MUNICIPALITY');
      drawCheckbox(x + 200, cy, gov === 'Town or Gram Panchayat or Rural', 'TOWN OR GRAM PANCHAYAT OR RURAL');
      
      cy += 24;
      this.page.drawText('IF TOWN OR GRAM PANCHAYAT, PLEASE CHOOSE THE APPROPRIATE ONE IN BELOW: -', {
        x: x, y: this.pdfY(cy), size: FONT_SIZE, font: this.fontRegular, color: rgb(0,0,0)
      });
      
      cy += 20;
      const t = fields.axisSbbTownPlanningSubType || '';
      
      const drawType = (label: string, text: string, isChecked: boolean) => {
        const fullText = `${label}:- ${text}`;
        const lines = this.wrapText(fullText, w, FONT_SIZE, false);
        const font = isChecked ? this.fontBold : this.fontRegular;
        for (const line of lines) {
          this.page.drawText(line, { x: x, y: this.pdfY(cy), size: FONT_SIZE, font: font, color: rgb(0,0,0) });
          if (line.startsWith('TYPE')) {
            const splitMatch = line.match(/^(TYPE [A-Z0-9]+:-)/);
            if (splitMatch) {
               const uw = font.widthOfTextAtSize(splitMatch[1], FONT_SIZE);
               this.page.drawLine({
                 start: { x: x, y: this.pdfY(cy) - 2 },
                 end: { x: x + uw, y: this.pdfY(cy) - 2 },
                 thickness: 1,
                 color: rgb(0,0,0)
               });
            }
          }
          cy += 14;
        }
        cy += 6;
      };
      
      drawType('TYPE 1', 'LAYOUT PLAN & INDIVIDUAL CONSTRUCTION BOTH ARE APPROVED BY TOWN PLANNING AUTHORITY.', t === 'TYPE 1');
      drawType('TYPE 2A', 'LAYOUT PLAN APPROVED BY TOWN PLANNING AUTHORITY AND CONSTRUCTION APPROVED BY GRAMPANCHAYAT.', t === 'TYPE 2A');
      drawType('TYPE 2B', 'LAYOUT PLAN & INDIVIDUAL CONSTRUCTION BOTH ARE APPROVED BY GRAMPANCHAYAT BUT PROPERTY NOW FALLS IN MUNICIPALITY.', t === 'TYPE 2B');
      drawType('TYPE 3', 'LAYOUT PLAN & INDIVIDUAL CONSTRUCTION BOTH ARE APPROVED BY GRAMPANCHAYAT BUT PROPERTY NOW FALLS INSIDE GRAM PANCHAYAT.', t === 'TYPE 3');
      
      return cy;
    });

    drawRow('DOCUMENTS PROVIDED', (x, y, w) => {
      let cy = y;
      
      drawCheckbox(x, cy, !!fields.axisSbbDocPrevValuation, 'COPY OF PREVIOUS VALUATION REPORT');
      drawCheckbox(x + 230, cy, !!fields.axisSbbDocApprovedLayout, 'APPROVED LAYOUT');
      drawCheckbox(x + 360, cy, !!fields.axisSbbDocCommencement, 'COMMENCEMENT');
      
      cy += 16;
      drawCheckbox(x, cy, !!fields.axisSbbDocApprovedBuildingPlan, 'APPROVED BUILDING PLAN');
      drawCheckbox(x + 160, cy, !!fields.axisSbbDocSaleDeed, 'COPY OF SALE. DEED/ PATTA');
      drawCheckbox(x + 360, cy, !!fields.axisSbbDocCommencement, 'CERTIFICATE');
      
      cy += 16;
      drawCheckbox(x, cy, !!fields.axisSbbDocOccupancy, 'OCCUPANCY CERTIFICATE');
      drawCheckbox(x + 160, cy, !!fields.axisSbbDocPartitionDeed, 'COPY PARTITION DEED');
      drawCheckbox(x + 320, cy, !!fields.axisSbbDocSketchMap, 'SKETCH MAP');
      
      cy += 16;
      return cy;
    });
  }

  private drawSbbSection2() {
    const fields = this.fields;
    const fv = (key: string, defaultVal = '') => String((fields as any)[key] || defaultVal).replace(/[\t\n\r]+/g, ' ').trim() || defaultVal;

    this.drawKeyValueRow([
      { label: 'Report Initiated By Area', value: fv('axisSbbReportInitiatedBy') },
      { label: 'Name of Area', value: fv('axisSbbAreaName') }
    ]);
    this.drawKeyValueRow([
      { label: 'Name of Owner', value: fv('axisSbbOwnerName') },
      { label: 'Name of Customer', value: fv('axisSbbCustomerName') }
    ]);
    this.drawKeyValueRow([
      { label: 'Date of Property Visit', value: fv('axisSbbDateOfVisit') },
      { label: 'Sale Deed Discretions For Which Valuation Done', value: fv('axisSbbSaleDeedDiscretions') }
    ]);
  }

  // ─── Cover Page (Page 1) ───────────────────────────────────────────────
  private drawSbbCoverPage() {
    const fields = this.fields;
    const fv = (key: string, defaultVal = '') => String((fields as any)[key] ?? defaultVal).replace(/[\t\n\r]+/g, ' ');

    // Reset cursor for the cover page
    this.cursorY = 60;

    // Page 1 Border
    const bmx = 30;
    const bmyTop = 105;
    const bmyBot = 85;
    const borderColorHex = hexToRgb('#4a6078');

    // Outer thick border
    this.page.drawRectangle({
      x: bmx,
      y: bmyBot,
      width: PAGE_W - 2 * bmx,
      height: PAGE_H - bmyBot - bmyTop,
      borderColor: borderColorHex,
      borderWidth: 2.5,
    });
    // Inner thin border
    this.page.drawRectangle({
      x: bmx + 3,
      y: bmyBot + 3,
      width: PAGE_W - 2 * bmx - 6,
      height: PAGE_H - bmyBot - bmyTop - 6,
      borderColor: borderColorHex,
      borderWidth: 0.75,
    });

    const drawCenteredBold = (text: string, size: number, ySpaceAfter: number, underline: boolean = false) => {
      const cleanText = this.sanitizeText(text);
      const maxWidth = PAGE_W - 2 * bmx - 140;
      const lines = this.wrapText(cleanText, maxWidth, size, true);

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const tw = this.fontBold.widthOfTextAtSize(line, size);
        const startX = MARGIN_L + (CONTENT_W - tw) / 2;
        const startY = this.pdfY(this.cursorY);
        this.page.drawText(line, { x: startX, y: startY, size, font: this.fontBold, color: rgb(0, 0, 0) });
        if (underline && i === lines.length - 1) {
          this.page.drawLine({
            start: { x: startX, y: startY - 2 },
            end: { x: startX + tw, y: startY - 2 },
            thickness: 1,
            color: rgb(0, 0, 0)
          });
        }
        if (i < lines.length - 1) {
          this.cursorY += size + 4;
        } else {
          this.cursorY += ySpaceAfter;
        }
      }
    };

    drawCenteredBold('VALUATION OF IMMOVABLE PROPERTY', FONT_SIZE_TITLE + 3, 40, true);

    // Property Owners from dynamic array
    drawCenteredBold('PROPERTY OWNER', FONT_SIZE_HEADER, 16, true);
    const owners = Array.isArray(fields.axisSbbPropertyOwners) && fields.axisSbbPropertyOwners.length > 0
      ? fields.axisSbbPropertyOwners
      : [{ name: '', relationship: 'S/O', relativeName: '', fatherName: '' }];
    const validOwners = owners.filter((o: any) => o.name);
    if (validOwners.length > 0) {
      const ownerStrings = validOwners.map((owner: any) => {
        const rel = owner.relationship || 'S/O';
        const relName = owner.relativeName || owner.fatherName;
        if (relName) {
          return `${owner.name} ${rel} ${relName}`;
        }
        return owner.name;
      });

      let ownersText = '';
      if (ownerStrings.length === 1) {
        ownersText = ownerStrings[0];
      } else if (ownerStrings.length === 2) {
        ownersText = ownerStrings.join(' & ');
      } else {
        const last = ownerStrings.pop();
        ownersText = ownerStrings.join(', ') + ' & ' + last;
      }
      
      drawCenteredBold(ownersText, FONT_SIZE, 14);
    }
    this.cursorY += 16;

    drawCenteredBold('ADDRESS OF THE PROPERTY', FONT_SIZE_HEADER, 16, true);
    drawCenteredBold(fv('axisSbbAddressOfTheProperty'), FONT_SIZE, 40);

    drawCenteredBold('VALUE OF THE PROPERTY', FONT_SIZE_HEADER, 16, true);
    let pmv = fv('axisSbbPresentMarketValue', '');
    let dsv = fv('axisSbbDistressSaleValue', '');
    let rv = fv('axisSbbRealizableValue', '');

    if (!this.fields.axisSbbEnableCoverPageValueEdit) {
      const baseV = Number(this.fields.axisSbbTotalValueOfPropertyAfterCompletion || 0);
      const calcPmv = baseV > 0 ? Math.round(baseV / 1000) * 1000 : 0;
      pmv = calcPmv > 0 ? calcPmv.toFixed(2) : '0.00';
      dsv = calcPmv > 0 ? (Math.round((calcPmv * 0.90) / 1000) * 1000).toFixed(2) : '0.00';
      rv = calcPmv > 0 ? (Math.round((calcPmv * 0.95) / 1000) * 1000).toFixed(2) : '0.00';
    }

    drawCenteredBold(`PRESENT MARKET VALUE: ${pmv}`, FONT_SIZE, 14);
    drawCenteredBold(`DISTRESS SALE VALUE: ${dsv}`, FONT_SIZE, 14);
    drawCenteredBold(`REALIZABLE VALUE: ${rv}`, FONT_SIZE, 40);

    drawCenteredBold('PURPOSE OF VALUATION', FONT_SIZE_HEADER, 16, true);
    drawCenteredBold(fv('axisSbbPurposeOfValuation', 'TO ASSESS THE FAIR MARKET VALUE OF THE COLLATERAL SECURITY'), FONT_SIZE, 40);

    drawCenteredBold('PREPARED BY', FONT_SIZE_HEADER, 16, true);

    drawCenteredBold(fv('axisSbbPreparedByCompany', 'M/s. S MOHANTY ASSOCIATES'), FONT_SIZE, 14);
    drawCenteredBold(fv('axisSbbPreparedByDesignation', 'EMPANELLED VALUER & CHARTERED ENGINEER'), FONT_SIZE, 14);

    const plotNo = fv('axisSbbPreparedByPlotNo', 'Plot no-859/2494/3232 & 858/2493/3295');
    if (plotNo) drawCenteredBold(`${plotNo},`, FONT_SIZE, 14);

    const street = fv('axisSbbPreparedByStreet', 'Shiv Nagar Tankapani Road');
    if (street) drawCenteredBold(`${street},`, FONT_SIZE, 14);

    const cityStatePin = [
      fv('axisSbbPreparedByCity', 'Bhubaneswar'),
      fv('axisSbbPreparedByState', 'Odisha'),
      fv('axisSbbPreparedByPinCode', '751018') ? `Pin-${fv('axisSbbPreparedByPinCode', '751018')}` : ''
    ].filter(Boolean).join(', ');
    if (cityStatePin) drawCenteredBold(cityStatePin, FONT_SIZE, 14);

    drawCenteredBold(`PHONE- ${fv('axisSbbPreparedByPhone', '06742381145')}`, FONT_SIZE, 14);

    let rawMobile = fv('axisSbbPreparedByMobile', '9937023855/9437074855');
    let processedMobile = rawMobile.replace(/[^0-9]+/g, '/').replace(/(^\/|\/$)/g, '');
    drawCenteredBold(`MOBILE-${processedMobile}`, FONT_SIZE, 0);
  }

  private drawSbbSection9() {
    const fields = this.fields;
    const val = (key: string, computed?: string) => {
      if (fields[`${key}IsNA`]) return 'NA';
      if (fields[`${key}EditOn`] || !computed) {
        return String(fields[key] || 'NA').replace(/[\t\n\r]+/g, ' ').trim() || 'NA';
      }
      return computed;
    };

    const numVal = (key: string, computed?: string) => {
      const str = val(key, computed);
      return str === 'NA' ? 'NA' : `Rs. ${Number(str).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/-`;
    };

    // Computations from React Component
    const landAreaPrefill = fields.axisSbbPlotAreaAsPerDocument || '';
    const buildingAreaPrefill = fields.axisSbbTotalConstructedArea || '';

    const getLandArea = () => fields.axisSbbValuationLandAreaIsNA ? 0 : (fields.axisSbbValuationLandAreaEditOn ? fields.axisSbbValuationLandArea : landAreaPrefill);
    const getBldgArea = () => fields.axisSbbValuationBuildingAreaIsNA ? 0 : (fields.axisSbbValuationBuildingAreaEditOn ? fields.axisSbbValuationBuildingArea : buildingAreaPrefill);

    const landAmount = Number(getLandArea()) * Number(fields.axisSbbValuationLandRate || 0);
    const buildingAmount = Number(getBldgArea()) * Number(fields.axisSbbValuationBuildingRate || 0);
    const amenitiesAmount = Number(fields.axisSbbValuationAmenitiesArea || 0) * Number(fields.axisSbbValuationAmenitiesRate || 0);
    const totalAmountComp = landAmount + buildingAmount + amenitiesAmount;
    const totalSayComp = Math.floor(totalAmountComp / 1000) * 1000;

    const govtLandAmount = Number(fields.axisSbbGovtLandAreaIsNA ? 0 : (fields.axisSbbGovtLandAreaEditOn ? fields.axisSbbGovtLandArea : landAreaPrefill)) * Number(fields.axisSbbGovtLandRate || 0);
    const govtBuildingAmount = Number(fields.axisSbbGovtBuildingAreaIsNA ? 0 : (fields.axisSbbGovtBuildingAreaEditOn ? fields.axisSbbGovtBuildingArea : buildingAreaPrefill)) * Number(fields.axisSbbGovtBuildingRate || 0);

    const marketValueComp = totalAmountComp;
    const distressValueComp = marketValueComp * 0.90;
    const realizableValueComp = marketValueComp * 0.95;
    const insurableValueComp = buildingAmount * 0.85;

    // --- Table 9.1 ---
    this.drawSectionSubtitle('Table 9.1: Market Valuation Calculation');
    const table91Headers = ['ITEM DESCRIPTION', 'AREA (SQ.FT)', 'RATE PER SQ.FT (RS.)', 'AMOUNT (RS.)'];
    const table91Data = [
      ['Land', val('axisSbbValuationLandArea', landAreaPrefill), val('axisSbbValuationLandRate'), numVal('axisSbbValuationLandAmount', landAmount.toFixed(2))],
      ['Building G+1', val('axisSbbValuationBuildingArea', buildingAreaPrefill), val('axisSbbValuationBuildingRate'), numVal('axisSbbValuationBuildingAmount', buildingAmount.toFixed(2))],
      ['Amenities', val('axisSbbValuationAmenitiesArea'), val('axisSbbValuationAmenitiesRate'), numVal('axisSbbValuationAmenitiesAmount', amenitiesAmount.toFixed(2))],
    ];
    this.drawTable(table91Headers, table91Data, [40, 20, 20, 20]);
    this.cursorY += 2;
    this.drawSimpleRow('Total Valuation 100% Completion (I+II)', numVal('axisSbbValuationTotalAmount', totalAmountComp.toFixed(2)), true, true);
    this.drawSimpleRow('Total Valuation in Say', numVal('axisSbbValuationTotalSayAmount', totalSayComp.toFixed(2)), true, true);

    this.cursorY += 10;
    
    // --- Table 9.2 ---
    this.drawSectionSubtitle('Table 9.2: Government Guideline / Benchmark Value');
    const table92Headers = ['ITEM DESCRIPTION', 'AREA (SQ.FT)', 'GUIDELINE RATE PER SQ.FT (RS.)', 'GOVT. GUIDELINE VALUE (RS.)'];
    const table92Data = [
      ['Land', val('axisSbbGovtLandArea', landAreaPrefill), val('axisSbbGovtLandRate'), numVal('axisSbbGovtLandAmount', govtLandAmount.toFixed(2))],
      ['Building', val('axisSbbGovtBuildingArea', buildingAreaPrefill), val('axisSbbGovtBuildingRate'), numVal('axisSbbGovtBuildingAmount', govtBuildingAmount.toFixed(2))],
    ];
    this.drawTable(table92Headers, table92Data, [40, 20, 20, 20]);

    this.cursorY += 10;

    // --- Summary Cards ---
    this.drawSectionSubtitle('Final Valuation Summary');
    this.drawKeyValueRow([
      { label: 'Market Value', value: numVal('axisSbbFinalMarketValue', marketValueComp.toFixed(2)) },
      { label: 'Distressed / Forced Sale Value (90%)', value: numVal('axisSbbFinalDistressValue', distressValueComp.toFixed(2)) }
    ]);
    this.drawKeyValueRow([
      { label: 'Realizable Value (95%)', value: numVal('axisSbbFinalRealizableValue', realizableValueComp.toFixed(2)) },
      { label: 'Insurable Value (App.)', value: numVal('axisSbbFinalInsurableValue', insurableValueComp.toFixed(2)) }
    ]);
  }

  private drawSbbSection10() {
    const fields = this.fields;
    
    const val = (key: string, computed?: string) => {
      if ((fields as any)[`${key}IsNA`]) return 'NA';
      if ((fields as any)[`${key}EditOn`] || !computed) {
        return String((fields as any)[key] || 'NA').replace(/[\t\n\r]+/g, ' ').trim() || 'NA';
      }
      return computed;
    };

    const structTypes = [];
    if (fields.axisSbbTypeOfStructureGCI) structTypes.push('GCI');
    if (fields.axisSbbTypeOfStructureTinShed) structTypes.push('TIN SHED');
    if (fields.axisSbbTypeOfStructureRCC) structTypes.push('RCC');
    if (fields.axisSbbTypeOfStructureAluform) structTypes.push('ALUFORM SHUTTERING');
    const structVal = structTypes.length > 0 ? structTypes.join(', ') : 'RCC';

    const areaStr = fields.axisSbbLandAreaAcres || fields.axisSbbLandAreaDecimals ? `${fields.axisSbbLandAreaAcres || 0} AC. ${fields.axisSbbLandAreaDecimals || 0} DEC.` : (fields.axisSbbPlotAreaAsPerDocument || '');
    const buaStr = fields.axisSbbTotalConstructedArea || '';
    const floorBreakdown = fields.axisSbbNoOfFloors || '';
    const age = fields.axisSbbAgeOfProperty || '';
    const occupancy = fields.axisSbbOccupancyDetails || '';
    const location = [fields.axisSbbColonySector, fields.axisSbbLocalityLandmark, fields.axisSbbVillageCity].filter(Boolean).join(', ');
    const civicRadius = fields.axisSbbBasicAmenities || '';
    const corp = fields.axisSbbWardNoGramPanchayat || '';
    const cityDist = fields.axisSbbDistanceCityCentre || '';
    const approachRoad = fields.axisSbbRoadWidthMaterial || '';
    const farComp = fields.axisSbbStructureConfirmingByelaws || '';

    const synthesizedRemarks = `The subject property is a ${structVal} structured building (${floorBreakdown}) having total land area of ${areaStr} and total built-up area of ${buaStr} sq.ft. The property is approximately ${age} years old and currently ${occupancy}. It is located at ${location} under the jurisdiction of ${corp}. Basic civic amenities are ${civicRadius}. The property is situated at a distance of ${cityDist} from the city centre and is accessible via a ${approachRoad}. Structure compliance to byelaws: ${farComp}.`;

    this.drawSectionSubtitle('10.1 TECHNICAL INSPECTION REMARKS & SPECIAL NOTES');
    this.drawSimpleRow('REMARKS: -', val('axisSbbRemarks', synthesizedRemarks));
    if (fields.axisSbbRemarksNote && !fields.axisSbbRemarksNoteIsNA) {
      this.drawSimpleRow('NOTE:-', val('axisSbbRemarksNote'));
    }

    this.drawSectionSubtitle('10.2 UNDERTAKING:-');
    if (fields.axisSbbUndertakingIsNA) {
       this.drawSimpleRow('UNDERTAKING', 'NA');
    } else {
       const clauses = [
          { key: 'axisSbbUndertakingClause1', label: 'I HAVE PERSONALLY VISITED THE PROPERTY & IDENTIFIED THE SAME BASED ON THE DOCUMENTS PROVIDED.' },
          { key: 'axisSbbUndertakingClause2', label: 'I/WE HAVE NO DIRECT OR INDIRECT INTEREST IN THE PROPERTY BEING VALUED.' },
          { key: 'axisSbbUndertakingClause3', label: 'THE INFORMATION FURNISHED ABOVE IS TRUE AND CORRECT TO MY/OUR KNOWLEDGE.' },
          { key: 'axisSbbUndertakingClause4', label: 'I HAVE NOT BEEN PENALIZED OR CONVICTED BY ANY BANK/FINANCIAL INSTITUTION/GOVERNMENT DEPARTMENT/PSU/CORPORATE.' },
          { key: 'axisSbbUndertakingClause5', label: 'THIS VALUATION IS PREPARED WITHOUT ANY PREJUDICE OR BIAS TO ANY PERSON OR INSTITUTION.' },
          { key: 'axisSbbUndertakingClause6', label: 'THE VALUE OF LAND IS TAKEN INTO ACCOUNT BY MAKING DUE ENQUIRES IN THE LOCALITY AND ASCERTAINING THE SALES VALUE OF THE PROPERTIES IN THE LOCALITY.' },
          { key: 'axisSbbUndertakingClause7', label: 'ANY ADDITIONS/ALTERATIONS MADE TO THE PROPERTY AFTER THE DATE OF VALUATIONS SHALL NOT FALL UNDER THE SCOPE OF THIS REPORT.' },
       ];
       
       let undertakingText = '';
       clauses.forEach((clause, index) => {
         if (fields[clause.key]) {
           undertakingText += `${index + 1}. ${clause.label}\n`;
         }
       });
       
       this.drawSimpleRow('UNDERTAKING CLAUSES', undertakingText.trim() || 'NO CLAUSES CHECKED');
    }
  }
}
