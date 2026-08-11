const fs = require('fs');
let content = fs.readFileSync('src/app/portal/reports/[projectId]/IBBIReportBuilder.tsx', 'utf8');

// Initialize map at TOC section
content = content.replace(
  'const tocItems = [',
  'const tocPageMap: Record<string, number> = {};\n      const tocItems = ['
);

// Map of texts to TOC ids
const replacements = [
  { search: `r.drawCenteredTitle('VALUATION CERTIFICATE');`, id: 'VALUATION CERTIFICATE' },
  { search: `r.drawSectionHeader('1. OBJECTIVE:');`, id: '1.  OBJECTIVE' },
  { search: `r.drawTextBlock('1.1 VALUATION STANDARD', { bold: true });`, id: '    1.1  Valuation Standard' },
  { search: `r.drawTextBlock('1.2 PURPOSE OF VALUATION', { bold: true });`, id: '    1.2  Purpose of Valuation' },
  { search: `r.drawTextBlock('1.3 CONFLICT OF INTEREST', { bold: true });`, id: '    1.3  Conflict of Interest' },
  { search: `r.drawTextBlock('1.4 CURRENCY AND MEASUREMENT', { bold: true });`, id: '    1.4  Currency and Measurement' },
  { search: `r.drawTextBlock('1.5 RESPONSIBILITY TO THIRD PARTIES', { bold: true });`, id: '    1.5  Responsibility to Third Parties' },
  { search: `r.drawTextBlock('1.6 DISCLOSURE AND PUBLICATION', { bold: true });`, id: '    1.6  Disclosure and Publication' },
  { search: `r.drawTextBlock('1.7 LIMITATIONS ON LIABILITY', { bold: true });`, id: '    1.7  Limitations on Liability' },
  { search: `r.drawSectionHeader('2. SCOPE OF ENQUIRIES AND INVESTIGATION:');`, id: '2.  SCOPE OF ENQUIRIES AND INVESTIGATION' },
  { search: `r.drawSectionHeader('3. BASIS OF VALUATION:');`, id: '3.  BASIS OF VALUATION' },
  { search: `r.drawSectionHeader('4. BRIEF DESCRIPTION OF THE PROPERTY');`, id: '4.  BRIEF DESCRIPTION OF THE PROPERTY' },
  { search: `r.drawSectionHeader('5. TOWN PLANNING PARAMETERS:');`, id: '5.  TOWN PLANNING PARAMETERS' },
  { search: `r.drawSectionHeader('6. DOCUMENT DETAILS AND LEGAL ASPECTS OF THE PROPERTY:');`, id: '6.  DOCUMENT DETAILS AND LEGAL ASPECTS' },
  { search: `r.drawSectionHeader('7. FUNCTIONAL AND INFRASTRUCTURE ASPECTS OF THE PROPERTY:');`, id: '7.  FUNCTIONAL AND INFRASTRUCTURE ASPECTS' },
  { search: `r.drawSectionHeader('8. SOCIO-CULTURAL ASPECTS OF THE PROPERTY:');`, id: '8.  SOCIO-CULTURAL ASPECTS' },
  { search: `r.drawSectionHeader('9. ENVIRONMENTAL FACTORS AFFECTING THE PROPERTY:');`, id: '9.  ENVIRONMENTAL FACTORS' },
  { search: `r.drawSectionHeader('10. MARKETABILITY ASPECTS OF THE PROPERTY:');`, id: '10. MARKETABILITY OF THE PROPERTY' },
  { search: `r.drawSectionHeader('11. ARCHITECTURAL ASPECTS:');`, id: '11. ARCHITECTURAL ASPECTS' },
  { search: `r.drawSectionHeader('12. ENGINEERING ASPECTS OF THE PROPERTY:');`, id: '12. ENGINEERING ASPECTS' },
  { search: `r.drawSectionHeader('13. VALUATION APPROACHES & METHODOLOGY ADOPTED');`, id: '13. VALUATION APPROACHES & METHODOLOGY' },
  { search: `r.drawTextBlock('13.1 METHODOLOGY', { bold: true });`, id: '    13.1  Methodology' },
  { search: `r.drawTextBlock('13.2 VALUATION BASES', { bold: true });`, id: '    13.2  Valuation Bases' },
  { search: `r.drawTextBlock('13.3 VALUATION CONSIDERATIONS', { bold: true });`, id: '    13.3  Valuation Considerations' },
  { search: `r.drawTextBlock('13.4 VALUATION ASSUMPTIONS', { bold: true });`, id: '    13.4  Valuation Assumptions' },
  { search: `r.drawTextBlock('13.5 VALUATION ANALYSIS', { bold: true });`, id: '    13.5  Valuation Analysis' },
  { search: `r.drawTextBlock('13.6 DETAILS OF VALUATION', { bold: true });`, id: '    13.6  Details of Valuation' },
  { search: `r.drawSectionHeader('14. SITE LOCATION:');`, id: '14. SITE LOCATION' },
  { search: `r.drawSectionHeader('15. ASSUMPTION & LIMITATION.');`, id: '15. ASSUMPTIONS & LIMITATIONS' },
  { search: `r.drawSectionHeader('CONCLUSION');`, id: 'CONCLUSION' },
  { search: `r.drawSectionHeader('DECLARATION AND UNDERTAKING');`, id: 'DECLARATION AND UNDERTAKING' },
  { search: `r.drawCenteredTitle('PROPERTY PHOTOGRAPHS');`, id: 'PROPERTY PHOTOGRAPHS' }
];

replacements.forEach(r => {
  content = content.replace(r.search, r.search + '\n      tocPageMap[\'' + r.id + '\'] = r.getPageCount();');
});

// Update the annexures logic too
content = content.replace(
  'r.drawCenteredTitle(annexure.title ? `ANNEXURE ${annexure.label} - ${annexure.title.toUpperCase()}` : `ANNEXURE ${annexure.label}`);',
  'r.drawCenteredTitle(annexure.title ? `ANNEXURE ${annexure.label} - ${annexure.title.toUpperCase()}` : `ANNEXURE ${annexure.label}`);\n            tocPageMap[`ANNEXURE ${annexure.label}${annexure.title ? \': \' + annexure.title.toUpperCase() : \'\'}`] = r.getPageCount();'
);

// Call fillTOCPageNumbers right before blob generation
content = content.replace(
  'const blob = await r.toBlob();',
  'r.fillTOCPageNumbers(tocPageMap);\n      const blob = await r.toBlob();'
);

// Replace TOC loop with drawTOCRow
content = content.replace(
  /for \(const item of tocItems\) \{\s*const isSub = item\.startsWith\('    '\);\s*r\.drawTextBlock\(item, \{ fontSize: isSub \? 10 : 12, bold: !isSub \}\);\s*r\.advanceCursor\(isSub \? 1 : 2\);\s*\}/s,
  'for (const item of tocItems) {\n        r.drawTOCRow(item, item);\n      }'
);

fs.writeFileSync('src/app/portal/reports/[projectId]/IBBIReportBuilder.tsx', content);
