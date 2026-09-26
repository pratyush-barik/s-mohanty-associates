import { rgb, PDFImage } from 'pdf-lib';
import {
  PDFBankRenderer,
  PAGE_W,
  PAGE_H,
  MARGIN_T,
  MARGIN_B,
  MARGIN_L,
  MARGIN_R,
  CONTENT_W,
  FONT_SIZE,
  FONT_SIZE_HEADER,
  FONT_SIZE_TITLE,
  FONT_SIZE_SMALL,
  FONT_SIZE_CAPTION,
  LINE_HEIGHT,
  BORDER_W,
  LBL_BG,
  OPT_BG,
  BG_OPACITY,
  hexToRgb,
  formatReportDate,
} from '../pdf-bank-renderer';
import { BaseReportFields } from '../bank-fields';

export interface AxisHLLAPBUAFloor {
  floor: string;
  area: string;
}

export interface AxisHLLAPReportFields extends Partial<BaseReportFields> {
  // Header
  refNo: string;
  reportDate: string;

  // 1. Customer Details
  customerName: string;
  customerContactDetails: string;

  // 2. APP ID
  appId: string;

  // 3. Documents Provided
  documentsProvided: string;

  // 4. Property Details
  propertyDetailsHeader: string;
  plotNo: string;
  khataNo: string;
  locality: string;
  road: string;
  city: string;
  district: string;
  pinCode: string;
  nearbyLandMark: string;
  distanceFromCityCenter: string;
  availabilityOfLocalTransport: string;
  levelOfLand: string;
  classOfLocality: string;
  qualityOfInfrastructure: string;

  // 4n. Boundaries (Deed, Actual, and optional Sketch Map)
  boundaryEastDeed: string;
  boundaryEastActual: string;
  boundaryWestDeed: string;
  boundaryWestActual: string;
  boundaryNorthDeed: string;
  boundaryNorthActual: string;
  boundarySouthDeed: string;
  boundarySouthActual: string;

  boundaryEastSketch?: string;
  boundaryWestSketch?: string;
  boundaryNorthSketch?: string;
  boundarySouthSketch?: string;

  // 4o - 4z
  boundariesMatch: string;
  statusOfLand: string;
  typeOfProperty: string;
  approvedUsage: string;
  actualUsage: string;
  typeOfStructure: string;
  noOfFloors: string;
  occupancyDetails: string;
  hasElectricityWaterDrainage: string;
  proximityToCivicAmenities: string;
  developmentOfSurroundingArea: string;
  latitude: string;
  longitude: string;

  // 5. APPROVAL DETAILS
  approvedPlanDetails?: string;
  layoutApprovalNo: string;
  layoutApprovalDate: string;
  layoutExpiryDate: string;
  buildingPlanApprovalNo: string;
  buildingPlanApprovalDate: string;
  buildingPlanExpiryDate: string;
  constructionCommencementDate: string;
  expectedCompletionDate: string;

  // 6. CONSTRUCTION DETAILS
  plotOrFlat?: 'Plot' | 'Flat' | string;
  plotAreaDocs: string;
  demarcationAtSite: string;
  approvedBUATotal: string;
  approvedBUAFloors: AxisHLLAPBUAFloor[];
  measuredBUATotal: string;
  measuredBUAFloors: AxisHLLAPBUAFloor[];
  isConstructionAsPerPlan: string;
  detailsOfExtraConstruction: string;
  sideMarginFront: string;
  sideMarginRight: string;
  sideMarginLeft: string;
  sideMarginBack: string;
  qualityOfConstruction: string;
  maintenanceOfProperty: string;
  currentLifeOfStructure: string;
  projectedLifeOfStructure: string;

  // 7. Recommended Valuation of the Property
  recommendedRatePerSqft: string;
  plotAreaForValuation: string;
  plotRateForValuation: string;
  valueOfPlotFlat: string;
  constructionRatePerSqft?: string;
  proposedStructureType?: string;
  estimatedCostOfConstruction: string;
  totalCostOfConstruction: string;
  isUnderConstruction?: boolean;
  constructionCostAsOnDate?: string;
  stageOfConstruction: string;
  percentWorkCompleted: string;
  percentDisbursementRecommended: string;
  currentValueOfProperty: string;
  currentValueAsOnDate?: string;
  dateOfPropertyVisit: string;

  // 8 - 12
  valuationGovtReckonerRate: string;
  distressedPercentage?: string;
  distressedValuation: string;
  rentalValuePerMonth: string;
  photosAttached: string;
  locationSketchAttached: string;
  remarks: string;

  // Signatory
  valuerName?: string;
  valuerTitle?: string;

  // Documents & Enclosures
  documentImages?: string[];
  documentImageNames?: string[];
  locationMapImages?: string[];
  mouzaMapImages?: string[];
  sketchMapImages?: string[];
  cadastralMapImages?: string[];
  propertyImages?: string[];
  propertyImageNames?: string[];
  [key: string]: any;
}

/**
 * Dynamically derive the structure type string (e.g. 'Proposed G+2', 'Proposed Ground Floor')
 * auto-referenced from BUA floor breakup (Section 6.c / 6.d).
 */
export function deriveStructureType(fields: {
  measuredBUAFloors?: AxisHLLAPBUAFloor[];
  approvedBUAFloors?: AxisHLLAPBUAFloor[];
  isUnderConstruction?: boolean;
}): string {
  const floors = (fields.measuredBUAFloors && fields.measuredBUAFloors.length > 0)
    ? fields.measuredBUAFloors
    : (fields.approvedBUAFloors && fields.approvedBUAFloors.length > 0)
    ? fields.approvedBUAFloors
    : [];

  const validFloors = floors.filter(f => (f.floor && f.floor.trim()) || (f.area && f.area.trim()));
  const floorList = validFloors.length > 0 ? validFloors : floors;

  if (floorList.length === 0) {
    return 'Proposed Ground Floor';
  }

  let hasBasement = false;
  let basementCount = 0;
  let hasStilt = false;
  let hasGround = false;
  let upperFloorCount = 0;

  for (const f of floorList) {
    const name = (f.floor || '').toLowerCase().trim();
    if (name.includes('basement') || name.startsWith('b+') || name.includes('lower ground')) {
      hasBasement = true;
      basementCount++;
    } else if (name.includes('stilt')) {
      hasStilt = true;
    } else if (name.includes('ground') || name === 'gf' || name.startsWith('g+') || name.includes('gr. floor')) {
      hasGround = true;
    } else {
      upperFloorCount++;
    }
  }

  let structBody = '';
  if (hasBasement && hasGround) {
    const bStr = basementCount > 1 ? `B${basementCount}+` : 'B+';
    structBody = upperFloorCount > 0 ? `${bStr}G+${upperFloorCount}` : `${bStr}Ground Floor`;
  } else if (hasStilt) {
    const totalUpper = upperFloorCount + (hasGround ? 1 : 0);
    structBody = totalUpper > 0 ? `S+${totalUpper}` : 'Stilt';
  } else if (hasGround || upperFloorCount > 0) {
    if (upperFloorCount > 0) {
      structBody = `G+${upperFloorCount}`;
    } else {
      structBody = 'Ground Floor';
    }
  } else {
    const count = floorList.length;
    if (count === 1) structBody = 'Ground Floor';
    else structBody = `G+${count - 1}`;
  }

  return `Proposed ${structBody}`;
}

