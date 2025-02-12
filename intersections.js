// Variables globales
let intersectionLayer = null;  // Les points d'intersections
let gridLayer = null;          // La grille de lignes
let lines = [];                // Stocke toutes les lignes du quadrillage
let intersectionCount = 0;     // Nombre de point de mesure

let cellSizeMeters = 10;       // Taille initiale des cellules en mètres
let cellSizeSlider = document.getElementById("cellSizeSlider");
let cellSizeValue = document.getElementById("cellSizeValue");

// Mettre à jour la valeur de la cellule lorsque le curseur est ajusté
cellSizeSlider.addEventListener("input", function () {
    cellSizeMeters = parseFloat(this.value);
    cellSizeValue.textContent = cellSizeMeters;
    console.log("📏 Nouvelle distance entre les sommets :", cellSizeMeters, "m");
    generateIntersections();
});

// // --- Fonction getAdjustedBounds ---
// // Permet de calculer une bounding box "ajustée" en corrigeant l'écart longitude avec le facteur cos(center.lat)
// function getAdjustedBounds(points, center) {
//     let factor = Math.cos(center.lat * Math.PI / 180);
//     let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    
//     points.forEach(p => {
//         let x = (p.lng - center.lng) * factor;
//         let y = p.lat - center.lat;
//         if (x < minX) minX = x;
//         if (x > maxX) maxX = x;
//         if (y < minY) minY = y;
//         if (y > maxY) maxY = y;
//     });
    
//     return {
//         minX: minX,
//         maxX: maxX,
//         minY: minY,
//         maxY: maxY,
//         width: maxX - minX,
//         height: maxY - minY
//     };
// }

// --- Fonctions de transformation et rotation en utilisant L.LatLng ---
function getMainOrientation(polygon) {
    let coords = polygon.getLatLngs()[0]; // Tableau de L.LatLng
    let longestEdge = { length: 0, angle: 0 };

    for (let i = 0; i < coords.length - 1; i++) {
        let p1 = coords[i], p2 = coords[i + 1];
        let dx = p2.lng - p1.lng;
        let dy = p2.lat - p1.lat;
        let length = Math.sqrt(dx * dx + dy * dy);
        let angle = Math.atan2(dy, dx);
        if (length > longestEdge.length) {
            longestEdge = { length, angle };
        }
    }
    return longestEdge.angle;
}

function transformToGlobal(latlng, center, angle) {
    let dx = latlng.lng - center.lng;
    let dy = latlng.lat - center.lat;
    let newLng = dx * Math.cos(angle) - dy * Math.sin(angle) + center.lng;
    let newLat = dx * Math.sin(angle) + dy * Math.cos(angle) + center.lat;
    return L.latLng(newLat, newLng);
}

function rotatePolygon(polygon, center, angle) {
    return polygon.map(p => {
        let dx = p.lng - center.lng;
        let dy = p.lat - center.lat;
        // Appliquer une rotation de -angle pour aligner le polygone
        let newLng = dx * Math.cos(-angle) - dy * Math.sin(-angle) + center.lng;
        let newLat = dx * Math.sin(-angle) + dy * Math.cos(-angle) + center.lat;
        return L.latLng(newLat, newLng);
    });
}

function rotateLine(line, angle, center) {
    let latlngs = line.getLatLngs();
    let rotatedLatLngs = latlngs.map(ll => transformToGlobal(ll, center, angle));
    return L.polyline(rotatedLatLngs, { color: 'black', weight: 1 });
}

