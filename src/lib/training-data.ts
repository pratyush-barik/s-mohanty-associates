/**
 * Training Data Collector — Auto-append project report data to train_model.csv
 * 
 * When a project is finalized (COMPLETED), this module appends one row
 * to a SINGLE persistent CSV file in Supabase Storage. The CSV accumulates
 * entries over time and is used for future ML model training.
 * 
 * Storage: valuation-documents/ml-training/train_model.csv
 * 
 * This does NOT create a CSV per project. Every project adds exactly
 * one row to the same file.
 */

import { supabaseAdmin, STORAGE_BUCKETS } from '@/lib/supabase';

// ─── CSV path in Supabase Storage ────────────────────────────────
const CSV_STORAGE_PATH = 'ml-training/train_model.csv';
const BUCKET = STORAGE_BUCKETS.VALUATION_DOCUMENTS;

// ─── All 97 column headers (must match ML_integration/README.md) ─
const HEADERS = [
  // Section 0 — Project Metadata (7)
  'project_id', 'project_code', 'client_type', 'service_type',
  'subject_type', 'valuation_layout', 'completed_at',

  // Section 1 — General Details (12)
  'to_recipient', 'date_of_valuation', 'ref_no', 'property_type',
  'customer_name', 'address_line_1', 'state', 'pincode', 'landmark',
  'loan_application_no', 'document_holder_name', 'date_of_inspection',

  // Section 2 — Surrounding Locality (18)
  'ward_no', 'vicinity', 'locality_class', 'approach_road_width',
  'plot_demarcated', 'distance_railway_km', 'distance_bus_km',
  'distance_hospital_km', 'railway_station_name', 'bus_stop_name',
  'hospital_name', 'property_identification', 'identification_remarks',
  'proximity_to_facilities', 'landmark_railway', 'landmark_bus',
  'landmark_hospital', 'landmark_nearest',

  // Section 3 — Property Details (3)
  'usage_type', 'additional_amenities', 'legal_status',

  // Section 4 — Subject Property (13)
  'premises_type', 'occupied_by', 'is_rented', 'rented_occupants',
  'property_taxation',
  'boundary_sketch_north', 'boundary_sketch_east',
  'boundary_sketch_south', 'boundary_sketch_west',
  'boundary_site_north', 'boundary_site_east',
  'boundary_site_south', 'boundary_site_west',

  // Section 5 — Structural Details (19)
  'structure_type', 'num_floors', 'num_wings', 'units_per_floor',
  'internal_composition', 'num_lifts', 'age_of_property',
  'age_of_property_actual', 'estimated_future_life', 'exteriors',
  'quality_of_construction', 'maintenance_condition',
  'common_areas_remarks', 'other_observations', 'flooring_type',
  'roof_type', 'quality_of_fixtures', 'foundation', 'superstructure',

  // Section 6 — Plan Approvals (6)
  'construction_approved', 'approval_details', 'construction_permission',
  'violations_observed', 'conforms_to_byelaws', 'documents_verified',

  // Section 7 — Building Valuation (3 aggregated)
  'floor_count', 'floor_area_unit', 'total_building_value',

  // Section 8 — Land Valuation (5)
  'land_area', 'land_area_unit', 'govt_land_rate',
  'land_rate_per_unit', 'recommended_rate_basis',

  // Section 9 — Abstract (7)
  'realizable_pct', 'distress_pct', 'marketability',
  'valuation_result', 'replacement_cost', 'deviations', 'guideline_value',

  // Section 10 — Remarks (4)
  'demarcation', 'possession', 'remarks', 'representative_name',
];

