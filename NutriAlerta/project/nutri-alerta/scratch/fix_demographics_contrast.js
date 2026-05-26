const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'components', 'DemographicsSection.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace XAxis tick styling with explicit fill colors for high contrast
content = content.replace(
  /XAxis\s+type="number"\s+unit="%"\s+tick=\{\{\s*fontSize:\s*9,\s*fontWeight:\s*'bold'\s*\}\}/g,
  `XAxis type="number" unit="%" tick={{ fill: darkMode ? '#cbd5e1' : '#475569', fontSize: 9, fontWeight: 'bold' }}`
);

// Replace YAxis tick styling with explicit fill colors for high contrast
content = content.replace(
  /YAxis\s+dataKey="name"\s+type="category"\s+width=\{90\}\s+tick=\{\{\s*fontSize:\s*9,\s*fontWeight:\s*'bold'\s*\}\}/g,
  `YAxis dataKey="name" type="category" width={90} tick={{ fill: darkMode ? '#cbd5e1' : '#475569', fontSize: 9, fontWeight: 'bold' }}`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ DemographicsSection.tsx successfully patched with high contrast tick fill colors.');