// --- Fonction principale generateIntersections ---
function generateIntersections() {
    if (!polygon) {
        alert("Veuillez d'abord dessiner un polygone.");
        return;
    }
    if (typeof map === "undefined" || !map) {
        console.error("⚠️ La carte 'map' n'est pas disponible !");
        return;
    }

    // Supprimer les anciennes couches
    if (intersectionLayer) map.removeLayer(intersectionLayer);
    if (gridLayer) map.removeLayer(gridLayer);

    intersectionLayer = L.layerGroup().addTo(map);
    gridLayer = L.layerGroup().addTo(map);
    lines = [];
    intersectionCount = 0;
    console.log("Couches ajoutées à la carte");

    // Récupération des points du polygone (L.LatLng)
    let polygonCoords = polygon.getLatLngs()[0];
    let boundsGlobal = polygon.getBounds();
    let center = boundsGlobal.getCenter();
    let angle = getMainOrientation(bufferDemiLayer);
    // Rotation du polygone pour aligner horizontalement
    let bufferDemiLocal = rotatePolygon(polygonCoords, center, angle);

    console.log("🔵 Orientation du polygone:", angle);
    console.log("🗺️ Coordonnées du centre:", center);

    // Calcul de la bounding box de la grille basée sur les points tournés
    let boundsLocal = L.latLngBounds(bufferDemiLocal);
    let southWest = boundsLocal.getSouthWest();
    let northEast = boundsLocal.getNorthEast();

    // Calcul du pas en degrés à partir du centre
    const oneDegreeLatMeters = 111320;  
    const oneDegreeLngMeters = 111320 * Math.cos(center.lat * Math.PI / 180);
    let cellSizeLatDeg = cellSizeMeters / oneDegreeLatMeters;
    let cellSizeLngDeg = cellSizeMeters / oneDegreeLngMeters;

    console.log("Cellule en degrés : lat:", cellSizeLatDeg, "lng:", cellSizeLngDeg);

    // --- Création des valeurs de grille en utilisant ces pas ---
    let latValues = [];
    let lngValues = [];

    for (let lat = southWest.lat; lat <= northEast.lat; lat += cellSizeLatDeg) {
        latValues.push(lat);
    }
    for (let lng = southWest.lng; lng <= northEast.lng; lng += cellSizeLngDeg) {
        lngValues.push(lng);
    }

    // Ajuster la vue de la carte sur la bounding box d'origine (vous pouvez aussi utiliser boundsLocal)
    // map.fitBounds(boundsLocal);
    // console.log("Vue ajustée sur la grille.");

    // --- Tracé des lignes horizontales ---
    latValues.forEach(lat => {
        let start = L.latLng(lat, southWest.lng);
        let end = L.latLng(lat, northEast.lng);
        let line = L.polyline([start, end], { color: 'black', weight: 1 });
        let rotatedLine = rotateLine(line, angle, center);
        rotatedLine.addTo(gridLayer);
        console.log("Ligne horizontale ajoutée", rotatedLine);
        lines.push(rotatedLine);
        findIntersections(rotatedLine, bufferDemiLayer, "red");
        findIntersections(rotatedLine, bufferFondLayer, "blue");
    });

    // --- Tracé des lignes verticales ---
    lngValues.forEach(lng => {
        let start = L.latLng(southWest.lat, lng);
        let end = L.latLng(northEast.lat, lng);
        let line = L.polyline([start, end], { color: 'black', weight: 1 });
        let rotatedLine = rotateLine(line, angle, center);
        rotatedLine.addTo(gridLayer);
        console.log("Ligne verticale ajoutée", rotatedLine);
        lines.push(rotatedLine);
        findIntersections(rotatedLine, bufferDemiLayer, "red");
        findIntersections(rotatedLine, bufferFondLayer, "blue");
    });

    calculateLineIntersections();
    document.getElementById("infoBubble").innerHTML = "Nombre de point de mesure : " + intersectionCount;
}

// --- Fonctions d'intersection (inchangées) ---
function findIntersections(line, ligneDeNiveau, color) {
    let latlngs = line.getLatLngs();
    let lineGeoJSON = turf.lineString(latlngs.map(latlng => [latlng.lng, latlng.lat]));
    if (!ligneDeNiveau) {
        console.error("⚠️ Le bufferLayer est introuvable.");
        return;
    }
    let bufferGeoJSON = ligneDeNiveau.toGeoJSON();
    let intersections = turf.lineIntersect(lineGeoJSON, bufferGeoJSON);
    intersections.features.forEach(function (point) {
        let latlng = L.latLng(point.geometry.coordinates[1], point.geometry.coordinates[0]);
        L.circleMarker(latlng, { color: color, radius: 5 }).addTo(intersectionLayer);
        //intersectionCount++;
    });
}

function calculateLineIntersections() {
    if (!bufferFondLayer) {
        console.error("⚠️ Le bufferLayer est introuvable.");
        return;
    }
    let bufferGeoJSON = bufferFondLayer.toGeoJSON();
    for (let i = 0; i < lines.length; i++) {
        for (let j = i + 1; j < lines.length; j++) {
            let line1 = lines[i];
            let line2 = lines[j];
            let intersection = getLineIntersection(line1, line2);
            if (intersection && turf.booleanPointInPolygon(turf.point([intersection.lng, intersection.lat]), bufferGeoJSON)) {
                L.circleMarker(intersection, { color: 'green', radius: 5 }).addTo(intersectionLayer);
                intersectionCount++;
            }
        }
    }
}

function getLineIntersection(line1, line2) {
    let latlngs1 = line1.getLatLngs();
    let latlngs2 = line2.getLatLngs();
    let line1GeoJSON = turf.lineString(latlngs1.map(latlng => [latlng.lng, latlng.lat]));
    let line2GeoJSON = turf.lineString(latlngs2.map(latlng => [latlng.lng, latlng.lat]));
    let intersection = turf.lineIntersect(line1GeoJSON, line2GeoJSON);
    if (intersection.features.length > 0) {
        let point = intersection.features[0].geometry.coordinates;
        return L.latLng(point[1], point[0]);
        
    }
    return null;
}

function initIntersections() {
    console.log("📌 Initialisation du module Intersections...");
    console.log("✅ Module Intersections initialisé.");
}
