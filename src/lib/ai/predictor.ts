/**
 * AI Valuation Predictor — Order-Independent Heuristic Engine
 * 
 * Analyzes whichever fields are already filled (in any section, any order)
 * and predicts values for all remaining empty fields using a dependency graph.
 * 
 * Phase 1: Rule-based heuristics
 * Phase 2 (future): Replace with trained CatBoost/XGBoost model
 */

// ─── Types ──────────────────────────────────────────────────────

export interface Suggestion {
  value: string;
  confidence: number;      // 0.0 – 1.0
  source: 'heuristic' | 'ml' | 'llm' | 'calculated';
  label: string;           // Human-readable field label
  section: number;         // Which section this field belongs to
  fieldKey: string;        // The ReportFields key
}

export interface PredictionInput {
  [key: string]: any;
}

export interface PredictionResult {
  suggestions: Record<string, Suggestion>;
  filledCount: number;
  totalFields: number;
  overallConfidence: number;
}

// ─── Field Metadata ─────────────────────────────────────────────

interface FieldMeta {
  key: string;
  label: string;
  section: number;
  isDefault?: (val: any) => boolean; // Check if value is a default/empty
}

/** All predictable fields with their metadata */
const PREDICTABLE_FIELDS: FieldMeta[] = [
  // Section 5
  { key: 'estimatedFutureLife', label: 'Estimated Future Life', section: 5 },
  { key: 'qualityOfConstruction', label: 'Quality of Construction', section: 5 },
  
  // Section 7 (floor-level — handled specially)
  // rate, lifeYears, depreciationPct are per-floor
  
  // Section 8
  { key: 'govtLandRate', label: 'Govt. Approved Rate', section: 8 },
  { key: 'landRatePerUnit', label: 'Recommended Land Rate', section: 8 },
  { key: 'recommendedRateBasis', label: 'Basis for Recommendation', section: 8 },
  
  // Section 9
  { key: 'realizablePct', label: 'Realizable Value %', section: 9 },
  { key: 'distressPct', label: 'Distress/Forced Sale %', section: 9 },
  { key: 'marketability', label: 'Marketability', section: 9 },
  { key: 'replacementCost', label: 'Replacement Cost', section: 9 },
];

// ─── All trackable fields for filled/total count ────────────────

const ALL_FIELD_KEYS = [
  // Section 1
  'propertyType', 'ownerName', 'ownerAddress', 'city', 'pincode', 'landmark',
  'loanApplicationNo', 'documentHolderName', 'dateOfInspection', 'dateOfValuation',
  'bankName', 'branchName', 'to',
  // Section 2
  'wardNo', 'vicinity', 'classOfLocality', 'approachRoadWidth', 'plotDemarcated',
  'distanceRailwayStation', 'distanceBusStop', 'distanceHospital',
  'propertyIdentification', 'proximityToFacilities',
  // Section 3
  'usageType', 'additionalAmenities', 'legalStatus',
  // Section 4
  'premisesType', 'occupiedBy', 'isPropertyRented', 'propertyTaxation',
  'boundaryNorth', 'boundarySouth', 'boundaryEast', 'boundaryWest',
  // Section 5
  'structureType', 'numberOfFloors', 'numberOfWings', 'unitsPerFloor',
  'internalComposition', 'numberOfLifts', 'ageOfProperty', 'ageOfPropertyActual',
  'estimatedFutureLife', 'exteriors', 'qualityOfConstruction',
  'flooringType', 'roofType', 'qualityOfFixtures',
  // Section 6
  'constructionApproved', 'approvalDetails', 'constructionPermission',
  'violationsObserved', 'conformsToByelaws', 'documentsVerified',
  // Section 8
  'landArea', 'landAreaUnit', 'govtLandRate', 'landRatePerUnit',
  'recommendedRateBasis', 'buaAsPerApprovals',
  // Section 9
  'marketability', 'valuationResult', 'realizablePct', 'distressPct',
  'replacementCost', 'deviations', 'guidelineValue',
  // Section 10
  'demarcation', 'possession', 'remarks', 'representativeName',
];

// ─── Helpers ────────────────────────────────────────────────────

function isFilled(val: any): boolean {
  if (val === null || val === undefined) return false;
  if (typeof val === 'string') return val.trim().length > 0;
  if (Array.isArray(val)) return val.length > 0;
  return true;
}