const TABLE_FONT_SIZE = FONT_SIZE; // Standardized to 12 pt
const TABLE_MIN_ROW_H = 16;

export class PDFAxisHLLAPRenderer extends PDFBankRenderer {
  private colSl = 48;
  private colLbl = 216;
  private colVal = CONTENT_W - 48 - 216; // 223.28 (Total = 487.28 = CONTENT_W)

  /**
   * Draw a Section Header row that spans across the merged width (colLbl + colVal).
   * Only used for section headings that have sub-fields but no entry of their own.
   */
  private drawHLLAPHeaderRow(
    sl: string,
    title: string,
    labelBg: string | undefined = LBL_BG,
    fontSize: number = FONT_SIZE
  ): void {
    const mergedW = this.colLbl + this.colVal;
    const hSl = sl ? this.cellHeight(sl, this.colSl, { bold: true, fontSize }) : TABLE_MIN_ROW_H;
    const hTitle = this.cellHeight(title, mergedW, { bold: true, fontSize });
    const rowH = Math.max(TABLE_MIN_ROW_H, hSl, hTitle);

    this.checkPageBreak(rowH);

    // 1. Sl.No cell
    this.drawCell(MARGIN_L, this.cursorY, this.colSl, rowH, sl, {
      bold: true,
      fontSize,
      fillColor: labelBg,
      bgOpacity: labelBg ? 0.5 : undefined,
      align: 'left',
      vAlign: 'top',
    });

    // 2. Merged Title cell (spans across colLbl + colVal)
    this.drawCell(MARGIN_L + this.colSl, this.cursorY, mergedW, rowH, title, {
      bold: true,
      fontSize,
      fillColor: labelBg,
      bgOpacity: labelBg ? 0.5 : undefined,
      align: 'left',
      vAlign: 'top',
    });

    this.cursorY += rowH;
  }

  /**
   * Draw standard 3-column table row: [Sl.No | Label | Value]
   * ALWAYS maintains the 3 separate columns with top-aligned text, even if Value is empty/null.
   */
  private drawHLLAPRow(
    sl: string,
    label: string,
    val: string,
    isLabelBold: boolean = false,
    isValueBold: boolean = false,
    labelBg: string | undefined = LBL_BG,
    valBg: string | undefined = LBL_BG,
    fontSize: number = FONT_SIZE
  ): void {
    const valText = val ?? '';

    const hSl = sl ? this.cellHeight(sl, this.colSl, { bold: isLabelBold, fontSize }) : TABLE_MIN_ROW_H;
    const hLbl = this.cellHeight(label, this.colLbl, { bold: isLabelBold, fontSize });
    const hVal = this.cellHeight(valText, this.colVal, { bold: isValueBold, fontSize });
    const rowH = Math.max(TABLE_MIN_ROW_H, hSl, hLbl, hVal);

    this.checkPageBreak(rowH);

    // 1. Sl.No cell
    this.drawCell(MARGIN_L, this.cursorY, this.colSl, rowH, sl, {
      bold: isLabelBold,
      fontSize,
      fillColor: labelBg,
      bgOpacity: labelBg ? 0.5 : undefined,
      align: 'left',
      vAlign: 'top',
    });

    // 2. Label cell (216 pt)
    this.drawCell(MARGIN_L + this.colSl, this.cursorY, this.colLbl, rowH, label, {
      bold: isLabelBold,
      fontSize,
      fillColor: labelBg,
      bgOpacity: labelBg ? 0.5 : undefined,
      align: 'left',
      vAlign: 'top',
    });

    // 3. Value cell (223.28 pt) - ALWAYS drawn with border even if empty, top aligned
    this.drawCell(MARGIN_L + this.colSl + this.colLbl, this.cursorY, this.colVal, rowH, valText, {
      bold: isValueBold,
      fontSize,
      fillColor: valBg,
      bgOpacity: valBg ? 0.5 : undefined,
      align: 'left',
      vAlign: 'top',
    });

    this.cursorY += rowH;
  }

  /**
   * Draw a row with rich text segments in the label cell (e.g. bolding "Plot" or "Flat")
   */
  private drawHLLAPRichLabelRow(
    sl: string,
    labelSegments: { text: string; bold?: boolean; italic?: boolean }[],
    val: string,
    isValueBold: boolean = false,
    labelBg: string | undefined = LBL_BG,
    valBg: string | undefined = LBL_BG,
    fontSize: number = FONT_SIZE
  ): void {
    const fullLabelText = labelSegments.map(s => s.text).join('');
    const valText = val ?? '';
    const hSl = this.cellHeight(sl, this.colSl, { bold: false, fontSize });
    const hLbl = this.cellHeight(fullLabelText, this.colLbl, { bold: false, fontSize });
    const hVal = this.cellHeight(valText, this.colVal, { bold: isValueBold, fontSize });
    const rowH = Math.max(TABLE_MIN_ROW_H, hSl, hLbl, hVal);

    this.checkPageBreak(rowH);

    // 1. Sl.No cell
    this.drawCell(MARGIN_L, this.cursorY, this.colSl, rowH, sl, {
      bold: false,
      fontSize,
      fillColor: labelBg,
      bgOpacity: labelBg ? 0.5 : undefined,
      align: 'left',
      vAlign: 'top',
    });

    // 2. Rich Label cell
    if (labelBg) {
      this.drawRect(MARGIN_L + this.colSl, this.cursorY, this.colLbl, rowH, labelBg, undefined, undefined, 0.5);
    }
    this.drawRect(MARGIN_L + this.colSl, this.cursorY, this.colLbl, rowH, undefined, '#000000', 0.5);

    const pad = 4;
    const textX = MARGIN_L + this.colSl + pad;
    const textMaxWidth = this.colLbl - pad * 2;
    const textTopY = this.cursorY + pad; // Top aligned
    this.drawRichTextAt(labelSegments, textX, textTopY, textMaxWidth, fontSize);

    // 3. Value cell
    this.drawCell(MARGIN_L + this.colSl + this.colLbl, this.cursorY, this.colVal, rowH, valText, {
      bold: isValueBold,
      fontSize,
      fillColor: valBg,
      bgOpacity: valBg ? 0.5 : undefined,
      align: 'left',
      vAlign: 'top',
    });

    this.cursorY += rowH;
  }

