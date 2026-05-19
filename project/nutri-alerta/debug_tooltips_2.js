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

// Find the first circle marker var name
const markerRegex = /var\s+(circle_marker_[a-zA-Z0-9_]+)\s*=\s*L\.circleMarker/g;
const match = markerRegex.exec(html);
if (match) {
    const varName = match[1];
    console.log('First varName:', varName);
    const tooltipStr = varName + '.bindTooltip(';
    console.log('Searching for:', tooltipStr);
    const idx = html.indexOf(tooltipStr);
    console.log('Index of tooltip binding:', idx);
    if (idx !== -1) {
        console.log('Substring:', html.substring(idx, idx + 100));
    }
}