function getVal(fields: PredictionInput, key: string): string {
  const v = fields[key];
  return typeof v === 'string' ? v.trim() : '';
}

// ─── Structure Life Expectancy Heuristics ───────────────────────

const STRUCTURE_LIFE: Record<string, number> = {
  'RCC': 60,
  'Load Bearing': 50,
  'Steel Structure': 55,
  'Composite Structure': 55,
  'Industrial Shed': 40,
  'A/C Sheet': 30,
  'G/I Sheet': 25,
  'Asbestos Roofing': 25,
};

// ─── Locality-based Rate Ranges (₹/Sqft heuristics) ────────────

const LOCALITY_RATE_RANGES: Record<string, { min: number; mid: number; max: number }> = {
  'Elite': { min: 800, mid: 1200, max: 2000 },
  'Posh': { min: 600, mid: 900, max: 1500 },
  'High Class': { min: 450, mid: 700, max: 1100 },
  'Upper Middle Class': { min: 300, mid: 500, max: 800 },
  'Middle Class': { min: 200, mid: 350, max: 550 },
  'Lower Middle Class': { min: 100, mid: 200, max: 350 },
};

const LOCALITY_MARKETABILITY: Record<string, string> = {
  'Elite': 'Excellent',
  'Posh': 'Excellent',
  'High Class': 'Very Good',
  'Upper Middle Class': 'Very Good',
  'Middle Class': 'Good',
  'Lower Middle Class': 'Good',
};

// ─── Prediction Rules (Dependency Graph) ────────────────────────

type PredictionRule = {
  fieldKey: string;
  label: string;
  section: number;
  requires: string[];  // Input field keys needed
  predict: (fields: PredictionInput) => { value: string; confidence: number; source: Suggestion['source'] } | null;
};

