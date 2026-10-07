const fs = require('fs');
const file = 'src/app/portal/reports/[projectId]/banks/kotak/KotakBBG.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/ placeholder="[^"]*"/g, '');
content = content.replace(/ placeholder='[^']*'/g, '');
fs.writeFileSync(file, content);
console.log('Placeholders removed');
