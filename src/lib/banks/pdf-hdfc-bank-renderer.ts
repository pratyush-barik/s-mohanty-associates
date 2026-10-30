import {
  PDFBankRenderer,
  CONTENT_W,
  MARGIN_L,
  BORDER_W,
  FONT_SIZE,
  FONT_SIZE_HEADER,
  FONT_SIZE_TITLE,
  fetchBytes,
  formatReportDate,
} from '../pdf-bank-renderer';
import { HDFCReportFields, calculateTotalLandValue, parseNum } from '@/app/portal/reports/[projectId]/banks/hdfc/HDFCTypes';
import { formatIndianCurrency, rupeesInWords } from '@/lib/numberToWords';

export class PDFHDFCBankRenderer extends PDFBankRenderer {
  private fields: HDFCReportFields;
  private projectCode?: string;

  constructor(fields: HDFCReportFields, projectCode?: string) {
    super();
    this.fields = fields;
    this.projectCode = projectCode;
  }

  public async render(): Promise<Uint8Array> {
    await this.init();

    const fmtDate = (d?: string | null) => formatReportDate(d, '________');
    const f = this.fields;

    // ── 0. Title & Reference Header ──────────────────────────────────────────
    this.drawTextBlock('To,', { bold: true });
    this.drawTextBlock(f.to || 'HDFC BANK LTD - HL-LAP-BLG', { bold: true });
    if (f.branchName) {
      this.drawTextBlock(`Branch: ${f.branchName}`, { bold: true });
    }
    this.drawRichTextBlock([
      { text: 'Date of Valuation Report: ' },
      { text: fmtDate(f.dateOfValuation), bold: true },
    ]);
    this.drawRichTextBlock([
      { text: 'Reference No: ' },
      { text: f.refNo || this.projectCode || '________', bold: true },
    ]);
    this.advanceCursor(6);
    this.drawCenteredTitle('VALUATION REPORT (HL-LAP-BLG)');
    this.advanceCursor(8);

    // ── 1. General Details ───────────────────────────────────────────────────
    this.drawSectionHeader('1. GENERAL DETAILS');
    const effectivePropType = f.propertyType === 'Other' ? f.propertyTypeOther || 'Other' : f.propertyType;
    this.drawOptionRow(
      'Type of Property',
      ['Residential', 'Commercial', 'Residential cum Commercial', 'Industrial', 'Institutional', 'Vacant Plot', 'Other'],
      effectivePropType
    );
    this.drawSimpleRow('Name of the Customer(s)', `"${f.ownerName || 'N/A'}"`);
    this.drawSimpleRow('Name of Document Holder', f.documentHolderName || f.ownerName || 'N/A');

    // Property Address
    if (f.annexureEnabled && !f.annexureRefShowAlso) {
      this.drawSimpleRow('Property Address (Site)', 'Refer to Annexure Schedule');
    } else {
      const fullAddr = [f.ownerAddress, f.city, f.state, f.pincode].filter(Boolean).join(', ');
      this.drawSimpleRow('Property Address (Site)', fullAddr || 'N/A');
    }
    this.drawSimpleRow('Prominent Landmark', f.landmark || 'N/A');

    // Loan details
    const appLabel = f.loanApplicationType ? `${f.loanApplicationType} Application No` : 'Loan Application No';
    this.drawSimpleRow(appLabel, f.loanApplicationNo || 'N/A');

    // Legal Address
    if (f.legalAnnexureEnabled && !f.legalAnnexureRefShowAlso) {
      this.drawSimpleRow('Legal Address (Khata / Survey / Plot / Mouza)', 'Refer to Annexure Schedule');
    } else {
      this.drawSimpleRow('Legal Address (Khata / Survey / Plot / Mouza)', f.legalAddress || 'N/A');
    }

    this.drawSimpleRow('Date of Inspection', fmtDate(f.dateOfInspection));
    this.drawSimpleRow('Date of Valuation Report', fmtDate(f.dateOfValuation));
    this.drawSimpleRow('Name of Bank / Institution', 'HDFC BANK (HL-LAP-BLG)');
    this.drawSimpleRow('Valuation Purpose', f.purpose || 'Home Loan / LAP / Business Loan Group');
    this.advanceCursor(8);

    // ── 2. Surrounding Locality Details ──────────────────────────────────────
    this.drawSectionHeader('2. SURROUNDING LOCALITY DETAILS');
    this.drawSimpleRow('Ward No / Municipal Corporation', f.wardNo || 'N/A');
    this.drawOptionRow('Vicinity / Surroundings', ['Residential', 'Commercial', 'Mixed / Semi-Commercial', 'Industrial', 'Agricultural'], f.vicinity);
    this.drawOptionRow('Class of Locality', ['High / Posh Class', 'Upper Middle Class', 'Middle Class', 'Lower Middle Class', 'Underdeveloped / Slum'], f.classOfLocality);
    this.drawSimpleRow('Approach Road Width (Actual)', f.approachRoadWidthActual || f.approachRoadWidth || 'N/A');
    this.drawOptionRow('Approach Road Category', ['>=60 Feet Road', '60-40 Feet Road', '40-20 Feet Road', '<20 Feet Road'], f.approachRoadWidth);
    this.drawOptionRow('Plot Demarcated on Site', ['Yes', 'No', 'Partially Demarcated'], f.plotDemarcated);

    const rDist = f.distanceRailwayStation ? `${f.distanceRailwayStation}${f.railwayStationName ? ` (${f.railwayStationName})` : ''}` : 'N/A';
    this.drawSimpleRow('Distance to Railway Station', rDist);
    const bDist = f.distanceBusStop ? `${f.distanceBusStop}${f.busStopName ? ` (${f.busStopName})` : ''}` : 'N/A';
    this.drawSimpleRow('Distance to Bus Stop', bDist);
    const hDist = f.distanceHospital ? `${f.distanceHospital}${f.hospitalName ? ` (${f.hospitalName})` : ''}` : 'N/A';
    this.drawSimpleRow('Distance to Hospital', hDist);

    this.drawOptionRow('Property Identification', ['Easy to Identify', 'Moderate Identification', 'Difficult to Identify'], f.propertyIdentification);
    this.drawOptionRow('Proximity to Basic Facilities', ['< 1 Km', '1-3 Kms', '3-5 Kms', '> 5 Kms'], f.proximityToFacilities);
    this.drawSimpleRow('Nearest Landmark Description', f.landmarkNearest || 'N/A');
    this.advanceCursor(8);

    // ── 3. Property Details ──────────────────────────────────────────────────
    this.drawSectionHeader('3. PROPERTY DETAILS');
    this.drawOptionRow('Usage Type', ['Residential', 'Commercial', 'Mixed (Resi + Comm)', 'Industrial', 'Institutional', 'Agricultural'], f.usageType);
    this.drawSimpleRow('Additional Amenities Available', f.additionalAmenities || 'Not Applicable');
    this.drawOptionRow('Legal Status of Land', ['Freehold', 'Leasehold (Govt/BDA)', 'Leasehold (Private)', 'Possession Rights'], f.legalStatus);
    this.advanceCursor(8);

    // ── 4. Subject Property Details & Boundaries ────────────────────────────
    this.drawSectionHeader('4. SUBJECT PROPERTY DETAILS & BOUNDARIES');
    this.drawOptionRow('Premises Type', ['Independent House / Villa', 'Row House', 'Flat / Apartment', 'Commercial Unit / Shop', 'Industrial Shed', 'Vacant Plot'], f.premisesType);
    this.drawOptionRow('Occupancy Status', ['Self Occupied', 'Tenant Occupied', 'Vacant', 'Partially Self / Tenant'], f.occupiedBy);
    this.drawSimpleRow('Property Taxation Status', f.propertyTaxation || 'Average');

    // Land Boundaries Table
    this.drawTextBlock('Plot / Land Physical Boundaries:', { bold: true });
    this.drawSimpleRow('North Boundary', f.boundaryNorth || 'N/A');
    this.drawSimpleRow('South Boundary', f.boundarySouth || 'N/A');
    this.drawSimpleRow('East Boundary', f.boundaryEast || 'N/A');
    this.drawSimpleRow('West Boundary', f.boundaryWest || 'N/A');

    // Building Boundaries Table
    this.advanceCursor(4);
    this.drawTextBlock('Building Physical Boundaries:', { bold: true });
    this.drawSimpleRow('North Boundary', f.buildingBoundaryNorth || 'N/A');
    this.drawSimpleRow('South Boundary', f.buildingBoundarySouth || 'N/A');
    this.drawSimpleRow('East Boundary', f.buildingBoundaryEast || 'N/A');
    this.drawSimpleRow('West Boundary', f.buildingBoundaryWest || 'N/A');
    this.advanceCursor(8);

    // ── 5. Structural Details ────────────────────────────────────────────────
    this.drawSectionHeader('5. STRUCTURAL DETAILS');
    this.drawOptionRow('Structure Type', ['RCC', 'Load Bearing', 'Steel Structure', 'Composite Structure', 'Industrial Shed', 'NA'], f.structureType);
    this.drawSimpleRow('Number of Floors', f.numberOfFloors || '1');
    this.drawSimpleRow('Internal Composition', f.internalComposition || 'Good');
    this.drawSimpleRow('Actual Age of Property', f.ageOfPropertyActual ? `${f.ageOfPropertyActual} Years` : 'N/A');
    this.drawOptionRow('Age Category', ['1-10 years', '11-25 years', '26-50 years', '>50 years'], f.ageOfProperty);
    this.drawSimpleRow('Estimated Future Life', f.estimatedFutureLife ? `${f.estimatedFutureLife} Years` : 'N/A');
    this.drawOptionRow('Quality of Construction', ['Superior', 'Good', 'Average', 'Poor'], f.qualityOfConstruction);
    this.drawOptionRow('Maintenance Condition', ['Good', 'Average', 'Needs Maintenance'], f.maintenanceCondition);
    this.drawSimpleRow('Foundation Structure', f.foundation || 'RCC');
    this.drawSimpleRow('Superstructure', f.superstructure || 'Brick Masonry');
    this.drawSimpleRow('Flooring Type', f.flooringType || 'Tile Flooring');
    this.drawSimpleRow('Roof Type', f.roofType || 'RCC Roofing');
    this.drawSimpleRow('Doors & Windows', f.doorsWindows || 'Wooden/UPVC');
    this.drawSimpleRow('Sanitary & Plumbing Fittings', f.sanitary || 'Standard');
    this.drawSimpleRow('Electrification Installation', f.electrification || 'Concealed');
    this.advanceCursor(8);

    // ── 6. Plan Approvals & Compliance ───────────────────────────────────────
    this.drawSectionHeader('6. PLAN APPROVALS & COMPLIANCE');
    this.drawOptionRow('Construction Approved by Authority', ['Yes', 'No', 'Gram Panchayat / Not Applicable'], f.constructionApproved);
    this.drawSimpleRow('Approval Letter No / Date', f.approvalDetails || 'N/A');
    this.drawOptionRow('Violations / Deviations Observed', ['Nil', 'Low', 'Moderate', 'Significant Deviation'], f.violationsObserved);
    this.advanceCursor(8);

    // ── 7. Land & Building Valuation ─────────────────────────────────────────
    this.drawSectionHeader('7. LAND & BUILDING VALUATION');

    // Land Valuation
    const landVal = calculateTotalLandValue(f.landArea, f.landAreaUnit || 'Sqft', f.landRatePerUnit);
    this.drawTextBlock('Part A: Land Valuation', { bold: true });
    this.drawSimpleRow('Land Area Measured', f.landArea ? `${f.landArea} ${f.landAreaUnit || 'Sqft'}` : 'N/A');
    this.drawSimpleRow('Adopted Market Land Rate', f.landRatePerUnit ? `Rs. ${f.landRatePerUnit} per ${f.landAreaUnit || 'Sqft'}` : 'N/A');
    this.drawSimpleRow('Govt Guideline Land Rate', f.govtLandRate ? `Rs. ${f.govtLandRate} per ${f.landAreaUnit || 'Sqft'}` : 'N/A');
    this.drawSimpleRow('Calculated Land Value (Part A)', landVal > 0 ? formatIndianCurrency(landVal) : 'Rs. 0');
    this.advanceCursor(6);

    // Floor-wise Building Valuation
    this.drawTextBlock('Part B: Building Superstructure Valuation (Floor-wise)', { bold: true });
    let totalBldgVal = 0;
    const floorRows = (f.floors || []).map((fl) => {
      const a = parseNum(fl.area);
      const r = parseNum(fl.rate);
      const d = parseNum(fl.depreciationPct) / 100;
      const net = a * r * (1 - d);
      totalBldgVal += net;
      return [
        fl.name || 'Floor',
        fl.area ? `${fl.area} Sqft` : '-',
        fl.rate ? `Rs. ${fl.rate}` : '-',
        fl.ageYears ? `${fl.ageYears} Yrs` : '-',
        fl.depreciationPct ? `${fl.depreciationPct}%` : '0%',
        net > 0 ? formatIndianCurrency(Math.round(net)) : 'Rs. 0',
      ];
    });

    this.drawDataTable(
      ['Floor Level', 'BUA (Sqft)', 'Rate (Rs/Sqft)', 'Age', 'Depr %', 'Net Value'],
      floorRows
    );
    this.advanceCursor(4);

    const totalMarketVal = landVal + totalBldgVal;
    this.drawCertificateBox([
      {
        segments: [
          { text: 'TOTAL FAIR MARKET VALUATION (LAND + BUILDING): ', bold: true },
          { text: totalMarketVal > 0 ? formatIndianCurrency(Math.round(totalMarketVal)) : 'Rs. 0', bold: true },
        ],
      },
      {
        segments: [
          { text: totalMarketVal > 0 ? rupeesInWords(Math.round(totalMarketVal)) : 'Zero Rupees Only' },
        ],
      },
    ]);
    this.advanceCursor(8);

    // ── 8. Abstract of Valuation ─────────────────────────────────────────────
    this.drawSectionHeader('8. ABSTRACT OF VALUATION & GUIDELINES');
    const rPct = parseNum(f.realizablePct) || 90;
    const dPct = parseNum(f.distressPct) || 80;
    const realVal = Math.round(totalMarketVal * (rPct / 100));
    const distVal = Math.round(totalMarketVal * (dPct / 100));

    this.drawSimpleRow(`Realizable Value (${rPct}%)`, realVal > 0 ? formatIndianCurrency(realVal) : 'Rs. 0');
    this.drawSimpleRow(`Distress Sale Value (${dPct}%)`, distVal > 0 ? formatIndianCurrency(distVal) : 'Rs. 0');
    this.drawSimpleRow('Govt Guideline Summary Value', f.guidelineValue ? `Rs. ${f.guidelineValue}` : 'N/A');
    this.advanceCursor(8);

    // ── 9. Remarks & Declaration ─────────────────────────────────────────────
    this.drawSectionHeader('9. REMARKS & DECLARATION');
    this.drawOptionRow('Demarcation Status', ['Clear', 'Not Demarcated', 'Partially Demarcated'], f.demarcation);
    this.drawOptionRow('Possession Status', ['With Owner', 'With Tenant', 'Vacant Possession'], f.possession);
    this.drawSimpleRow('Inspecting Representative Name', f.representativeName || 'N/A');
    if (f.representativeFatherName) {
      this.drawSimpleRow("Representative Father's Name", f.representativeFatherName);
    }
    this.drawSimpleRow('Valuer Observations & Remarks', f.remarks || 'Property observed in sound physical and structural condition.');

    this.advanceCursor(6);
    this.drawDeclarationBox([
      {
        segments: [
          {
            text: `I hereby certify that I have physically inspected the subject property on ${fmtDate(f.dateOfInspection)}. The statements of fact contained in this report are true and correct to the best of my professional judgment. I have no direct or indirect interest in the property valued herein. The valuation has been prepared in conformity with standard banking valuation guidelines for HDFC Bank.`,
          },
        ],
      },
    ]);

    this.advanceCursor(10);
    this.drawSignatureBlock([
      { text: 'For S. Mohanty & Associates', bold: true },
      { text: 'Authorized Valuer / Engineer' },
    ]);
    this.advanceCursor(16);

    // ── Enclosure 1: Documents ───────────────────────────────────────────────
    if (Array.isArray(f.documentImages) && f.documentImages.length > 0) {
      this.addNewPage();
      this.drawSectionHeader('ENCLOSURE 1: VERIFIED DOCUMENTS');
      for (let i = 0; i < f.documentImages.length; i++) {
        const docUrl = f.documentImages[i];
        const docName = f.documentImageNames?.[i] || `Document ${i + 1}`;
        const docBytes = await fetchBytes(docUrl);
        if (docBytes) {
          await this.drawImageSection(docBytes, docName, 320, true);
          this.advanceCursor(10);
        }
      }
    }

    // ── Enclosure 2: Maps ────────────────────────────────────────────────────
    const mapList: { url: string; label: string }[] = [];
    if (Array.isArray(f.locationMapImages)) {
      f.locationMapImages.forEach((u, i) => u && mapList.push({ url: u, label: `Location Map ${i + 1}` }));
    }
    if (Array.isArray(f.mouzaMapImages)) {
      f.mouzaMapImages.forEach((u, i) => u && mapList.push({ url: u, label: `Mouza Map ${i + 1}` }));
    }
    if (Array.isArray(f.sketchMapImages)) {
      f.sketchMapImages.forEach((u, i) => u && mapList.push({ url: u, label: `Sketch Map ${i + 1}` }));
    }
    if (Array.isArray(f.cadastralMapImages)) {
      f.cadastralMapImages.forEach((u, i) => u && mapList.push({ url: u, label: `Cadastral Map ${i + 1}` }));
    }
    if (Array.isArray(f.bdaMapImages)) {
      f.bdaMapImages.forEach((u, i) => u && mapList.push({ url: u, label: `BDA / CDP Map ${i + 1}` }));
    }

    if (mapList.length > 0) {
      this.addNewPage();
      this.drawSectionHeader('ENCLOSURE 2: MAPS & LAYOUT PLANS');
      for (const m of mapList) {
        const mBytes = await fetchBytes(m.url);
        if (mBytes) {
          await this.drawImageSection(mBytes, m.label, 320, true);
          this.advanceCursor(10);
        }
      }
    }

    // ── Enclosure 3: Photographs ─────────────────────────────────────────────
    if (Array.isArray(f.propertyImages) && f.propertyImages.length > 0) {
      this.addNewPage();
      this.drawSectionHeader('ENCLOSURE 3: PHOTOGRAPHS OF SUBJECT PROPERTY');

      // Process in pairs of 2
      for (let i = 0; i < f.propertyImages.length; i += 2) {
        const img1Url = f.propertyImages[i];
        const label1 = f.propertyImageNames?.[i] || `Photograph ${i + 1}`;
        const img1Bytes = await fetchBytes(img1Url);

        const img2Url = f.propertyImages[i + 1];
        const label2 = f.propertyImageNames?.[i + 1] || `Photograph ${i + 2}`;
        const img2Bytes = img2Url ? await fetchBytes(img2Url) : null;

        if (img1Bytes && img2Bytes) {
          await this.drawImagePair(img1Bytes, label1, img2Bytes, label2);
        } else if (img1Bytes) {
          await this.drawImageSection(img1Bytes, label1, 280, true);
        }
        this.advanceCursor(8);
      }
    }

    return await this.save();
  }
}
