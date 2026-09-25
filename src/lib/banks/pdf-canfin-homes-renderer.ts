import { PDFBankRenderer } from '../pdf-bank-renderer';

export class PDFCanFinHomesRenderer extends PDFBankRenderer {
  private fields: any;
  private projectCode: string;

  constructor(fields?: any, projectCode?: string) {
    super();
    this.fields = fields || {};
    this.projectCode = projectCode || '';
  }

  // Inherits default rendering logic from PDFBankRenderer.
  // We can override specific sections here if needed in the future.
}
