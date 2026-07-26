import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  let browser = null;
  try {
    const { pages } = await req.json();
    
    if (!pages || !Array.isArray(pages) || pages.length === 0) {
      return NextResponse.json({ error: 'No pages provided' }, { status: 400 });
    }

    const puppeteer = await import('puppeteer-core');

    // Detect environment and launch browser accordingly
    const isVercel = !!process.env.VERCEL;
    
    if (isVercel) {
      // Serverless: use @sparticuz/chromium
      const chromium = await import('@sparticuz/chromium');
      browser = await puppeteer.default.launch({
        args: chromium.default.args,
        defaultViewport: { width: 816, height: 1056 },
        executablePath: await chromium.default.executablePath(),
        headless: true,
      });
    } else {
      // Local dev: use locally installed Chrome/Chromium
      // Try common Chrome paths on Windows, macOS, Linux
      const possiblePaths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/usr/bin/google-chrome',
        '/usr/bin/chromium-browser',
        '/usr/bin/chromium',
      ];
      
      let execPath: string | undefined;
      const fs = await import('fs');
      for (const p of possiblePaths) {
        if (p && fs.existsSync(p)) {
          execPath = p;
          break;
        }
      }

      if (!execPath) {
        // Fallback: try to import full puppeteer which bundles its own Chromium
        try {
          const fullPuppeteer = await import('puppeteer');
          browser = await fullPuppeteer.default.launch({
            headless: true,
            defaultViewport: { width: 816, height: 1056 },
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
          });
        } catch {
          return NextResponse.json(
            { error: 'No Chrome installation found. Install Google Chrome or the puppeteer package.' },
            { status: 500 }
          );
        }
      }

      if (!browser) {
        browser = await puppeteer.default.launch({
          executablePath: execPath,
          headless: true,
          defaultViewport: { width: 816, height: 1056 },
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
      }
    }

    const page = await browser.newPage();

    // Margins in inches (matching pixel values at 96dpi)
    const MARGIN_TOP = 112 / 96;    // ~1.167in
    const MARGIN_BOTTOM = 107 / 96; // ~1.115in
    const MARGIN_LR = 72 / 96;     // 0.75in

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
  </style>
</head>
<body>
  ${pages.map((pageContent: string) => `
    <div class="page-section">${pageContent}</div>
  `).join('')}
</body>
</html>`;

    await page.setContent(fullHTML, { waitUntil: 'networkidle0', timeout: 30000 });

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
    if (browser) try { await browser.close(); } catch {}
    console.error('PDF generation error:', err);
    return NextResponse.json(
      { error: 'Failed to generate PDF', details: String(err) },
      { status: 500 }
    );
  }
}
