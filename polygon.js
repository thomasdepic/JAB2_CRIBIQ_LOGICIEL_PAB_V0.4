var polygon = null;
var distanceLabels = [];

// Initialisation du curseur de profondeur
var profondeur = 2; // Valeur initiale de la profondeur
var profondeurSlider = document.getElementById('profondeurSlider');
var profondeurValue = document.getElementById('profondeurValue');

profondeurSlider.addEventListener('input', function() {
    profondeur = parseFloat(this.value);
    profondeurValue.textContent = profondeur;
    console.log("Nouvelle profondeur : " + profondeur);
    updateBufferFond(); // Mettre à jour le buffer en temps réel
    updateBufferDemi();
});

// Initialisation de la pente
var pente = 33; // Valeur initiale de la pente en %
var penteSlider = document.getElementById('penteSlider');
var penteValue = document.getElementById('penteValue');

penteSlider.addEventListener('input', function() {
    pente = parseFloat(this.value);
    penteValue.textContent = pente;
    console.log("Nouvelle pente : " + pente + "%");
    updateBufferFond(); // Mettre à jour le buffer en temps réel
    updateBufferDemi();
});

// Fonction pour calculer la distance entre deux points
function calculateDistance(latlng1, latlng2) {
    return map.distance(latlng1, latlng2).toFixed(2);
}

 // Fonction pour calculer et mettre à jour l'aire du polygone dans la bulle d'information
 function updatePolygonArea() {
    if (polygon) {
        var coords = polygon.getLatLngs()[0].map(latlng => [latlng.lng, latlng.lat]);
        coords.push(coords[0]); // Fermer le polygone

        var polygonGeoJSON = turf.polygon([coords]);
        var area = turf.area(polygonGeoJSON);
        var areaText = area > 1000000
            ? (area / 1000000).toFixed(2) + " km²"
            : area.toFixed(2) + " m²";

        //document.getElementById("infoBubble").innerHTML = "Surface du polygone : " + areaText;
    } else {
        //document.getElementById("infoBubble").innerHTML = "";
    }
}

// Fonction pour mettre à jour les labels des distances sur les arêtes
function updateDistanceLabels() {
    // Supprimer les anciennes labels
    distanceLabels.forEach(label => map.removeLayer(label));
    distanceLabels = [];

    if (polygon) {
        var latlngs = polygon.getLatLngs()[0];
        for (let i = 0; i < latlngs.length; i++) {
            let start = latlngs[i];
            let end = latlngs[(i + 1) % latlngs.length];

            let distance = calculateDistance(start, end);
            let middlePoint = L.latLng(
                (start.lat + end.lat) / 2,
                (start.lng + end.lng) / 2
            );

            let label = L.tooltip({
                permanent: true,
                direction: "center",
                className: "distance-label"
            })
                .setLatLng(middlePoint)
                .setContent(distance + " m")
                .addTo(map);

            distanceLabels.push(label);
        }
    }
}

function updatePolygon() {
    updateDistanceLabels();
    updateBufferFond();
    updateBufferDemi();
    updatePolygonArea();
}

function initPolygon() {
    map.on('click', function () {
        if (!polygon) {
            polygon = map.editTools.startPolygon();
            polygon.enableEdit();
        
        polygon.on('editable:editing', updatePolygon);
        polygon.on('editable:vertex:drag', updatePolygon);
        polygon.on('editable:vertex:new', updatePolygon);
        polygon.on('editable:vertex:deleted', updatePolygon);
        polygon.on('editable:dragend', updatePolygon);
        //maj de l'angle
        // polygon.on('editable:vertex:new', updateGridOrientation);
        // polygon.on('editable:vertex:drag', updateGridOrientation);
        // polygon.on('editable:vertex:deleted', updateGridOrientation);
        // polygon.on('editable:dragend', updateGridOrientation);

        polygon.on('dblclick', function(e) {
            map.removeLayer(e.target);
            polygon = null;
            if (bufferFondLayer) {
                map.removeLayer(bufferFondLayer);
                bufferFondLayer = null;
                }
            if (bufferDemiLayer) {
                map.removeLayer(bufferDemiLayer);
                bufferDemiLayer = null;
                }
            distanceLabels.forEach(label => map.removeLayer(label));
            distanceLabels = []; 
        
            });
        }
    });
}