const PREDICTION_RULES: PredictionRule[] = [
  // ── Estimated Future Life ──
  {
    fieldKey: 'estimatedFutureLife',
    label: 'Estimated Future Life',
    section: 5,
    requires: ['structureType'],
    predict: (fields) => {
      const structType = getVal(fields, 'structureType');
      const totalLife = STRUCTURE_LIFE[structType];
      if (!totalLife) return null;

      const ageActual = getVal(fields, 'ageOfPropertyActual');
      const ageRange = getVal(fields, 'ageOfProperty');
      
      let ageYears = 0;
      if (ageActual) {
        ageYears = parseInt(ageActual) || 0;
      } else if (ageRange) {
        // Parse range like "1-10 years" → mid-point
        const match = ageRange.match(/(\d+)-(\d+)/);
        if (match) ageYears = Math.round((parseInt(match[1]) + parseInt(match[2])) / 2);
        else if (ageRange.includes('>50')) ageYears = 55;
      }

      const futureLife = Math.max(totalLife - ageYears, 5);
      const confidence = ageYears > 0 ? 0.85 : 0.6;
      
      return { value: `${futureLife} Years`, confidence, source: 'heuristic' };
    },
  },

  // ── Quality of Construction ──
  {
    fieldKey: 'qualityOfConstruction',
    label: 'Quality of Construction',
    section: 5,
    requires: ['structureType'],
    predict: (fields) => {
      const structType = getVal(fields, 'structureType');
      const locality = getVal(fields, 'classOfLocality');
      const ageActual = getVal(fields, 'ageOfPropertyActual');
      const age = parseInt(ageActual) || 0;

      // RCC in posh area with low age → Very Good
      if (structType === 'RCC' && ['Elite', 'Posh', 'High Class'].includes(locality) && age < 15) {
        return { value: 'Very Good', confidence: 0.7, source: 'heuristic' };
      }
      if (structType === 'RCC' && age < 25) {
        return { value: 'Good', confidence: 0.65, source: 'heuristic' };
      }
      if (['A/C Sheet', 'G/I Sheet', 'Asbestos Roofing'].includes(structType)) {
        return { value: 'Average', confidence: 0.6, source: 'heuristic' };
      }
      return { value: 'Good', confidence: 0.5, source: 'heuristic' };
    },
  },

  // ── Govt. Land Rate ──
  {
    fieldKey: 'govtLandRate',
    label: 'Govt. Approved Rate',
    section: 8,
    requires: ['classOfLocality'],
    predict: (fields) => {
      const locality = getVal(fields, 'classOfLocality');
      const range = LOCALITY_RATE_RANGES[locality];
      if (!range) return null;

      // Govt rate is typically lower than market
      const govtRate = Math.round(range.min * 0.6);
      return { value: `${govtRate}`, confidence: 0.45, source: 'heuristic' };
    },
  },

  // ── Recommended Land Rate ──
  {
    fieldKey: 'landRatePerUnit',
    label: 'Recommended Land Rate (₹)',
    section: 8,
    requires: ['classOfLocality'],
    predict: (fields) => {
      // TODO (Future): Update this logic to calculate Recommended Rate dynamically 
      // based on Govt Rate and Land Area instead of relying solely on Locality ranges.
      const locality = getVal(fields, 'classOfLocality');
      const vicinity = getVal(fields, 'vicinity');
      const range = LOCALITY_RATE_RANGES[locality];
      if (!range) return null;

      let rate = range.mid;
      // Adjust for vicinity
      if (vicinity === 'residential') rate = Math.round(rate * 0.95);
      if (vicinity === 'commercial') rate = Math.round(rate * 1.3);
      if (vicinity === 'mix') rate = Math.round(rate * 1.1);

      return { value: `${rate}`, confidence: 0.5, source: 'heuristic' };
    },
  },

  // ── Basis for Recommendation ──
  {
    fieldKey: 'recommendedRateBasis',
    label: 'Basis for Recommendation',
    section: 8,
    requires: ['classOfLocality'],
    predict: () => {
      // TODO (Future): Pipe this specific field into the LLM (provider.ts) 
      // so the AI generates a customized explanation for every property.
      return { value: 'As per local feedback, market survey, and prevailing rates in the area', confidence: 0.75, source: 'heuristic' };
    },
  },

  // ── Realizable % ──
  {
    fieldKey: 'realizablePct',
    label: 'Realizable Value %',
    section: 9,
    requires: [],  // Can always provide a default
    predict: (fields) => {
      const locality = getVal(fields, 'classOfLocality');
      const marketability = getVal(fields, 'marketability');

      if (marketability === 'Excellent' || ['Elite', 'Posh'].includes(locality)) {
        return { value: '92', confidence: 0.7, source: 'heuristic' };
      }
      if (marketability === 'Very Good' || ['High Class', 'Upper Middle Class'].includes(locality)) {
        return { value: '90', confidence: 0.7, source: 'heuristic' };
      }
      if (marketability === 'Difficult') {
        return { value: '80', confidence: 0.65, source: 'heuristic' };
      }
      return { value: '85', confidence: 0.6, source: 'heuristic' };
    },
  },

  // ── Distress % ──
  {
    fieldKey: 'distressPct',
    label: 'Distress/Forced Sale %',
    section: 9,
    requires: [],
    predict: (fields) => {
      const realizablePct = getVal(fields, 'realizablePct');
      if (realizablePct) {
        const rPct = parseInt(realizablePct) || 85;
        const dPct = Math.max(rPct - 10, 65);
        return { value: `${dPct}`, confidence: 0.75, source: 'calculated' };
      }

      const locality = getVal(fields, 'classOfLocality');
      if (['Elite', 'Posh'].includes(locality)) return { value: '82', confidence: 0.6, source: 'heuristic' };
      if (['High Class', 'Upper Middle Class'].includes(locality)) return { value: '80', confidence: 0.6, source: 'heuristic' };
      return { value: '75', confidence: 0.55, source: 'heuristic' };
    },
  },

  // ── Marketability ──
  {
    fieldKey: 'marketability',
    label: 'Marketability',
    section: 9,
    requires: ['classOfLocality'],
    predict: (fields) => {
      const locality = getVal(fields, 'classOfLocality');
      const roadWidth = getVal(fields, 'approachRoadWidth');
      
      let marketability = LOCALITY_MARKETABILITY[locality] || 'Good';

      // Narrow road → downgrade
      if (roadWidth === '40-20 Feet Road' && marketability === 'Excellent') {
        marketability = 'Very Good';
      }

      return { value: marketability, confidence: 0.65, source: 'heuristic' };
    },
  },

  // ── Replacement Cost ──
  {
    fieldKey: 'replacementCost',
    label: 'Replacement Cost (₹)',
    section: 9,
    requires: ['floors'],
    predict: (fields) => {
      const floors = fields.floors;
      if (!Array.isArray(floors) || floors.length === 0) return null;

      let totalEstimated = 0;
      for (const f of floors) {
        const area = parseFloat(f.area) || 0;
        const rate = parseFloat(f.rate) || 0;
        totalEstimated += area * rate;
      }

      if (totalEstimated === 0) return null;
      return { value: `${Math.round(totalEstimated)}`, confidence: 0.8, source: 'calculated' };
    },
  },
];

