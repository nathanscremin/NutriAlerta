const fs = require('fs');

const ipynb = JSON.parse(fs.readFileSync('../geolocalização.ipynb', 'utf8'));

let htmlOutputs = [];
for (const cell of ipynb.cells) {
    if (cell.outputs) {
        for (const out of cell.outputs) {
            if (out.data && out.data['text/html']) {
                htmlOutputs.push(out.data['text/html'].join(''));
            }
        }
    }
}

// We only want the first map (which is the main POI map with hex colors)
const html = htmlOutputs[0]
  .replace(/&quot;/g, '"')
  .replace(/&#x27;/g, "'")
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&amp;/g, '&');

const pois = [];
const markerRegex = /var\s+(circle_marker_[a-zA-Z0-9_]+)\s*=\s*L\.circleMarker\(\s*\[\s*(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)\s*\]/g;

let match;
while ((match = markerRegex.exec(html)) !== null) {
    const varName = match[1];
    const lat = parseFloat(match[2]);
    const lon = parseFloat(match[3]);
    
    // Find the color in the options of L.circleMarker
    const startIndex = match.index;
    const endIndex = html.indexOf(')', startIndex);
    const markerOptions = html.substring(startIndex, endIndex);
    const colorMatch = markerOptions.match(/"color":\s*"([#a-zA-Z0-9]+)"/);
    const color = colorMatch ? colorMatch[1] : '#000000';
    
    // Find tooltip call for this variable name
    let nome = 'Desconhecido';
    const tooltipStr = varName + '.bindTooltip(';
    const tooltipIndex = html.indexOf(tooltipStr, endIndex);
    if (tooltipIndex !== -1 && tooltipIndex - endIndex < 1500) { // must be nearby
        const divStart = html.indexOf('<div>', tooltipIndex);
        const divEnd = html.indexOf('</div>', divStart);
        if (divStart !== -1 && divEnd !== -1 && divStart - tooltipIndex < 200) {
            nome = html.substring(divStart + 5, divEnd).trim();
            nome = nome.replace(/<[^>]*>/g, '').trim();
            nome = nome.replace(/\s+/g, ' ');
        }
    }
    
    let cat = 'Desconhecido';
    if (color === '#e74c3c') cat = 'UBS';
    else if (color === '#8e44ad') cat = 'Pronto-Atendimento';
    else if (color === '#f39c12') cat = 'Saúde Mental';
    else if (color === '#c0392b') cat = 'Vigilância Sanitária';
    else if (color === '#3498db') cat = 'Educação';
    else if (color === '#2ecc71') cat = 'Esporte e Lazer';
    else if (color === '#e67e22') cat = 'Alimentação - Restaurante/Fast-food';
    else if (color === '#9b59b6') cat = 'Alimentação - Mercado';

    // Deduplicate
    if (!pois.find(p => p.nome === nome && Math.abs(p.lat - lat) < 0.0001 && Math.abs(p.lon - lon) < 0.0001)) {
        pois.push({ id: 'poi-' + pois.length, lat, lon, color, nome, categoria: cat });
    }
}

fs.writeFileSync('src/lib/extractedPois.json', JSON.stringify(pois, null, 2));
console.log('Successfully saved', pois.length, 'POIs from Map 1 only.');
