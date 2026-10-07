const fs = require('fs');
let pdf = fs.readFileSync('src/lib/banks/pdf-kotak-bbg-renderer.ts', 'utf8');

const replacements = {
  "e. Confirmation from the valuer'": "e. Confirmation from the valuer that the correct property is identified'",
  "f. Property Demarcated at Site'": "f. Plot/ Property Demarcated at Site'",
  "e. Are the plans approved?'": "e. Are the plans approved from competent authority?'",
  "i. Details of other documents perused'": "i. Details of other documents perused (pl list)'",
  "c. Stage of construction'": "c. Stage of construction in % (if applicable)'",
  "f. Quality of Construction'": "f. Quality of The Construction'",
  "h. Amenities provided'": "h. Amenities provided in building/ Complex (lifts, parking etc)'",
  "b. Building/ flat/ office/ shop/ unit/ showroom area'": "b. Building/ flat/ office/ shop/ unit/ showroom area (please specify the measurement unit, Area - Carpet, Built up, Super built up and basis of building area)'",
  "c. Deviations / Violations'": "c. Deviations/ violations (if any, please elaborate)'",
  "b. Comparables relied upon'": "b. Comparables relied upon (Minimum three)'",
  "c. Analysis of comparables'": "c. Analysis of comparables and basis for adopting a particular rate (Please exhaustively elaborate)'",
  "d. Land Rate Adopted (if applicable)'": "d. Land Rate Adopted (if applicable) (INR per Sq.Ft)'",
  "e. Building rate adopted'": "e. Building/ flat/ office/ shop/ unit/ showroom rate (depreciated/ composite) adopted and reason for the same (Please exhaustively elaborate)'",
  "g. Guideline/ Circle/ Ready Reckoner Rate'": "g. Guideline/ Circle/ Ready Reckoner Rate (INR per Sq.Ft)'",
  "d. Insurable Value'": "d. Insurable Value (To be rounded to the nearest Cr/Lakh)'"
};

for (const [oldLabel, newLabel] of Object.entries(replacements)) {
  pdf = pdf.replace('label: \'' + oldLabel, 'label: \'' + newLabel);
}

fs.writeFileSync('src/lib/banks/pdf-kotak-bbg-renderer.ts', pdf);
console.log('Replaced exact manual matches.');
