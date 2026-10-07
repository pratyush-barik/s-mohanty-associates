const fs = require('fs');
const ui = fs.readFileSync('src/app/portal/reports/[projectId]/banks/kotak/KotakBBG.tsx', 'utf8');
let pdf = fs.readFileSync('src/lib/banks/pdf-kotak-bbg-renderer.ts', 'utf8');

const uiFields = [...ui.matchAll(/label=[\u0022{]?[`']?([a-z]\.\s[^`\u0022{'}]+)/ig)].map(m => m[1]);

const blacklist = ['a. Boundaries as per legal /Sale Deed'];

for (const uiLabel of uiFields) {
  const prefixMatch = uiLabel.match(/^([a-z]\.)/i);
  if (!prefixMatch) continue;
  const prefix = prefixMatch[1];
  
  const pdfMatches = [...pdf.matchAll(new RegExp('label:\\s*[`\'](' + prefix.replace('.', '\\.') + '\\s[^`\']+)[\'`]', 'ig'))];
  const uiWords = uiLabel.toLowerCase().split(/[\s/.,()]+/).filter(w => w.length > 3);
  
  for (const pMatch of pdfMatches) {
     const pLabel = pMatch[1];
     if (blacklist.includes(pLabel)) continue;
     
     const pWords = pLabel.toLowerCase().split(/[\s/.,()]+/).filter(w => w.length > 3);
     
     const intersection = uiWords.filter(x => pWords.includes(x));
     if (intersection.length >= Math.min(2, pWords.length, uiWords.length)) {
        if (pLabel !== uiLabel) {
           console.log('REPLACING:', pLabel, '==>', uiLabel);
           pdf = pdf.replace(new RegExp('label:\\s*[`\']' + pLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[\'`]'), 'label: \'' + uiLabel + '\'');
        }
     }
  }
}
fs.writeFileSync('src/lib/banks/pdf-kotak-bbg-renderer.ts', pdf);