// ─── CSV escape helper ──────────────────────────────────────────
function csvEscape(val: any): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// ─── Build one CSV row from project + report data ───────────────
function buildRow(
  projectId: string,
  projectCode: string,
  reportData: any,
  completedAt: Date
): string {
  const d = reportData || {};
  const floors = Array.isArray(d.floors) ? d.floors : [];

  // Calculate total building value from floor rows
  const totalBuildingValue = floors.reduce((sum: number, f: any) => {
    return sum + (parseFloat(f.netValue) || 0);
  }, 0);

  const values = [
    // Section 0 — Metadata
    projectId, projectCode, d.clientType || '', d.serviceType || '',
    d.subjectType || '', d.valuationLayout || '', completedAt.toISOString(),

    // Section 1 — General Details
    d.to || '', d.dateOfValuation || '', d.refNo || '', d.propertyType || '',
    d.ownerName || '', d.ownerAddress || '', d.city || '', d.pincode || '',
    d.landmark || '', d.loanApplicationNo || '', d.documentHolderName || '',
    d.dateOfInspection || '',

    // Section 2 — Surrounding Locality
    d.wardNo || '', d.vicinity || '', d.classOfLocality || '',
    d.approachRoadWidth || '', d.plotDemarcated || '',
    d.distanceRailwayStation || '', d.distanceBusStop || '',
    d.distanceHospital || '', d.railwayStationName || '',
    d.busStopName || '', d.hospitalName || '',
    d.propertyIdentification || '', d.propertyIdentificationRemarks || '',
    d.proximityToFacilities || '', d.landmarkRailway || '',
    d.landmarkBusStop || '', d.landmarkHospital || '',
    d.landmarkNearest || '',

    // Section 3 — Property Details
    d.usageType || '', d.additionalAmenities || '', d.legalStatus || '',

    // Section 4 — Subject Property
    d.premisesType || '', d.occupiedBy || '', d.isPropertyRented || '',
    d.rentedOccupants || '', d.propertyTaxation || '',
    d.boundaryNorth || '', d.boundaryEast || '',
    d.boundarySouth || '', d.boundaryWest || '',
    d.buildingBoundaryNorth || '', d.buildingBoundaryEast || '',
    d.buildingBoundarySouth || '', d.buildingBoundaryWest || '',

    // Section 5 — Structural Details
    d.structureType || '', d.numberOfFloors || '', d.numberOfWings || '',
    d.unitsPerFloor || '', d.internalComposition || '',
    d.numberOfLifts || '', d.ageOfProperty || '',
    d.ageOfPropertyActual || '', d.estimatedFutureLife || '',
    d.exteriors || '', d.qualityOfConstruction || '',
    d.maintenanceCondition || '', d.commonAreasRemarks || '',
    d.otherObservations || '', d.flooringType || '', d.roofType || '',
    d.qualityOfFixtures || '', d.foundation || '', d.superstructure || '',

    // Section 6 — Plan Approvals
    d.constructionApproved || '', d.approvalDetails || '',
    d.constructionPermission || '', d.violationsObserved || '',
    d.conformsToByelaws || '', d.documentsVerified || '',

    // Section 7 — Building Valuation (aggregated)
    floors.length, d.floorAreaUnit || '',
    totalBuildingValue > 0 ? totalBuildingValue : '',

    // Section 8 — Land Valuation
    d.landArea || '', d.landAreaUnit || '', d.govtLandRate || '',
    d.landRatePerUnit || '', d.recommendedRateBasis || '',

    // Section 9 — Abstract
    d.realizablePct || '', d.distressPct || '', d.marketability || '',
    d.valuationResult || '', d.replacementCost || '',
    d.deviations || '', d.guidelineValue || '',

    // Section 10 — Remarks
    d.demarcation || '', d.possession || '', d.remarks || '',
    d.representativeName || '',
  ];

  return values.map(csvEscape).join(',');
}

// ─── Main: Append one row to train_model.csv in Supabase ────────

/**
 * Appends a single completed project's report data as one row
 * to the persistent `train_model.csv` in Supabase Storage.
 * 
 * If the file doesn't exist yet, it creates it with headers.
 * If the project is already in the CSV (duplicate check by project_id), it skips.
 * 
 * This is fire-and-forget — errors are logged but never block finalization.
 */
export async function appendTrainingData(
  projectId: string,
  projectCode: string,
  reportData: any,
  completedAt: Date
): Promise<void> {
  try {
    let existingCsv = '';

    // 1. Try to download the existing CSV
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .download(CSV_STORAGE_PATH);

    if (fileData && !downloadError) {
      existingCsv = await fileData.text();
    }

    // 2. If file doesn't exist or is empty, start with headers
    const hasHeaders = existingCsv.trim().length > 0;
    if (!hasHeaders) {
      existingCsv = HEADERS.join(',') + '\n';
    }

    // 3. Duplicate check — skip if this project_id already exists
    if (existingCsv.includes(projectId)) {
      console.log(`[TRAINING-DATA] Project ${projectCode} already in train_model.csv — skipping.`);
      return;
    }

    // 4. Build the new row and append
    const newRow = buildRow(projectId, projectCode, reportData, completedAt);
    const updatedCsv = existingCsv.trimEnd() + '\n' + newRow + '\n';

    // 5. Upload (overwrite) the CSV back to Supabase
    const csvBuffer = new Blob([updatedCsv], { type: 'text/csv' });

    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(CSV_STORAGE_PATH, csvBuffer, {
        contentType: 'text/csv',
        upsert: true, // Overwrite existing file
      });

    if (uploadError) {
      console.error(`[TRAINING-DATA] Failed to upload train_model.csv:`, uploadError);
      return;
    }

    // Count rows (excluding header)
    const rowCount = updatedCsv.trim().split('\n').length - 1;
    console.log(`[TRAINING-DATA] ✅ Appended ${projectCode} to train_model.csv (total rows: ${rowCount})`);

  } catch (err) {
    // Fire-and-forget: never block the finalization flow
    console.error(`[TRAINING-DATA] Error appending data for ${projectCode}:`, err);
  }
}
