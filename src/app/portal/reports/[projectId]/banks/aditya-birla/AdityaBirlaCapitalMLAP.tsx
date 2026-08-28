'use client';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';
import { PDFAdityaBirlaMLAPRenderer } from '@/lib/banks/pdf-aditya-birla-mlap-renderer';
import { formatIndianCurrency } from '@/lib/numberToWords';

export const ADITYA_BIRLA_CAPITAL_MLAP_CONFIG: BankConfig = {
  bankId: 'ADITYA BIRLA CAPITAL LTD',
  subTemplateId: 'MLAP',
  displayName: 'Aditya Birla Capital Ltd — MLAP',
  fieldLabels: {
    ownerName: 'Client Name',
    ownerAddress: 'Address as per Document',
    branchName: 'Vertical',
    loanApplicationNo: 'Application No.',
  },
  extraFields: {
    // -- Section 1: Basic Details --
    'section-1': [
      { key: 'propertyOwnerName', label: 'Name of Property Owner (with S/O, W/O)', span: 2 },
      { key: 'initiationDate', label: 'Initiation Date', type: 'date' },
      { key: 'valuerName', label: 'Name of the Valuer', default: 'Er. Satyajit Mohanty' },
    ],

    // -- Section 2: Location Details --
    'section-2': [
      { key: 'propertyAddressAsDocs', label: 'Address as per Document (Khata, Plot, Mouza, Tahasil, Dist, Pin)', type: 'textarea', span: 2 },
      { key: 'propertyAddressAsVisit', label: 'Address as per Physical / Site Visit', type: 'textarea', span: 2 },
      { 
        key: 'addressMatching', 
        label: 'Address Matching', 
        type: 'select', 
        options: ['Yes (As per documents)', 'No (Discrepancy observed)', 'Partially Matching'],
        default: 'Yes (As per documents)' 
      },
      { key: 'mainLocality', label: 'Main Locality (e.g. Gobindpur, Sadar)' },
      { key: 'subLocality', label: 'Sub Locality (e.g. Sadar, Keonjhar)' },
      { 
        key: 'localityType', 
        label: 'Locality Type', 
        type: 'select', 
        options: ['Residential', 'Commercial', 'Industrial', 'Institutional', 'Agriculture', 'Residential cum commercial'],
        default: 'Residential' 
      },
      { 
        key: 'localityOccupancy', 
        label: 'Occupancy of Locality', 
        type: 'select', 
        options: ['Fully Occupied', 'Moderately Occupied', 'Sparsely Occupied'],
        default: 'Fully Occupied' 
      },
      { 
        key: 'populationDensity', 
        label: 'Population Density', 
        type: 'select', 
        options: ['High', 'Moderate', 'Low'],
        default: 'Moderate' 
      },
      { key: 'distanceFromBranch', label: 'Distance from ABCL Branch', default: '2-Kms' },
      { key: 'distanceFromCityCenter', label: 'Distance from City Center', default: '2-Kms from market area' },
      { key: 'amenitiesAvailability', label: 'Availability of Amenities (school, market etc)', default: '1-2 Kms' },
      { key: 'approachRoadWidth', label: 'Approach Road Width (e.g. 10 feet wide Road)', default: '10 feet wide Road' },
      { key: 'valuedBefore', label: 'Has Valuator Done Valuation for this property before?', type: 'yesno', default: 'No' },
      { key: 'valuedBeforeDate', label: 'If Yes When?', default: 'NA' },
      { key: 'landLocked', label: 'Land Locked', type: 'yesno', default: 'No' },
      { key: 'otherEncumbranceFeatures', label: 'Any other features (Court notice / other financier board / etc.)', type: 'yesno', default: 'No' },
    ],

    // -- Section 3: Property Detailings --
    'section-3': [
      { key: 'occupiedBy', label: 'Occupancy Status', type: 'select', options: ['Vacant', 'Self Occupied', 'Tenanted', 'Under Construction'], default: 'Vacant' },
      { key: 'occupantName', label: 'Occupied By (Name)', default: 'NA' },
      { key: 'occupantRelation', label: 'Relationship of Occupant with Client', default: 'NA' },
      { key: 'plotDemarcated', label: 'Property Demarcation (yes/no)', type: 'yesno', default: 'No' },
      { key: 'propertyIdentification', label: 'Property Identification (yes/no)', type: 'yesno', default: 'Yes' },
      { key: 'propertySubType', label: 'Property Sub Type (e.g. Single / Multi-units building - R, Flat)', default: 'Single / Multi-units building - R' },
      { key: 'propertyHolding', label: 'Property Holding', type: 'select', options: ['Freehold', 'Leasehold', 'Government Grant'], default: 'Freehold' },
      { 
        key: 'propertyJurisdiction', 
        label: 'Property situated in Limits', 
        type: 'select', 
        options: ['Gram Panchayat', 'Municipal Corporation', 'Municipality', 'Development Authority / BDA', 'NAC'],
        default: 'Gram Panchayat' 
      },
      { key: 'marketability', label: 'Marketability', type: 'select', options: ['Good', 'Average', 'Poor'], default: 'Average' },
      { key: 'ageOfPropertyActual', label: 'Property Age', default: '0-Years' },
      { key: 'estimatedFutureLife', label: 'Residual Age', default: '60-Years' },
      { key: 'qualityOfConstruction', label: 'Construction Quality', type: 'select', options: ['Good', 'Average', 'Poor'], default: 'Average' },
      { key: 'structureType', label: 'Structure Type', type: 'select', options: ['RCC', 'Load Bearing', 'Steel Structure', 'Semi-Pucca'], default: 'RCC' },
      { key: 'dimensionWidth', label: 'Width (Facing Road Side) in feet', default: 'NA' },
      { key: 'dimensionDepth', label: 'Depth (in feet)', default: 'NA' },
      { key: 'cautiousLocations', label: 'Cautious Locations', default: 'NA' },
      { key: 'flatConfigurationType', label: 'If Flat, Configuration Type (1BHK/2BHK/3BHK)', default: 'NA' },
      { key: 'percentageCompletion', label: 'Percentage Completion of Property (e.g. 65%)', default: '65%' },
      { key: 'percentageRecommendation', label: 'Percentage Recommendation of Property (e.g. 70%)', default: '70%' },
    ],

    // -- Section 4: Documentation --
    'section-4': [
      { key: 'documentsProvided', label: 'Documents Provided', default: 'Copy of Sale deed, ROR & Sketch map' },
      { key: 'sanctionPlanDetails', label: 'Sanction Plan details if provided', default: 'Plan is not provided' },
      { key: 'utilityBills', label: 'Utility Bills (Water bill, electricity bill)', default: 'NA' },
    ],

    // -- Section 5: Accommodation Details --
    'section-5': [
      { key: 'groundFloorRooms', label: 'Ground Floor Rooms (e.g. 2 Bed, 1 Kitchen)', default: '2 Bedroom, 1 Kitchen' },
      { key: 'firstFloorRooms', label: 'First Floor Rooms', default: 'NA' },
      { key: 'secondFloorRooms', label: 'Second Floor Rooms', default: 'NA' },
      { key: 'thirdFloorRooms', label: 'Third Floor Rooms', default: 'NA' },
      { key: 'forthFloorRooms', label: 'Forth Floor Rooms', default: 'NA' },
    ],

    // -- Section 6: Build Up Details --
    'section-6': [
      { key: 'buaGFSite', label: 'Ground Floor BUA as per Site', default: 'RCC-1441sqft' },
      { key: 'buaGFPlan', label: 'Ground Floor BUA as per Plan/Allowed', default: 'NA' },
      { key: 'buaGFDeviation', label: 'Ground Floor Percentage Deviation', default: 'NA' },
      { key: 'buaFFSite', label: 'First Floor BUA as per Site', default: 'NA' },
      { key: 'buaFFPlan', label: 'First Floor BUA as per Plan/Allowed', default: 'NA' },
      { key: 'buaFFDeviation', label: 'First Floor Percentage Deviation', default: 'NA' },
    ],

    // -- Section 7: Valuation --
    'section-7': [
      { key: 'plotAreaDocs', label: 'Plot Area (As per Documents) in Sqft', default: '2613' },
      { key: 'plotAreaPhysical', label: 'Plot Area (As per Physical) in Sqft', default: '2613' },
      { key: 'plotAreaConsidered', label: 'Plot Area (Considered For Valuation) in Sqft', default: '2613' },
      { key: 'landRatePerSqft', label: 'Land Rate / Sqft (?)', default: '800' },
      { key: 'buaPlan', label: 'Build Up Area (As per Plan/Document)', default: 'Plan is not provided' },
      { key: 'buaActual', label: 'Build Up Area (As per Actual) in Sqft', default: '1441' },
      { key: 'buaRate100Pct', label: 'BUA Rate / Sqft (on 100% completion) (?)', default: '1500' },
      { key: 'buaConsidered', label: 'Build Up Area (Considered for Valuation) in Sqft', default: '1441' },
      { key: 'buaRateConsidered', label: 'BUA Considered Rate / Sqft (as on date) (?)', default: '975' },
      { key: 'superBua', label: 'Super Build Up Area (In case of Composite)', default: 'NA' },
      { key: 'amenitiesValue', label: 'Amenities (Parking / Lumpsum value) (?)', default: '0' },
      { key: 'realizablePct', label: 'Realizable Value Percentage (%)', default: '90' },
      { key: 'distressPct', label: 'Distress Value Percentage (%)', default: '80' },
    ],

    // -- Section 8: Boundary Details --
    'section-8': [
      { key: 'boundarySketchNorth', label: 'Sketch Map — North', default: 'Deepak Behera & Bibhu Ranjan Palei' },
      { key: 'boundarySketchSouth', label: 'Sketch Map — South', default: 'Road' },
      { key: 'boundarySketchEast', label: 'Sketch Map — East', default: 'Sonali Sethi' },
      { key: 'boundarySketchWest', label: 'Sketch Map — West', default: 'Archana Debarchana Sethi' },
      { key: 'boundaryMouzaNorth', label: 'Mouza Map — North', default: 'Plot no-165' },
      { key: 'boundaryMouzaSouth', label: 'Mouza Map — South', default: 'Plot no-168' },
      { key: 'boundaryMouzaEast', label: 'Mouza Map — East', default: 'Plot no-164/856' },
      { key: 'boundaryMouzaWest', label: 'Mouza Map — West', default: 'Plot no-167' },
      { key: 'boundaryActualNorth', label: 'Actual Site — North', default: "Other's building" },
      { key: 'boundaryActualSouth', label: 'Actual Site — South', default: '15 feet wide Road' },
      { key: 'boundaryActualEast', label: 'Actual Site — East', default: "Other's vacant land" },
      { key: 'boundaryActualWest', label: 'Actual Site — West', default: "Other's vacant land" },
      { key: 'boundariesMatching', label: 'Boundaries Matching Status', default: 'Yes (Boundary matching as per sketch map)' },
    ],

    // -- Section 9: Remarks & Visited Engineer --
    'section-9': [
      { key: 'engineerVisitedName', label: 'Name of the Engineer Visited', default: 'Mr. Kundan Singh' },
    ],
  },
  defaultValues: {
    purpose: 'Mortgage Loan Against Property (MLAP)',
    branchName: 'MLAP',
  },

  // -- Custom PDF Generator matching Excel structure 1:1 --
  generateCustomPDF: async (fields, letterheadBytes, imageResults, fmtDate) => {
    const r = new PDFAdityaBirlaMLAPRenderer();
    await r.init(letterheadBytes || undefined);

    const W_LABEL_2COL = 150;
    const W_VAL_2COL = 373.28;
    const W_LABEL_4COL = 120;
    const W_VAL_4COL = 141.64;

    // -- 1. Main Header --
    r.drawMainHeader('Aditya Birla Capital Ltd (MLAP)');

    // -- 2. Basic Details --
    r.drawSectionHeader('Basic Details');
    r.drawKeyValueRow([
      { label: 'Client Name', value: fields.ownerName || fields.clientName || 'N/A', labelWidth: W_LABEL_4COL, valueWidth: W_VAL_4COL },
      { label: 'Initiation Date', value: fmtDate(fields.initiationDate || fields.dateOfInspection), labelWidth: W_LABEL_4COL, valueWidth: W_VAL_4COL },
    ]);
    r.drawKeyValueRow([
      { label: 'Valuer Name', value: fields.valuerName || 'Er. Satyajit Mohanty', labelWidth: W_LABEL_4COL, valueWidth: W_VAL_4COL },
      { label: 'Visit Date', value: fmtDate(fields.dateOfInspection), labelWidth: W_LABEL_4COL, valueWidth: W_VAL_4COL },
    ]);
    r.drawKeyValueRow([
      { label: 'Application No.', value: fields.loanApplicationNo || fields.caseReferenceNumber || 'N/A', labelWidth: W_LABEL_4COL, valueWidth: W_VAL_4COL },
      { label: 'Report Date', value: fmtDate(fields.dateOfValuation), labelWidth: W_LABEL_4COL, valueWidth: W_VAL_4COL },
    ]);
    r.drawKeyValueRow([
      { label: 'Name of Property Owner', value: fields.propertyOwnerName || fields.ownerName || 'N/A', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL },
    ]);

    // -- 3. Location Details --
    r.drawSectionHeader('Location Details');
    r.drawKeyValueRow([{ label: 'Address as per Document', value: fields.propertyAddressAsDocs || fields.ownerAddress || 'N/A', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL }]);
    r.drawKeyValueRow([{ label: 'Address as per Physical', value: fields.propertyAddressAsVisit || fields.ownerAddress || 'N/A', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL }]);
    r.drawKeyValueRow([{ label: 'Address matching', value: fields.addressMatching || 'Yes (As per documents)', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL }]);
    r.drawKeyValueRow([{ label: 'Co-Ordinates', value: `Lat:-${fields.latitude || '21.636778'},Long:- ${fields.longitude || '85.628000'}`, labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL }]);

    r.drawKeyValueRow([
      { label: 'Main Locality', value: fields.mainLocality || fields.city || 'N/A', labelWidth: W_LABEL_4COL, valueWidth: W_VAL_4COL },
      { label: 'Sub Locality', value: fields.subLocality || 'N/A', labelWidth: W_LABEL_4COL, valueWidth: W_VAL_4COL },
    ]);
    r.drawKeyValueRow([
      { label: 'Locality Type', value: fields.localityType || fields.propertyType || 'Residential', labelWidth: W_LABEL_4COL, valueWidth: W_VAL_4COL },
      { label: 'Landmark', value: fields.landmark || 'N/A', labelWidth: W_LABEL_4COL, valueWidth: W_VAL_4COL },
    ]);
    r.drawKeyValueRow([
      { label: 'Occupancy of Locality', value: fields.localityOccupancy || 'Fully Occupied', labelWidth: W_LABEL_4COL, valueWidth: W_VAL_4COL, highlight: true },
      { label: 'Population Density', value: fields.populationDensity || 'Moderate', labelWidth: W_LABEL_4COL, valueWidth: W_VAL_4COL, highlight: true },
    ]);
    r.drawKeyValueRow([{ label: 'Distance from ABCL Branch', value: fields.distanceFromBranch || '2-Kms', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL }]);
    r.drawKeyValueRow([{ label: 'Distance from City Center', value: fields.distanceFromCityCenter || '2-Kms from market area', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL }]);
    r.drawKeyValueRow([{ label: 'Distance from Bus Stand', value: fields.distanceBusStop || '2-Km from Bus Stand', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL }]);
    r.drawKeyValueRow([{ label: 'Distance from Nearest Railway Station', value: fields.distanceRailwayStation || '4-Kms from Railway Station', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL }]);
    r.drawKeyValueRow([{ label: 'Availability of Amenities (school,market etc)', value: fields.amenitiesAvailability || '1-2 Kms', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL }]);
    r.drawKeyValueRow([{ label: 'Approach Road Width', value: fields.approachRoadWidth || '10 feet wide Road', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL }]);
    r.drawKeyValueRow([
      { label: 'Has the Valuator Done Valuation for this property before?', value: fields.valuedBefore || 'No', labelWidth: 260, valueWidth: 50 },
      { label: 'If Yes When?', value: fields.valuedBeforeDate || 'NA', labelWidth: 100, valueWidth: 113.28 },
    ]);
    r.drawKeyValueRow([{ label: 'Land Locked', value: fields.landLocked || 'No', labelWidth: 350, valueWidth: 173.28, highlight: true }]);
    r.drawKeyValueRow([{ label: 'Any other features like board of other financier indicating mortgage, notice of Court/any authority which may affect the title', value: fields.otherEncumbranceFeatures || 'No', labelWidth: 350, valueWidth: 173.28, highlight: true }]);

    // -- 4. Property Detailings --
    r.drawSectionHeader('Property Detailings');
    r.drawKeyValueRow([{ label: 'Occupancy', value: fields.occupiedBy || 'Vacant', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL, highlight: true }]);
    r.drawKeyValueRow([{ label: 'Occupied By', value: fields.occupantName || 'NA', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL }]);
    r.drawKeyValueRow([{ label: 'Relationship of Occupant with Client', value: fields.occupantRelation || 'NA', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL }]);
    r.drawKeyValueRow([{ label: 'Property Demarcation (yes/no)', value: fields.plotDemarcated || 'No', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL, highlight: true }]);
    r.drawKeyValueRow([{ label: 'Property Identification (yes/no)', value: fields.propertyIdentification || 'Yes', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL, highlight: true }]);
    r.drawKeyValueRow([{ label: 'Property Type', value: fields.propertyType || 'Residential', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL, highlight: true }]);
    r.drawKeyValueRow([{ label: 'Property Sub Type', value: fields.propertySubType || 'Single / Multi-units building - R', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL, highlight: true }]);
    r.drawKeyValueRow([{ label: 'Property Holding', value: fields.propertyHolding || 'Freehold', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL, highlight: true }]);
    r.drawKeyValueRow([{ label: 'Property situated in Limits', value: fields.propertyJurisdiction || 'Gram Panchayat', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL, highlight: true }]);
    r.drawKeyValueRow([{ label: 'Marketability', value: fields.marketability || 'Average', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL, highlight: true }]);
    r.drawKeyValueRow([{ label: 'Property Age', value: fields.ageOfPropertyActual || '0-Years', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL, highlight: true }]);
    r.drawKeyValueRow([{ label: 'Residual Age', value: fields.estimatedFutureLife || '60-Years', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL, highlight: true }]);
    r.drawKeyValueRow([{ label: 'Construction Quality', value: fields.qualityOfConstruction || 'Average', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL, highlight: true }]);
    r.drawKeyValueRow([{ label: 'Structure Type', value: fields.structureType || 'RCC', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL, highlight: true }]);
    r.drawKeyValueRow([
      { label: 'Dimensions of Property: Width (Facing Road Side) in feet', value: fields.dimensionWidth || 'NA', labelWidth: 260, valueWidth: 50, highlight: true },
      { label: 'Depth (in feet)', value: fields.dimensionDepth || 'NA', labelWidth: 100, valueWidth: 113.28, highlight: true },
    ]);
    r.drawKeyValueRow([{ label: 'Cautious Locations', value: fields.cautiousLocations || 'NA', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL, highlight: true }]);
    r.drawKeyValueRow([{ label: 'If Flat, Configuration Type', value: fields.flatConfigurationType || 'NA', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL, highlight: true }]);
    r.drawKeyValueRow([{ label: 'Percentage Completion of Property', value: fields.percentageCompletion || '65%', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL, highlight: true }]);
    r.drawKeyValueRow([{ label: 'Percentage Recommendation of Property', value: fields.percentageRecommendation || '70%', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL, highlight: true }]);

    // -- 5. Documentation --
    r.drawSectionHeader('Documentation');
    r.drawKeyValueRow([{ label: 'Documents Provided', value: fields.documentsProvided || 'Copy of Sale deed, ROR & Sketch map', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL }]);
    r.drawKeyValueRow([{ label: 'Sanction Plan details if provided', value: fields.sanctionPlanDetails || 'Plan is not provided', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL }]);
    r.drawKeyValueRow([{ label: 'Utility Bills (Water bill, electricity bill)', value: fields.utilityBills || 'NA', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL }]);

    // -- 6. Accommodation Details --
    r.drawSectionHeader('Accomodation Details');
    const accomCols = [80, 70, 70, 70, 70, 80, 83.28];
    r.drawTable(
      ['Unit Details', 'Drawing Room', 'Bedroom', 'Dining Room', 'Kitchen', 'Bathroom', 'Balcony'],
      [
        ['Ground Floor', fields.groundFloorDrawing || '', fields.groundFloorBed || '2', fields.groundFloorDining || '', fields.groundFloorKitchen || '1', fields.groundFloorBath || '', fields.groundFloorBalcony || ''],
        ['First Floor', fields.firstFloorDrawing || 'NA', fields.firstFloorBed || 'NA', fields.firstFloorDining || 'NA', fields.firstFloorKitchen || 'NA', fields.firstFloorBath || 'NA', fields.firstFloorBalcony || 'NA'],
        ['Second Floor', 'NA', 'NA', 'NA', 'NA', 'NA', 'NA'],
        ['Third Floor', 'NA', 'NA', 'NA', 'NA', 'NA', 'NA'],
        ['Forth Floor', 'NA', 'NA', 'NA', 'NA', 'NA', 'NA'],
      ],
      accomCols
    );

    // -- 7. Build Up Details --
    r.drawSectionHeader('Build Up Details');
    const buaCols = [110, 140, 140, 133.28];
    r.drawTable(
      ['Floor', 'As per site', 'As per Plan/Allowed', 'Percentage Deviation'],
      [
        ['Ground Floor', fields.buaGFSite || 'RCC-1441sqft', fields.buaGFPlan || 'NA', fields.buaGFDeviation || 'NA'],
        ['First Floor', fields.buaFFSite || 'NA', fields.buaFFPlan || 'NA', fields.buaFFDeviation || 'NA'],
        ['Second Floor', 'NA', 'NA', 'NA'],
        ['Third Floor', 'NA', 'NA', 'NA'],
      ],
      buaCols
    );

    // -- 8. Valuation --
    r.drawSectionHeader('Valuation');
    const valCols = [240, 95, 95, 93.28];
    const plotSqft = parseFloat(fields.plotAreaDocs || '2613') || 0;
    const landRate = parseFloat(fields.landRatePerSqft || '800') || 0;
    const landVal = plotSqft * landRate;

    const buaSqft = parseFloat(fields.buaActual || '1441') || 0;
    const bua100Rate = parseFloat(fields.buaRate100Pct || '1500') || 0;
    const bua100Val = buaSqft * bua100Rate;

    const buaConsRate = parseFloat(fields.buaRateConsidered || '975') || 0;
    const buaConsVal = buaSqft * buaConsRate;

    const totalVal = landVal + buaConsVal;
    const realVal = totalVal * 0.9;
    const distVal = totalVal * 0.8;

    r.drawTable(
      ['Detailings', 'Area in Sqft', 'Rate/sqft', 'Value'],
      [
        ['Plot Area (As per Documents)', String(plotSqft), String(landRate), `Rs. ${formatIndianCurrency(landVal)}`],
        ['Plot Area (As per Physical)', fields.plotAreaPhysical || String(plotSqft), '-', '-'],
        ['Plot Area (Considered For Valuation)', fields.plotAreaConsidered || String(plotSqft), '-', '-'],
        ['Build Up Area (As per Plan/Document)', fields.buaPlan || 'Plan is not provided', '-', '-'],
        ['Build Up Area (As per Actual) GF RCC on 100% comp', String(buaSqft), String(bua100Rate), `Rs. ${formatIndianCurrency(bua100Val)}`],
        ['Build Up Area (Considered for Valuation) as on date', String(buaSqft), String(buaConsRate), `Rs. ${formatIndianCurrency(buaConsVal)}`],
        ['Super Build Up Area (In case of Composite)', fields.superBua || '-', '-', '-'],
        ['Amenities (like parking etc in unit or lumpsum value)', fields.amenitiesValue || '-', '-', '-'],
        ['Total Value', '', '', `Rs. ${formatIndianCurrency(totalVal)}`],
        ['Realizable Value(90%)', '', '', `Rs. ${formatIndianCurrency(realVal)}`],
        ['Distress Value(80%)', '', '', `Rs. ${formatIndianCurrency(distVal)}`],
      ],
      valCols,
      [3] // Highlight Value column
    );

    // -- 9. Boundary Details --
    r.drawSectionHeader('Boundary Details');
    const boundCols = [103.28, 105, 105, 105, 105];
    r.drawTable(
      ['Detailings', 'North', 'South', 'East', 'West'],
      [
        ['As per Sketch map', fields.boundarySketchNorth || 'Deepak Behera', fields.boundarySketchSouth || 'Road', fields.boundarySketchEast || 'Sonali Sethi', fields.boundarySketchWest || 'Archana Sethi'],
        ['As per Mouza Map', fields.boundaryMouzaNorth || 'Plot no-165', fields.boundaryMouzaSouth || 'Plot no-168', fields.boundaryMouzaEast || 'Plot no-164/856', fields.boundaryMouzaWest || 'Plot no-167'],
        ['As per actual', fields.boundaryActualNorth || "Other's building", fields.boundaryActualSouth || '15 feet wide Road', fields.boundaryActualEast || "Other's vacant land", fields.boundaryActualWest || "Other's vacant land"],
      ],
      boundCols
    );
    r.drawKeyValueRow([{ label: 'Boundaries Matching', value: fields.boundariesMatching || 'Yes (Boundary matching as per sketch map)', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL }]);

    // -- 10. Remarks --
    r.drawRemarksBox(
      'Remarks',
      fields.remarks ||
        'Subject property is a single storied under construction building having land extent of 2613sqft, having measured BUA 1441sqft. This Property is accessible with 15-feet wide road. All civic amenities are present within 1-2 Kms from the property. Surrounding habitation is 50%. The property is coming under Mandua GP limit. At present, GF RCC roof slab completed & stages of construction is about 65%. Valuation has been done for land & measured BUA of single storied under construction building. Note-This land is not converted to homestead & present nature in agri. Customer has submitted homestead conversion receipt vide OLR Case no- 81/2025, dated-05/02/2025. Boundary details are not mentioned in sale deed. Customer has submitted Amin sketch map for the identification & access road. Report is released basing upon the sketch map. Bank to check the authenticity of the sketch map.'
    );
    r.drawKeyValueRow([{ label: 'Name of the Engineer Visited', value: fields.engineerVisitedName || 'Mr. Kundan Singh', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL }]);

    // -- 11. Location Map --
    let imgIdx = (fields.propertyImages || []).length;
    const sketchBytesList = fields.sketchMapImages?.length ? imageResults.slice(imgIdx, imgIdx + fields.sketchMapImages.length) : null;
    if (fields.sketchMapImages?.length) imgIdx += fields.sketchMapImages.length;
    const locationBytes = fields.locationMapImage ? imageResults[imgIdx++] : null;

    if (locationBytes) {
      r.checkPageBreak(300);
      r.drawSectionHeader('Location Map');
      await r.drawImageSection(locationBytes, `Latitude: -${fields.latitude || '21.636778'}, Longitude: ${fields.longitude || '85.628000'}`);
    }

    // -- 12. Photographs Grid --
    const propertyImgs = fields.propertyImages || [];
    if (propertyImgs.length > 0) {
      const photos = propertyImgs.map((imgUrl: string, idx: number) => ({
        bytes: imageResults[idx],
        label: fields.propertyImageNames?.[idx] || (idx === 0 ? 'Approach Road Pic' : idx === 1 ? 'External Pic' : idx === 2 ? 'Internal Pic' : idx === 3 ? 'Selfie with Client / Customer Representative' : `Photo ${idx + 1}`),
      })).filter((p: any) => p.bytes && p.bytes.length > 0);

      await r.drawPhotoGrid(photos);
    }

    // -- 13. Sketch / Mouza Maps --
    if (sketchBytesList && sketchBytesList.length > 0) {
      for (let i = 0; i < sketchBytesList.length; i++) {
        if (sketchBytesList[i]) {
          r.checkPageBreak(300);
          r.drawSectionHeader(i === 0 ? 'MOUZA MAP / CADASTRAL MAP' : `MAP / PLAN ${i + 1}`);
          await r.drawImageSection(sketchBytesList[i], `Map Document ${i + 1}`);
        }
      }
    }

    return await r.save();
  },
};

export default function AdityaBirlaCapitalMLAP(props: BankReportBuilderProps) {
  return <BankReportBuilder config={ADITYA_BIRLA_CAPITAL_MLAP_CONFIG} {...props} />;
}
