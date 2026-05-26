const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'components', 'DemographicsSection.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace tickStyle with tick for both XAxis and YAxis
content = content.replace(/tickStyle=\{\{\s*fontSize:\s*9,\s*fontWeight:\s*'bold'\s*\}\}/g, "tick={{ fontSize: 9, fontWeight: 'bold' }}");

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ DemographicsSection.tsx successfully patched: replaced tickStyle with tick.');
