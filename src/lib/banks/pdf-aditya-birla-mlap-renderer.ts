/**
 * PDFAdityaBirlaMLAPRenderer — Dedicated PDF renderer for Aditya Birla Capital Ltd (MLAP).
 * Extends PDFBankRenderer to inherit base margins, typography, transparent color palette,
 * Form XObject letterhead watermark, and key-value/table rendering primitives.
 */

import { PDFBankRenderer } from '../pdf-bank-renderer';

export interface MLAPReportFields {
  // Basic Details
  clientName?: string;
  ownerName?: string;
  initiationDate?: string;
  dateOfInspection?: string;
  dateOfValuation?: string;
  loanApplicationNo?: string;
  caseReferenceNumber?: string;
  propertyOwnerName?: string;

  // Location Details
  propertyAddressAsDocs?: string;
  propertyAddressAsVisit?: string;
  addressMatching?: string;
  latitude?: string;
  longitude?: string;
  mainLocality?: string;
  subLocality?: string;
  localityType?: string;
  landmark?: string;
  localityOccupancy?: string;
  populationDensity?: string;
  distanceFromBranch?: string;
  distanceFromCityCenter?: string;
  distanceBusStop?: string;
  distanceRailwayStation?: string;
  amenitiesAvailability?: string;
  approachRoadWidth?: string;
  valuedBefore?: string;
  valuedBeforeDate?: string;
  landLocked?: string;
  otherEncumbranceFeatures?: string;

  // Property Detailings
  occupiedBy?: string;
  occupantName?: string;
  occupantRelation?: string;
  plotDemarcated?: string;
  propertyIdentification?: string;
  propertyType?: string;
  propertySubType?: string;
  propertyHolding?: string;
  propertyJurisdiction?: string;
  marketability?: string;
  ageOfPropertyActual?: string;
  estimatedFutureLife?: string;
  qualityOfConstruction?: string;
  structureType?: string;
  dimensionWidth?: string;
  dimensionDepth?: string;
  cautiousLocations?: string;
  flatConfigurationType?: string;
  percentageCompletion?: string;
  percentageRecommendation?: string;

  // Documentation
  documentsProvided?: string;
  sanctionPlanDetails?: string;
  utilityBills?: string;

  // Accommodation Table
  accommodationRows?: {
    floor: string;
    drawingRoom: string;
    bedroom: string;
    diningRoom: string;
    kitchen: string;
    bathroom: string;
    balcony: string;
  }[];

  // Build Up Details Table
  buaRows?: {
    floor: string;
    asPerSite: string;
    asPerPlan: string;
    percentageDeviation: string;
  }[];

  // Valuation Table
  plotAreaDocs?: string;
  plotAreaPhysical?: string;
  plotAreaConsidered?: string;
  landRate?: string;
  landTotalValue?: string;
  buaPlan?: string;
  buaActual?: string;
  buaActualRate?: string;
  buaActualTotalValue?: string;
  buaConsidered?: string;
  buaConsideredRate?: string;
  buaConsideredTotalValue?: string;
  superBua?: string;
  amenitiesValue?: string;
  totalPropertyValuation?: string;
  realizableValue?: string;
  distressValue?: string;

  // Boundary Details Table
  boundarySketchNorth?: string;
  boundarySketchSouth?: string;
  boundarySketchEast?: string;
  boundarySketchWest?: string;
  boundaryMouzaNorth?: string;
  boundaryMouzaSouth?: string;
  boundaryMouzaEast?: string;
  boundaryMouzaWest?: string;
  boundaryActualNorth?: string;
  boundaryActualSouth?: string;
  boundaryActualEast?: string;
  boundaryActualWest?: string;
  boundariesMatching?: string;

  // Remarks & Signature
  remarks?: string;
  engineerVisitedName?: string;
  representativeName?: string;

  // Photos & Maps
  locationMapImage?: string;
  propertyImages?: string[];
  propertyImageNames?: string[];
  sketchMapImages?: string[];
  mouzaMapImage?: string;
  cadastralMapImage?: string;

  // Annexure
  annexureEnabled?: boolean;
  annexureRef?: string;
  annexureRefShowAlso?: boolean;
  legalAnnexureEnabled?: boolean;
  legalAnnexureRef?: string;
  legalAnnexureRefShowAlso?: boolean;
  annexures?: any[];

  [key: string]: any;
}

export class PDFAdityaBirlaMLAPRenderer extends PDFBankRenderer {
  // Inherits all core bank report methods from PDFBankRenderer:
  // - init(letterheadBytes)
  // - drawMainHeader(title)
  // - drawSectionHeader(title)
  // - drawKeyValueRow(cols)
  // - drawTable(headers, rows, colWidths, highlightedCols)
  // - drawRemarksBox(label, text)
  // - drawImageSection(imageBytes, caption, maxH)
  // - drawPhotoGrid(photos)
  // - toBlob()
}

export default PDFAdityaBirlaMLAPRenderer;
