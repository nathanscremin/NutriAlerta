const fs = require('fs');

const pois = JSON.parse(fs.readFileSync('src/lib/extractedPois.json', 'utf8'));
const ubs_pts = pois.filter(p => p.categoria === 'UBS');

const features = [];
const min_lon = -47.65, max_lon = -47.50;
const min_lat = -22.45, max_lat = -22.35;
const grid_size = 80;

const lon_step = (max_lon - min_lon) / grid_size;
const lat_step = (max_lat - min_lat) / grid_size;

const ubs_polygons = {};
for (const ubs of ubs_pts) {
    ubs_polygons[ubs.nome] = [];
}

for (let i = 0; i < grid_size; i++) {
    for (let j = 0; j < grid_size; j++) {
        const lon = min_lon + i * lon_step;
        const lat = min_lat + j * lat_step;
        const center_lon = lon + lon_step/2;
        const center_lat = lat + lat_step/2;
        
        let min_dist = Infinity;
        let nearest = null;
        for (const ubs of ubs_pts) {
            const dist = Math.hypot(ubs.lon - center_lon, ubs.lat - center_lat);
            if (dist < min_dist) {
                min_dist = dist;
                nearest = ubs;
            }
        }
        
        if (nearest) {
            const square = [
                [lon, lat], [lon + lon_step, lat],
                [lon + lon_step, lat + lat_step], [lon, lat + lat_step], [lon, lat]
            ];
            ubs_polygons[nearest.nome].push(square);
        }
    }
}

for (const name in ubs_polygons) {
    const polys = ubs_polygons[name];
    if (polys.length === 0) continue;
    
    features.push({
        type: 'Feature',
        properties: { nome_bairro: name, categoria: 'UBS Region' },
        geometry: {
            type: 'MultiPolygon',
            coordinates: polys.map(p => [p])
        }
    });
}

const geojson = {
    type: 'FeatureCollection',
    features: features
};

fs.writeFileSync('public/mapa_ubs_voronoi.geojson', JSON.stringify(geojson));
console.log('Generated Voronoi Grid GeoJSON');
