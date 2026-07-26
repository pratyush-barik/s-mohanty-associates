import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60; // Allow up to 60 seconds for PDF generation

export async function POST(req: NextRequest) {
  try {
    const { html, pages } = await req.json();
    
    if (!pages || !Array.isArray(pages) || pages.length === 0) {
      return NextResponse.json({ error: 'No pages provided' }, { status: 400 });
    }

    // Dynamic imports for serverless compatibility
    const chromium = await import('@sparticuz/chromium');
    const puppeteer = await import('puppeteer-core');

    const browser = await puppeteer.default.launch({
      args: chromium.default.args,
      defaultViewport: { width: 816, height: 1056 },
      executablePath: await chromium.default.executablePath(),
      headless: true,
    });

    const page = await browser.newPage();

    // US Letter dimensions in inches
    const PAGE_W_IN = 8.5;
    const PAGE_H_IN = 11;
    // Margins in inches (matching the previous pixel values at 96dpi)
    const MARGIN_TOP = 112 / 96;    // ~1.167in
    const MARGIN_BOTTOM = 107 / 96; // ~1.115in
    const MARGIN_LR = 72 / 96;     // 0.75in

    // Build a complete HTML document with all pages
    // Each page is a separate section with page-break-after
    const letterheadUrl = `${req.nextUrl.origin}/templates/letterhead.png`;
    
    const fullHTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    @page {
      size: letter;
      margin: ${MARGIN_TOP}in ${MARGIN_LR}in ${MARGIN_BOTTOM}in ${MARGIN_LR}in;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Times New Roman', serif;
      color: #000;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page-section {
      page-break-after: always;
      position: relative;
    }
    .page-section:last-child {
      page-break-after: avoid;
    }
    /* Letterhead background on every page */
    @page {
      background-image: url('${letterheadUrl}');
      background-size: 100% 100%;
      background-repeat: no-repeat;
    }
  </style>
</head>
<body>
  ${pages.map((pageContent: string, i: number) => `
    <div class="page-section">${pageContent}</div>
  `).join('')}
</body>
</html>`;

    await page.setContent(fullHTML, { waitUntil: 'networkidle0', timeout: 30000 });

    // Generate PDF with Puppeteer's built-in PDF support
    const pdfBuffer = await page.pdf({
      format: 'Letter',
      printBackground: true,
      margin: {
        top: `${MARGIN_TOP}in`,
        bottom: `${MARGIN_BOTTOM}in`,
        left: `${MARGIN_LR}in`,
        right: `${MARGIN_LR}in`,
      },
      preferCSSPageSize: false,
    });

    await browser.close();

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="report.pdf"',
      },
    });
  } catch (err) {
    console.error('PDF generation error:', err);
    return NextResponse.json(
      { error: 'Failed to generate PDF', details: String(err) },
      { status: 500 }
    );
  }
}
