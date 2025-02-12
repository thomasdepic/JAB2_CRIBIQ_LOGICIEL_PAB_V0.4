document.addEventListener("DOMContentLoaded", function () {
    console.log("🚀 Application Leaflet chargée");

    initMap();              // Initialise la carte
    initPolygon();          // Initialise le polygone
    initBufferFond();           // Initialise le buffer de fond 
    initBufferDemi  // Intialise le buffer de ligne de demi hauteur d'eau
    initStorage();          // Initialise la gestion de sauvegarde
    initIntersections();    // Intialise la gestion des intersections

    console.log("✅ Tous les modules sont chargés !");
});
