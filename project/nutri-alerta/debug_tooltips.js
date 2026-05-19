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

const match = html.match(/bindTooltip\([\s\S]{1,300}/);
console.log('Tooltip binding sample:', match ? match[0] : 'None');
