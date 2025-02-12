var map;

function initMap() {
    // ⚡️ Initialisation de la carte
    map = L.map('map', { editable: true }).setView([48.8566, 2.3522], 13);
    map.doubleClickZoom.disable();
    // Ajouter une couche OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors'
    }).addTo(map);
    // 🔹 Géolocalisation utilisateur
    map.locate({ setView: true, maxZoom: 16 });

    map.on('locationfound', function(e) {
        L.marker(e.latlng).addTo(map).bindPopup("Vous êtes ici").openPopup();
        L.circle(e.latlng, { radius: e.accuracy }).addTo(map);
    });

    map.on('locationerror', function(e) {
        alert("Géolocalisation impossible : " + e.message);
    });
}