  /**
   * Draw boundary sub-row with 3 columns: [empty Sl | Deed | Actual]
   * Does NOT cut horizontal lines into Sl No column
   */
  private drawBoundariesSection(fields: AxisHLLAPReportFields): void {
    const bLbl = 'Boundaries of Property as per documents';
    const bVal = 'Boundaries of Property as per Actual';
    const fontSize = FONT_SIZE;

    const dirRows = [
      { dir: 'East', deed: fields.boundaryEastDeed || '', actual: fields.boundaryEastActual || '' },
      { dir: 'West', deed: fields.boundaryWestDeed || '', actual: fields.boundaryWestActual || '' },
      { dir: 'North', deed: fields.boundaryNorthDeed || '', actual: fields.boundaryNorthActual || '' },
      { dir: 'South', deed: fields.boundarySouthDeed || '', actual: fields.boundarySouthActual || '' },
    ];

    const hHeaderLbl = this.cellHeight(bLbl, this.colLbl, { bold: true, fontSize });
    const hHeaderVal = this.cellHeight(bVal, this.colVal, { bold: true, fontSize });
    const headerH = Math.max(TABLE_MIN_ROW_H, hHeaderLbl, hHeaderVal);

    const rowHeights: number[] = [];
    let totalDirectionsH = 0;
    for (const r of dirRows) {
      const leftText = r.deed ? `${r.dir}:- ${r.deed}` : `${r.dir}:-`;
      const rightText = r.actual ? `${r.dir}:- ${r.actual}` : `${r.dir}:-`;
      const hL = this.cellHeight(leftText, this.colLbl, { bold: false, fontSize });
      const hR = this.cellHeight(rightText, this.colVal, { bold: false, fontSize });
      const rH = Math.max(TABLE_MIN_ROW_H, hL, hR);
      rowHeights.push(rH);
      totalDirectionsH += rH;
    }

    const totalSectionH = headerH + totalDirectionsH;
    this.checkPageBreak(totalSectionH);

    // 1. Unified tall Sl. No cell for 'n.' spanning the entire boundary block
    this.drawCell(MARGIN_L, this.cursorY, this.colSl, totalSectionH, 'n.', {
      bold: true,
      fontSize,
      fillColor: LBL_BG,
      bgOpacity: 0.5,
      align: 'left',
      vAlign: 'top',
    });

    // 2. Header row (Deed & Actual)
    this.drawCell(MARGIN_L + this.colSl, this.cursorY, this.colLbl, headerH, bLbl, {
      bold: true,
      fontSize,
      fillColor: LBL_BG,
      bgOpacity: 0.5,
      align: 'left',
      vAlign: 'top',
    });
    this.drawCell(MARGIN_L + this.colSl + this.colLbl, this.cursorY, this.colVal, headerH, bVal, {
      bold: true,
      fontSize,
      fillColor: LBL_BG,
      bgOpacity: 0.5,
      align: 'left',
      vAlign: 'top',
    });
    this.cursorY += headerH;

    // 3. Direction rows
    for (let i = 0; i < dirRows.length; i++) {
      const r = dirRows[i];
      const rH = rowHeights[i];
      const leftText = r.deed ? `${r.dir}:- ${r.deed}` : `${r.dir}:-`;
      const rightText = r.actual ? `${r.dir}:- ${r.actual}` : `${r.dir}:-`;

      this.drawCell(MARGIN_L + this.colSl, this.cursorY, this.colLbl, rH, leftText, {
        bold: false,
        fontSize,
        fillColor: LBL_BG,
        bgOpacity: 0.5,
        align: 'left',
        vAlign: 'top',
      });
      this.drawCell(MARGIN_L + this.colSl + this.colLbl, this.cursorY, this.colVal, rH, rightText, {
        bold: false,
        fontSize,
        fillColor: LBL_BG,
        bgOpacity: 0.5,
        align: 'left',
        vAlign: 'top',
      });
      this.cursorY += rH;
    }

    // Optional: Boundaries of Property as per sketch map
    const hasSketchBoundaries = !!(
      fields.boundaryEastSketch ||
      fields.boundaryWestSketch ||
      fields.boundaryNorthSketch ||
      fields.boundarySouthSketch
    );
    if (hasSketchBoundaries) {
      const sketchRows = [
        { dir: 'East', val: fields.boundaryEastSketch || '' },
        { dir: 'West', val: fields.boundaryWestSketch || '' },
        { dir: 'North', val: fields.boundaryNorthSketch || '' },
        { dir: 'South', val: fields.boundarySouthSketch || '' },
      ];
      const mergedW = this.colLbl + this.colVal;
      const sketchHdrH = Math.max(
        TABLE_MIN_ROW_H,
        this.cellHeight('Boundaries of Property as per sketch map', mergedW, { bold: true, fontSize })
      );

      const sketchHeights: number[] = [];
      let totalSketchH = sketchHdrH;
      for (const sr of sketchRows) {
        const text = sr.val ? `${sr.dir}:- ${sr.val}` : `${sr.dir}:-`;
        const rH = Math.max(TABLE_MIN_ROW_H, this.cellHeight(text, mergedW, { bold: false, fontSize }));
        sketchHeights.push(rH);
        totalSketchH += rH;
      }

      this.checkPageBreak(totalSketchH);

      // Single unified empty Sl.No box spanning sketch boundaries
      this.drawCell(MARGIN_L, this.cursorY, this.colSl, totalSketchH, '', {
        fillColor: LBL_BG,
        bgOpacity: 0.5,
      });

      // Header row spanning merged columns
      this.drawCell(MARGIN_L + this.colSl, this.cursorY, mergedW, sketchHdrH, 'Boundaries of Property as per sketch map', {
        bold: true,
        fontSize,
        fillColor: LBL_BG,
        bgOpacity: 0.5,
        align: 'left',
        vAlign: 'top',
      });
      this.cursorY += sketchHdrH;

      // Directions spanning merged columns (no horizontal cuts in Sl No!)
      for (let i = 0; i < sketchRows.length; i++) {
        const sr = sketchRows[i];
        const rH = sketchHeights[i];
        const text = sr.val ? `${sr.dir}:- ${sr.val}` : `${sr.dir}:-`;

        this.drawCell(MARGIN_L + this.colSl, this.cursorY, mergedW, rH, text, {
          bold: false,
          fontSize,
          fillColor: LBL_BG,
          bgOpacity: 0.5,
          align: 'left',
          vAlign: 'top',
        });
        this.cursorY += rH;
      }
    }
  }

