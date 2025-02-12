var bufferFondLayer = null;
var bufferFondVisible = true;

function initBufferFond() {
}

function updateBufferFond() {
    if (!polygon || !bufferFondVisible) return;

    if (bufferFondLayer) {
        map.removeLayer(bufferFondLayer);
    }

    var coords = polygon.getLatLngs()[0].map(latlng => [latlng.lng, latlng.lat]);
    coords.push(coords[0]);

    var polygonGeoJSON = turf.polygon([coords]);
    var penteCorrigee = pente > 0 ? pente : 1;
    var bufferSize = -profondeur / (penteCorrigee / 100) / 1000;
    
    var shrunkPolygon = turf.buffer(polygonGeoJSON, bufferSize, { units: 'kilometers' });

    if (!shrunkPolygon || shrunkPolygon.geometry.coordinates.length === 0) {
        return;
    }

    var newCoords = shrunkPolygon.geometry.coordinates[0].map(coord => [coord[1], coord[0]]);
    bufferFondLayer = L.polygon(newCoords, { color: "red", weight: 2, dashArray: "5, 5" }).addTo(map);
}

function toggleBufferfond() {
    bufferFondVisible = !bufferFondVisible;
    if (!bufferFondVisible && bufferFondLayer) {
        map.removeLayer(bufferFondLayer);
        bufferFondLayer = null;
    } else {
        updateBufferFond();
    }
}