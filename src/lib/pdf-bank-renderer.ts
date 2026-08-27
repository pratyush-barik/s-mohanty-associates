/**
 * pdf-bank-renderer.ts — Base PDF renderer for all Bank/FIS valuation reports.
 *
 * Extends PDFGeneralRenderer to inherit the full 14-section rendering logic,
 * table layouts, and drawing primitives. Specific bank renderers (e.g. PDFABCapitalSTSLRenderer)
 * can subclass PDFBankRenderer and override individual sections or tables.
 */

import { PDFGeneralRenderer } from './pdf-general-renderer';

export class PDFBankRenderer extends PDFGeneralRenderer {
  // Inherits all methods from PDFGeneralRenderer:
  // - init(letterheadBytes)
  // - drawTextBlock, drawRichTextBlock, drawCenteredTitle
  // - drawSectionHeader, drawSimpleRow, drawOptionRow, drawProximityRow, drawAgeOptionRow
  // - drawFloorTable, drawAbstractTable, drawRemarksBlock
  // - drawPhotographs, drawSketchMaps, drawLocationMap
  // - drawExcelAnnexureTable
  // - toBlob()
  //
  // Subclasses can override any section drawing methods to match bank-specific layouts.
}

export default PDFBankRenderer;