  /**
   * Draw side margins section with a single unified Sl. No 'g.' box (no row slices in Sl No!)
   */
  private drawSideMarginsSection(fields: AxisHLLAPReportFields): void {
    const heading = 'Recommended / Available Side Margin';
    const margins = [
      { label: 'Front', val: fields.sideMarginFront || '' },
      { label: 'Right Side', val: fields.sideMarginRight || '' },
      { label: 'Left Side', val: fields.sideMarginLeft || '' },
      { label: 'Back Side', val: fields.sideMarginBack || '' },
    ];
    const fontSize = FONT_SIZE;
    const mergedW = this.colLbl + this.colVal;

    const hHdr = Math.max(TABLE_MIN_ROW_H, this.cellHeight(heading, mergedW, { bold: true, fontSize }));
    const marginHeights: number[] = [];
    let totalSubH = 0;
    for (const m of margins) {
      const hL = this.cellHeight(m.label, this.colLbl, { bold: false, fontSize });
      const hV = this.cellHeight(m.val, this.colVal, { bold: false, fontSize });
      const rH = Math.max(TABLE_MIN_ROW_H, hL, hV);
      marginHeights.push(rH);
      totalSubH += rH;
    }

    const totalH = hHdr + totalSubH;
    this.checkPageBreak(totalH);

    // 1. Single unified Sl. No cell for 'g.' spanning the entire side margin group
    this.drawCell(MARGIN_L, this.cursorY, this.colSl, totalH, 'g.', {
      bold: true,
      fontSize,
      fillColor: LBL_BG,
      bgOpacity: 0.5,
      align: 'left',
      vAlign: 'top',
    });

    // 2. Header row (merged across colLbl + colVal)
    this.drawCell(MARGIN_L + this.colSl, this.cursorY, mergedW, hHdr, heading, {
      bold: true,
      fontSize,
      fillColor: LBL_BG,
      bgOpacity: 0.5,
      align: 'left',
      vAlign: 'top',
    });
    this.cursorY += hHdr;

    // 3. Sub-rows: Front, Right Side, Left Side, Back Side (no horizontal cuts in Sl No!)
    for (let i = 0; i < margins.length; i++) {
      const m = margins[i];
      const rH = marginHeights[i];
      this.drawCell(MARGIN_L + this.colSl, this.cursorY, this.colLbl, rH, m.label, {
        bold: false,
        fontSize,
        fillColor: LBL_BG,
        bgOpacity: 0.5,
        align: 'left',
        vAlign: 'top',
      });
      this.drawCell(MARGIN_L + this.colSl + this.colLbl, this.cursorY, this.colVal, rH, m.val, {
        bold: false,
        fontSize,
        fillColor: LBL_BG,
        bgOpacity: 0.5,
        align: 'left',
        vAlign: 'top',
      });
      this.cursorY += rH;
    }
  }

  /**
   * Draw BUA Floor-wise breakup with unified Sl. No box
   */
  private drawBUAFloorsSection(
    sl: string,
    label: string,
    totalVal: string,
    floors: AxisHLLAPBUAFloor[] | undefined
  ): void {
    const fontSize = FONT_SIZE;
    const validFloors = (floors || []).filter(fl => fl.floor || fl.area);

    const hHdrL = this.cellHeight(label, this.colLbl, { bold: true, fontSize });
    const hHdrV = this.cellHeight(totalVal, this.colVal, { bold: true, fontSize });
    const hHdr = Math.max(TABLE_MIN_ROW_H, hHdrL, hHdrV);

    const floorHeights: number[] = [];
    let totalFloorsH = 0;
    for (const fl of validFloors) {
      const flLabel = fl.floor || 'Floor';
      const flVal = fl.area ? `${fl.area}sqft` : '';
      const hL = this.cellHeight(flLabel, this.colLbl, { bold: false, fontSize });
      const hV = this.cellHeight(flVal, this.colVal, { bold: false, fontSize });
      const rH = Math.max(TABLE_MIN_ROW_H, hL, hV);
      floorHeights.push(rH);
      totalFloorsH += rH;
    }

    const totalH = hHdr + totalFloorsH;
    this.checkPageBreak(totalH);

    // 1. Single unified Sl. No cell spanning header and floor rows
    this.drawCell(MARGIN_L, this.cursorY, this.colSl, totalH, sl, {
      bold: true,
      fontSize,
      fillColor: LBL_BG,
      bgOpacity: 0.5,
      align: 'left',
      vAlign: 'top',
    });

    // 2. Header row (label in colLbl, totalVal in colVal)
    this.drawCell(MARGIN_L + this.colSl, this.cursorY, this.colLbl, hHdr, label, {
      bold: true,
      fontSize,
      fillColor: LBL_BG,
      bgOpacity: 0.5,
      align: 'left',
      vAlign: 'top',
    });
    this.drawCell(MARGIN_L + this.colSl + this.colLbl, this.cursorY, this.colVal, hHdr, totalVal, {
      bold: true,
      fontSize,
      fillColor: LBL_BG,
      bgOpacity: 0.5,
      align: 'left',
      vAlign: 'top',
    });
    this.cursorY += hHdr;

    // 3. Floor rows (no cuts in colSl!)
    for (let i = 0; i < validFloors.length; i++) {
      const fl = validFloors[i];
      const rH = floorHeights[i];
      const flLabel = fl.floor || 'Floor';
      const flVal = fl.area ? `${fl.area}sqft` : '';

      this.drawCell(MARGIN_L + this.colSl, this.cursorY, this.colLbl, rH, flLabel, {
        bold: false,
        fontSize,
        fillColor: LBL_BG,
        bgOpacity: 0.5,
        align: 'left',
        vAlign: 'top',
      });
      this.drawCell(MARGIN_L + this.colSl + this.colLbl, this.cursorY, this.colVal, rH, flVal, {
        bold: false,
        fontSize,
        fillColor: LBL_BG,
        bgOpacity: 0.5,
        align: 'left',
        vAlign: 'top',
      });
      this.cursorY += rH;
    }
  }

