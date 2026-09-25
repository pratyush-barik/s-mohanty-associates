import { PDFGeneralRenderer } from '../pdf-general-renderer';

export class PDFCanFinHomesRenderer extends PDFGeneralRenderer {
  // Use the existing base bank report draft ui and pdf render of it.
  // This class currently inherits the exact default layout of PDFGeneralRenderer.
}

export const generateCanFinHomesReport = async (
  data: any,
  projectCode: string = 'SMA-XXX',
  isReadOnly: boolean = false
) => {
  const renderer = new PDFCanFinHomesRenderer(data, projectCode, isReadOnly);
  return await renderer.generatePDF();
};
