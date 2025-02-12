var bufferDemiLayer = null;
var bufferDemiVisible = true;

function initBufferDemi() {
}

function updateBufferDemi() {
    if (!polygon || !bufferDemiVisible) return;

    if (bufferDemiLayer) {
        map.removeLayer(bufferDemiLayer);
    }

    var coords = polygon.getLatLngs()[0].map(latlng => [latlng.lng, latlng.lat]);
    coords.push(coords[0]);

    var polygonGeoJSON = turf.polygon([coords]);
    var penteCorrigee = pente > 0 ? pente : 1;
    var bufferSize = -profondeur / (penteCorrigee / 100 * 2) / 1000;
    
    var shrunkPolygon = turf.buffer(polygonGeoJSON, bufferSize, { units: 'kilometers' });

    if (!shrunkPolygon || shrunkPolygon.geometry.coordinates.length === 0) {
        return;
    }

    var newCoords = shrunkPolygon.geometry.coordinates[0].map(coord => [coord[1], coord[0]]);
    bufferDemiLayer = L.polygon(newCoords, { color: "red", weight: 2, dashArray: "5, 5" }).addTo(map);

    /* Udate intersection */
    generateIntersections();
}

function toggleBufferDemi() {
    bufferDemiVisible = !bufferDemiVisible;
    if (!bufferDemiVisible && bufferDemiLayer) {
        map.removeLayer(bufferDemiLayer);
        bufferDemiLayer = null;
    } else {
        updateBufferDemi();
    }
}