// ─── Floor-level Prediction Rules ───────────────────────────────

export function predictFloorFields(
  fields: PredictionInput,
  floor: { id: string; name: string; area: string; rate: string; lifeYears: string; ageYears: string; depreciationPct: string }
): Record<string, Suggestion> {
  const suggestions: Record<string, Suggestion> = {};
  const structType = getVal(fields, 'structureType');
  const locality = getVal(fields, 'classOfLocality');

  // Life Years
  if (!isFilled(floor.lifeYears) && structType) {
    const life = STRUCTURE_LIFE[structType];
    if (life) {
      suggestions[`floor_${floor.id}_lifeYears`] = {
        value: `${life}`,
        confidence: 0.8,
        source: 'heuristic',
        label: `${floor.name || 'Floor'} — Life (Yr)`,
        section: 7,
        fieldKey: `floor_${floor.id}_lifeYears`,
      };
    }
  }

  // Depreciation %
  if (!isFilled(floor.depreciationPct) && isFilled(floor.lifeYears) && isFilled(floor.ageYears)) {
    const life = parseFloat(floor.lifeYears) || 0;
    const age = parseFloat(floor.ageYears) || 0;
    if (life > 0) {
      const dep = Math.round((age / life) * 100 * 100) / 100;
      suggestions[`floor_${floor.id}_depreciationPct`] = {
        value: `${Math.min(dep, 90)}`,
        confidence: 0.9,
        source: 'calculated',
        label: `${floor.name || 'Floor'} — Depreciation %`,
        section: 7,
        fieldKey: `floor_${floor.id}_depreciationPct`,
      };
    }
  }

  // Rate (₹/unit)
  if (!isFilled(floor.rate) && locality) {
    const range = LOCALITY_RATE_RANGES[locality];
    if (range) {
      let rate = range.mid;
      const vicinity = getVal(fields, 'vicinity');
      if (vicinity === 'commercial') rate = Math.round(rate * 1.2);
      if (vicinity === 'slum') rate = Math.round(rate * 0.5);

      suggestions[`floor_${floor.id}_rate`] = {
        value: `${rate}`,
        confidence: 0.45,
        source: 'heuristic',
        label: `${floor.name || 'Floor'} — Rate (₹)`,
        section: 7,
        fieldKey: `floor_${floor.id}_rate`,
      };
    }
  }

  return suggestions;
}

// ─── Main Prediction Function ───────────────────────────────────

export function predictValuationFields(fields: PredictionInput): PredictionResult {
  const suggestions: Record<string, Suggestion> = {};

  // Count filled vs total fields
  let filledCount = 0;
  for (const key of ALL_FIELD_KEYS) {
    if (isFilled(fields[key])) filledCount++;
  }

  // Run each prediction rule
  for (const rule of PREDICTION_RULES) {
    // Skip if field is already filled
    if (isFilled(fields[rule.fieldKey])) continue;

    // Check if required inputs are available
    const hasRequirements = rule.requires.every((reqKey) => {
      if (reqKey === 'floors') return Array.isArray(fields.floors) && fields.floors.length > 0;
      return isFilled(fields[reqKey]);
    });

    if (!hasRequirements && rule.requires.length > 0) continue;

    // Run prediction
    const result = rule.predict(fields);
    if (result) {
      suggestions[rule.fieldKey] = {
        ...result,
        label: rule.label,
        section: rule.section,
        fieldKey: rule.fieldKey,
      };
    }
  }

  // Floor-level predictions
  if (Array.isArray(fields.floors)) {
    for (const floor of fields.floors) {
      const floorSuggestions = predictFloorFields(fields, floor);
      Object.assign(suggestions, floorSuggestions);
    }
  }

  // Calculate overall confidence
  const suggestionValues = Object.values(suggestions);
  const overallConfidence = suggestionValues.length > 0
    ? Math.round(suggestionValues.reduce((sum, s) => sum + s.confidence, 0) / suggestionValues.length * 100) / 100
    : 0;

  return {
    suggestions,
    filledCount,
    totalFields: ALL_FIELD_KEYS.length,
    overallConfidence,
  };
}