  /**
   * Draw a sub-item row where Sl.No is blank (preserves 3-column grid alignment)
   */
  private drawSubItemRow(
    label: string,
    val: string,
    isLabelBold: boolean = false,
    isValueBold: boolean = false,
    labelBg: string | undefined = LBL_BG,
    valBg: string | undefined = LBL_BG,
    fontSize: number = FONT_SIZE
  ): void {
    this.drawHLLAPRow('', label, val, isLabelBold, isValueBold, labelBg, valBg, fontSize);
  }

  /**
   * Safe image embed helper (tries PNG then JPG)
   */
  public override async embedImgSafe(bytes: Uint8Array | null): Promise<any | null> {
    if (!bytes || bytes.length === 0) return null;
    try {
      return await this.doc.embedPng(bytes);
    } catch {
      try {
        return await this.doc.embedJpg(bytes);
      } catch {
        return null;
      }
    }
  }

  /**
   * Main PDF Generation orchestration for Axis Bank HL-LAP
   */
  public async generateAxisHLLAPReport(
    fields: AxisHLLAPReportFields,
    images: {
      photos: { bytes: Uint8Array; label?: string }[];
      documents?: { bytes: Uint8Array; caption?: string }[];
      locationMaps: Uint8Array[];
      mouzaMaps: Uint8Array[];
      sketchMaps?: Uint8Array[];
      cadastralMaps?: Uint8Array[];
      bdaMaps?: Uint8Array[];
    },
    letterheadBytes?: Uint8Array | null
  ): Promise<Uint8Array> {
    await this.init(letterheadBytes);

    // --- Page 1: Header ---
    const refText = fields.refNo ? `Ref No: ${fields.refNo}` : 'Ref No: ';
    const dateText = `Date: ${formatReportDate(fields.reportDate || new Date().toISOString())}`;
    const titleText = 'Valuation Report Format for Bungalow/Individual House/Resale';

    // Top line with Ref No and Date
    const headerH = 14;
    const yTop = this.pdfY(this.cursorY);
    this.page.drawText(this.sanitizeText(refText), {
      x: MARGIN_L,
      y: yTop - 10,
      size: FONT_SIZE_SMALL,
      font: this.fontBold,
      color: rgb(0, 0, 0),
    });
    const dateW = this.fontBold.widthOfTextAtSize(this.sanitizeText(dateText), FONT_SIZE_SMALL);
    this.page.drawText(this.sanitizeText(dateText), {
      x: MARGIN_L + CONTENT_W - dateW,
      y: yTop - 10,
      size: FONT_SIZE_SMALL,
      font: this.fontBold,
      color: rgb(0, 0, 0),
    });
    this.cursorY += headerH + 4;

    // Centered Title Banner (Underlined)
    const titleY = this.pdfY(this.cursorY);
    const titleW = this.fontBold.widthOfTextAtSize(titleText, FONT_SIZE_TITLE);
    const titleX = MARGIN_L + (CONTENT_W - titleW) / 2;
    this.page.drawText(titleText, {
      x: titleX,
      y: titleY - 10,
      size: FONT_SIZE_TITLE,
      font: this.fontBold,
      color: rgb(0, 0, 0),
    });
    // Underline
    this.page.drawLine({
      start: { x: titleX, y: titleY - 12 },
      end: { x: titleX + titleW + 2.5, y: titleY - 12 },
      thickness: 1,
      color: rgb(0, 0, 0),
    });
    this.cursorY += 18;

    // --- Table Header: [Sl. No. | (empty) | (empty)] ---
    const thH = Math.max(18, this.cellHeight('Sl. No.', this.colSl, { bold: true, fontSize: FONT_SIZE }));
    this.drawCell(MARGIN_L, this.cursorY, this.colSl, thH, 'Sl. No.', {
      bold: true,
      fontSize: FONT_SIZE,
      fillColor: OPT_BG,
      bgOpacity: 0.5,
      align: 'left',
      vAlign: 'middle',
    });
    this.drawCell(MARGIN_L + this.colSl, this.cursorY, this.colLbl, thH, '', {
      bold: true,
      fontSize: FONT_SIZE,
      fillColor: OPT_BG,
      bgOpacity: 0.5,
      align: 'left',
      vAlign: 'middle',
    });
    this.drawCell(MARGIN_L + this.colSl + this.colLbl, this.cursorY, this.colVal, thH, '', {
      bold: true,
      fontSize: FONT_SIZE,
      fillColor: OPT_BG,
      bgOpacity: 0.5,
      align: 'left',
      vAlign: 'middle',
    });
    this.cursorY += thH;

    // --- Row 1: Customer Details ---
    const custH1 = Math.max(TABLE_MIN_ROW_H, this.cellHeight(fields.customerName || '', this.colVal, { fontSize: TABLE_FONT_SIZE }));
    const custH2 = Math.max(TABLE_MIN_ROW_H, this.cellHeight(fields.customerContactDetails || '', this.colVal, { fontSize: TABLE_FONT_SIZE }));
    const totalCustH = custH1 + custH2;

    this.checkPageBreak(totalCustH);

    // Left Sl cell spanning both sub-rows
    this.drawCell(MARGIN_L, this.cursorY, this.colSl, totalCustH, '1.', {
      bold: true,
      fontSize: TABLE_FONT_SIZE,
      fillColor: LBL_BG,
      bgOpacity: 0.5,
      align: 'left',
      vAlign: 'top',
    });

    // 1a. Name of the Applicant
    this.drawCell(MARGIN_L + this.colSl, this.cursorY, this.colLbl, custH1, 'Name of the Applicant', {
      bold: true,
      fontSize: TABLE_FONT_SIZE,
      fillColor: LBL_BG,
      bgOpacity: 0.5,
      align: 'left',
      vAlign: 'top',
    });
    this.drawCell(MARGIN_L + this.colSl + this.colLbl, this.cursorY, this.colVal, custH1, fields.customerName || '', {
      bold: false,
      fontSize: TABLE_FONT_SIZE,
      fillColor: LBL_BG,
      bgOpacity: 0.5,
      align: 'left',
      vAlign: 'top',
    });
    this.cursorY += custH1;

    // 1b. Contact Details
    this.drawCell(MARGIN_L + this.colSl, this.cursorY, this.colLbl, custH2, 'Contact Details', {
      bold: true,
      fontSize: TABLE_FONT_SIZE,
      fillColor: LBL_BG,
      bgOpacity: 0.5,
      align: 'left',
      vAlign: 'top',
    });
    this.drawCell(MARGIN_L + this.colSl + this.colLbl, this.cursorY, this.colVal, custH2, fields.customerContactDetails || '', {
      bold: false,
      fontSize: TABLE_FONT_SIZE,
      fillColor: LBL_BG,
      bgOpacity: 0.5,
      align: 'left',
      vAlign: 'top',
    });
    this.cursorY += custH2;

    // --- Row 2: Property Address ---
    const addrPrompt = 'Address of the Property (As per agreement/Tittle deed/site visit)';
    const addrVal = fields.propertyAddress || '';
    const hAddrPrompt = this.cellHeight(addrPrompt, this.colLbl, { bold: true, fontSize: TABLE_FONT_SIZE });
    const hAddrVal = this.cellHeight(addrVal, this.colVal, { bold: false, fontSize: TABLE_FONT_SIZE });
    const row2H = Math.max(30, hAddrPrompt, hAddrVal);

    this.checkPageBreak(row2H);
    this.drawHLLAPRow('2.', addrPrompt, addrVal, true, false, LBL_BG, LBL_BG);

    // --- Row 3: Person Met at Site ---
    this.drawHLLAPRow('3.', 'Person Met at site/Relation with Customer', fields.personMetAtSite || '');

    // --- Row 4: LEGAL / PHYSICAL PARAMETERS ---
    this.checkPageBreak(45);
    this.drawHLLAPHeaderRow('4.', 'LEGAL / PHYSICAL PARAMETERS');
    this.drawHLLAPRow('a.', 'Plot  No', fields.plotNo || '');
    this.drawHLLAPRow('b.', 'S No/G. No/Khasra No/Khata No', fields.khataNo || '');
    this.drawHLLAPRow('c.', 'Locality', fields.locality || '');
    this.drawHLLAPRow('d.', 'Road', fields.road || '');
    this.drawHLLAPRow('e.', 'City', fields.city || '');
    this.drawHLLAPRow('f.', 'District', fields.district || '');
    this.drawHLLAPRow('g.', 'Pin code', fields.pinCode || '');
    this.drawHLLAPRow('h.', 'Nearby Land Mark', fields.nearbyLandMark || '');
    this.drawHLLAPRow('i.', 'Distance from City Center', fields.distanceFromCityCenter || '');
    this.drawHLLAPRow('j.', 'Availability of Local Transport : Metro/ Local Train/ Bus', fields.availabilityOfLocalTransport || '');
    this.drawHLLAPRow('k.', 'Level of land with topographical conditions', fields.levelOfLand || '');
    this.drawHLLAPRow('l.', 'Class Of Locality :  Posh/ Higher Middle Class/Middle class/Lower middle Class/ Poor', fields.classOfLocality || '');
    this.drawHLLAPRow('m.', 'Quality of Infrastructure in the vicinity', fields.qualityOfInfrastructure || '');

    // 4n. Boundaries Section (Deed vs Actual & optional Sketch)
    this.drawBoundariesSection(fields);

    // 4o - 4y
    this.drawHLLAPRow('o.', 'Does the Boundaries at Site match, as mentioned in documentation?', fields.boundariesMatch || '');
    this.drawHLLAPRow('p.', 'Status of the Land/ Flat : Free Hold/\nLeased/ Development Authority', fields.statusOfLand || '');
    this.drawHLLAPRow('q.', 'Type of Property : Bungalow/row house/\nPlot/ flat(1BHK/2BHK/3BHK)/Residential', fields.typeOfProperty || '');
    this.drawHLLAPRow('r.', 'Approved usage of Property: Agri/ Mix/ Industrial/ commercial/ Residential (Restrictive covenants in regards to Land Use, if any)', fields.approvedUsage || '');
    this.drawHLLAPRow('s.', 'Actual Usage of the Property : Agri/ Industrial/ commercial/ Residential/ Mix', fields.actualUsage || '');
    this.drawHLLAPRow('t.', 'Type of Structure : Load Bearing/RCC/Aluform shuttering', fields.typeOfStructure || '');
    this.drawHLLAPRow('u.', 'No of Floors', fields.noOfFloors || '');
    this.drawHLLAPRow('v.', 'Occupancy Details: Self Occupied/Rented/ Vacant', fields.occupancyDetails || '');
    this.drawHLLAPRow('w.', 'Does property have Electricity / Water / Drainage connection', fields.hasElectricityWaterDrainage || '');
    this.drawHLLAPRow('x.', 'Proximity to civic amenities like school, hospital, market, etc', fields.proximityToCivicAmenities || '');
    this.drawHLLAPRow('y.', 'Development of surrounding area', fields.developmentOfSurroundingArea || '');

    // 4z. Longitude & Latitude
    this.checkPageBreak(45);
    this.drawHLLAPHeaderRow('z.', 'Longitude & latitude of the property');
    this.drawHLLAPRow('i.', 'Longitude', fields.longitude || '', false, true);
    this.drawHLLAPRow('ii.', 'Latitude', fields.latitude || '', false, true);

    // --- Row 5: APPROVAL DETAILS ---
    this.checkPageBreak(65);
    this.drawHLLAPHeaderRow('5.', 'APPROVAL DETAILS');
    this.drawHLLAPRow('a.', 'Layout Approval No', fields.layoutApprovalNo || '');
    this.drawHLLAPRow('b.', 'Date of Approval', fields.layoutApprovalDate ? formatReportDate(fields.layoutApprovalDate) : '');
    this.drawHLLAPRow('c.', 'Expiry Date', fields.layoutExpiryDate ? formatReportDate(fields.layoutExpiryDate) : '');
    this.drawHLLAPRow('d.', 'Building Plan Approval No', fields.buildingPlanApprovalNo || '');
    this.drawHLLAPRow('e.', 'Date of Approval', fields.buildingPlanApprovalDate ? formatReportDate(fields.buildingPlanApprovalDate) : '');
    this.drawHLLAPRow('f.', 'Expiry Date', fields.buildingPlanExpiryDate ? formatReportDate(fields.buildingPlanExpiryDate) : '');
    this.drawHLLAPRow('g.', 'Date of Commencement of Construction', fields.constructionCommencementDate ? formatReportDate(fields.constructionCommencementDate) : '');
    this.drawHLLAPRow('h.', 'Expected Completion', fields.expectedCompletionDate ? formatReportDate(fields.expectedCompletionDate) : '');

    // --- Row 6: CONSTRUCTION DETAILS ---
    this.checkPageBreak(55);
    this.drawHLLAPHeaderRow('6.', 'CONSTRUCTION DETAILS');
    
    const isFlat = (fields.plotOrFlat || '').toLowerCase() === 'flat';
    const areaSegments = isFlat
      ? [
          { text: 'Area of the Plot/' },
          { text: 'flat', bold: true },
        ]
      : [
          { text: 'Area of the ' },
          { text: 'Plot', bold: true },
          { text: '/flat' },
        ];
    this.drawHLLAPRichLabelRow('a.', areaSegments, fields.plotAreaDocs || '', true);
    this.drawHLLAPRow('b.', 'Demarcation at Site', fields.demarcationAtSite || '');

    // 6c. Approved Built up Area & Floor-wise break up
    this.checkPageBreak(35);
    const appBUALabel = 'Approved Built up Area:_____sqft floor wise break up (for Bungalow/Twin /Row-house) as follows';
    const appBUAVal = fields.approvedBUATotal ? `Approved BUA-${fields.approvedBUATotal}sqft` : '';
    this.drawBUAFloorsSection('c.', appBUALabel, appBUAVal, fields.approvedBUAFloors);

    // 6d. Measured Built up Area & Floor-wise break up
    this.checkPageBreak(35);
    const measBUALabel = 'Measured Built up Area:_____sqft floor wise break up (for Bungalow/Twin /Row-house) as follows';
    const measBUAVal = fields.measuredBUATotal ? `Measured BUA-${fields.measuredBUATotal}sqft` : '';
    this.drawBUAFloorsSection('d.', measBUALabel, measBUAVal, fields.measuredBUAFloors);

    this.drawHLLAPRow('e.', 'Whether the construction is as per approved building plan and / or local building bye laws', fields.isConstructionAsPerPlan || '');
    this.drawHLLAPRow('f.', 'Details of Extra Construction', fields.detailsOfExtraConstruction || '');

    // 6g. Recommended / Available Side Margin
    this.drawSideMarginsSection(fields);

    this.drawHLLAPRow('h.', 'Quality of construction', fields.qualityOfConstruction || '');
    this.drawHLLAPRow('i.', 'Maintenance of the Property: excellent/very good/average/poor', fields.maintenanceOfProperty || '');
    this.drawHLLAPRow('j.', 'Current Life of the structure', fields.currentLifeOfStructure || '');
    this.drawHLLAPRow('k.', 'Projected Life of the Structure', fields.projectedLifeOfStructure || '');

    // --- Row 7: Recommended Valuation of the Property ---
    this.checkPageBreak(55);
    this.drawHLLAPHeaderRow('7.', 'Recommended Valuation of the Property');

    const rateSegments = isFlat
      ? [
          { text: 'Recommended rate of the Plot/' },
          { text: 'Flat', bold: true },
        ]
      : [
          { text: 'Recommended rate of the ' },
          { text: 'Plot', bold: true },
          { text: '/Flat' },
        ];
    this.drawHLLAPRichLabelRow('a.', rateSegments, fields.recommendedRatePerSqft || '', false);

    const valSegments = isFlat
      ? [
          { text: 'Value of the Plot/' },
          { text: 'Flat', bold: true },
        ]
      : [
          { text: 'Value of the ' },
          { text: 'Plot', bold: true },
          { text: '/Flat' },
        ];
    this.drawHLLAPRichLabelRow('b.', valSegments, fields.valueOfPlotFlat || '', true);
    this.drawHLLAPRow('c.', 'Estimated Cost of construction', fields.estimatedCostOfConstruction || '', false, true);
    
    const structType = deriveStructureType(fields);
    this.drawHLLAPRow(
      'd.',
      `Total Cost of construction (${structType}) on 100% completion`,
      fields.totalCostOfConstruction || '',
      false,
      true
    );

    // If Under-Construction or percentWorkCompleted < 100, show "As on date (X%)" construction cost
    const hasPct = fields.percentWorkCompleted !== undefined && String(fields.percentWorkCompleted).trim() !== '';
    const pctNum = hasPct ? (parseFloat(String(fields.percentWorkCompleted).replace(/[^\d.]/g, '')) || 0) : (fields.isUnderConstruction ? 0 : 100);
    const isUnderConst = fields.isUnderConstruction || pctNum < 100;
    const pctDisplay = hasPct ? (String(fields.percentWorkCompleted).includes('%') ? fields.percentWorkCompleted : `${fields.percentWorkCompleted}%`) : `${pctNum}%`;

    if (isUnderConst && fields.constructionCostAsOnDate) {
      this.drawSubItemRow(
        `As on date (${pctDisplay})`,
        fields.constructionCostAsOnDate,
        false,
        true
      );
    }

    this.drawHLLAPRow('e.', 'Stage of Construction', fields.stageOfConstruction || '');
    this.drawHLLAPRow('f.', '% Work completed', fields.percentWorkCompleted ? (String(fields.percentWorkCompleted).includes('%') ? fields.percentWorkCompleted : `${fields.percentWorkCompleted}%`) : '');
    this.drawHLLAPRow('g.', '% Disbursement Recommended', fields.percentDisbursementRecommended ? (String(fields.percentDisbursementRecommended).includes('%') ? fields.percentDisbursementRecommended : `${fields.percentDisbursementRecommended}%`) : '');

    // 7h. Current Value 100% completion (uniform LBL_BG cell color)
    this.drawHLLAPRow(
      'h.',
      'Current Value of the Property (Plot + construction)on 100% completion',
      fields.currentValueOfProperty || '',
      false,
      true,
      LBL_BG,
      LBL_BG
    );

    // If Under-Construction or percentWorkCompleted < 100, show "As on date X% completion" Current Value (uniform LBL_BG cell color)
    if (isUnderConst && fields.currentValueAsOnDate) {
      this.drawSubItemRow(
        `As on date ${pctDisplay} completion`,
        fields.currentValueAsOnDate,
        false,
        true,
        LBL_BG,
        LBL_BG
      );
    }

    this.drawHLLAPRow('i.', 'Date of Property Visit', fields.dateOfPropertyVisit || fields.reportDate ? formatReportDate(fields.dateOfPropertyVisit || fields.reportDate) : '');

    // --- Row 8: Govt Reckoner Rates ---
    this.drawHLLAPRow('8.', 'Valuation as per Government reckoner rates', fields.valuationGovtReckonerRate || '');

    // --- Row 9: Distressed Valuation (uniform LBL_BG cell color) ---
    this.drawHLLAPRow('9.', 'Distressed valuation of the Property', fields.distressedValuation || '', true, true, LBL_BG, LBL_BG);

    // --- Row 10: Rental Value ---
    this.drawHLLAPRow('10.', 'Rental value per month', fields.rentalValuePerMonth || '');

    // --- Row 11: Attachment ---
    this.drawHLLAPHeaderRow('11.', 'Attachment');
    this.drawHLLAPRow('a.', '4 photos of the Property from inside/outside are attached', fields.photosAttached || '');
    this.drawHLLAPRow('b.', 'Location sketch for the property', fields.locationSketchAttached || '');

    // --- Row 12: Remarks ---
    const remarksPrompt =
      '(Comment on - resistance for valuation if any from the current occupants for rented property, if the property falls in a community dominated areas, if the approach road to the building is small and will not be able to accommodate a fire extinguisher, does the property falls under land locked area or is prone to frequent floods & any other critical observation.)';

    const hPrompt = this.cellHeight(remarksPrompt, this.colLbl, { fontSize: FONT_SIZE });
    const hRemarks = this.cellHeight(fields.remarks || '', this.colVal, { fontSize: FONT_SIZE });
    const remarksRowH = Math.max(45, hPrompt, hRemarks);

    this.checkPageBreak(16 + remarksRowH);

    // Draw row 12 header
    this.drawHLLAPHeaderRow('12.', 'Remarks :');

    // Draw remarks content (Left: Prompt in colLbl, Right: Valuer remarks in colVal)
    // 1. Sl col (empty)
    this.drawCell(MARGIN_L, this.cursorY, this.colSl, remarksRowH, '', {
      fillColor: LBL_BG,
      bgOpacity: 0.5,
      align: 'left',
      vAlign: 'top',
    });

    // 2. Prompt in colLbl
    this.drawCell(MARGIN_L + this.colSl, this.cursorY, this.colLbl, remarksRowH, remarksPrompt, {
      bold: false,
      fontSize: FONT_SIZE,
      fillColor: LBL_BG,
      bgOpacity: 0.5,
      align: 'left',
      vAlign: 'top',
    });

    // 3. Valuer Remarks in colVal
    this.drawCell(MARGIN_L + this.colSl + this.colLbl, this.cursorY, this.colVal, remarksRowH, fields.remarks || '', {
      bold: false,
      fontSize: FONT_SIZE,
      fillColor: LBL_BG,
      bgOpacity: 0.5,
      align: 'left',
      vAlign: 'top',
    });

    this.cursorY += remarksRowH;

    // --- Undertaking Block (Full width across page) ---
    this.cursorY += 12;
    const undertakingH = 120;
    this.checkPageBreak(undertakingH);

    // Section title "Undertaking:"
    this.drawTextAt('Undertaking:', MARGIN_L, this.cursorY, {
      bold: true,
      fontSize: FONT_SIZE_HEADER,
    });
    this.cursorY += 16;

    const undertakingClauses = [
      'I have personally visited the property & identified the same based on the documents provided.',
      'I/We have no direct or Indirect Interest in the property being valued.',
      'The information furnished above is true and correct to my/our knowledge.',
    ];

    for (const clause of undertakingClauses) {
      const wrapped = this.wrapText(clause, CONTENT_W, FONT_SIZE, false);
      for (const wLine of wrapped) {
        this.drawTextAt(wLine, MARGIN_L, this.cursorY, {
          bold: false,
          fontSize: FONT_SIZE,
        });
        this.cursorY += FONT_SIZE * LINE_HEIGHT;
      }
    }

    this.cursorY += 16;

    // Authorized Signatory Block (Right-aligned matching base bank format)
    const sigLines = [
      { text: 'Authorized Signatory', bold: true, fontSize: FONT_SIZE },
      { text: 'Name & Seal of the Agency', bold: false, fontSize: FONT_SIZE },
      { text: fields.valuerName || 'Er. Satyajit Mohanty', bold: true, fontSize: FONT_SIZE },
      { text: fields.valuerTitle || 'Approved Panel Valuer', bold: false, fontSize: FONT_SIZE },
    ];

    for (const s of sigLines) {
      this.drawTextAt(s.text, MARGIN_L, this.cursorY, {
        bold: s.bold,
        fontSize: s.fontSize,
        align: 'right',
        maxWidth: CONTENT_W,
      });
      this.cursorY += s.fontSize * 1.25;
    }

    // --- Enclosures: Order = Documents -> Maps (line break, no page break) -> Photographs (fresh page) ---

    // 1. Documents Section
    const validDocs = (images.documents || []).filter(d => d.bytes && d.bytes.length > 0);
    if (validDocs.length > 0) {
      await this.drawDocumentsGallery(validDocs, 'DOCUMENTS', 240, false);
    }

    // 2. Maps Section (continues after documents with line break, no page break)
    const latLongStr = (fields.latitude || fields.longitude)
      ? ` (LAT: ${fields.latitude || ''}, LONG: ${fields.longitude || ''})`
      : '';
    const locTitle = `LOCATION MAP${latLongStr}`;
    const validLocMaps = (images.locationMaps || []).filter(m => (m as any)?.bytes ? (m as any).bytes.length > 0 : (m && (m as Uint8Array).length > 0));
    if (validLocMaps.length > 0) {
      await this.drawMapGallery(validLocMaps, locTitle, 260, false);
    }

    const allMouzaMaps = [...(images.mouzaMaps || [])].filter(m => (m as any)?.bytes ? (m as any).bytes.length > 0 : (m && (m as Uint8Array).length > 0));
    if (allMouzaMaps.length > 0) {
      await this.drawMapGallery(allMouzaMaps, 'MOUZA MAP', 260, false);
    }

    const validSketchMaps = (images.sketchMaps || []).filter(s => (s as any)?.bytes ? (s as any).bytes.length > 0 : (s && (s as Uint8Array).length > 0));
    if (validSketchMaps.length > 0) {
      await this.drawMapGallery(validSketchMaps, 'SKETCH MAP', 260, false);
    }

    const validCadastralMaps = (images.cadastralMaps || []).filter(c => (c as any)?.bytes ? (c as any).bytes.length > 0 : (c && (c as Uint8Array).length > 0));
    if (validCadastralMaps.length > 0) {
      await this.drawMapGallery(validCadastralMaps, 'CADASTRAL MAP', 260, false);
    }

    const validBdaMaps = (images.bdaMaps || []).filter(b => (b as any)?.bytes ? (b as any).bytes.length > 0 : (b && (b as Uint8Array).length > 0));
    if (validBdaMaps.length > 0) {
      await this.drawMapGallery(validBdaMaps, 'BDA MAP', 260, false);
    }

    // 3. Photographs Section (starts on a fresh page)
    const validPhotos = (images.photos || []).filter(p => p.bytes && p.bytes.length > 0);
    if (validPhotos.length > 0) {
      await this.drawPhotoGrid(validPhotos, 'PHOTOGRAPHS');
    }

    return await this.save();
  }
}
