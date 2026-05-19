const fs = require('fs');
const ipynb = JSON.parse(fs.readFileSync('../geolocalização.ipynb', 'utf8'));

let html = '';
for (const cell of ipynb.cells) {
    if (cell.outputs) {
        for (const out of cell.outputs) {
            if (out.data && out.data['text/html']) {
                html += out.data['text/html'].join('');
            }
        }
    }
}

html = html
  .replace(/&quot;/g, '"')
  .replace(/&#x27;/g, "'")
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>');

const markerRegex = /var\s+(circle_marker_[a-zA-Z0-9_]+)\s*=\s*L\.circleMarker\(\s*\[\s*(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)\s*\]/g;
let match;
let count = 0;
while ((match = markerRegex.exec(html)) !== null && count < 5) {
    count++;
    const varName = match[1];
    const startIndex = match.index;
    const endIndex = html.indexOf(')', startIndex);
    const tooltipStr = varName + '.bindTooltip(';
    const tooltipIndex = html.indexOf(tooltipStr);
    console.log(`Marker ${count}: ${varName}`);
    console.log(`  startIndex: ${startIndex}, endIndex: ${endIndex}`);
    console.log(`  tooltipIndex: ${tooltipIndex}`);
    console.log(`  diff (tooltipIndex - endIndex): ${tooltipIndex - endIndex}`);
    if (tooltipIndex !== -1) {
        const divStart = html.indexOf('<div>', tooltipIndex);
        const divEnd = html.indexOf('</div>', divStart);
        console.log(`  Content: "${html.substring(divStart + 5, divEnd).trim()}"`);
    }
}
