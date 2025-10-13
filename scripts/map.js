// Define tour waypoints in order
var tourWaypoints = [
	{ name: "Tesco", coords: [55.934083, -3.210556] }, 
    { name: "Edinburgh Castle", coords: [55.9486, -3.1999] },
    { name: "Grassmarket", coords: [55.9468, -3.1956] },
    { name: "Holyrood Palace", coords: [55.9524, -3.1720] },

];

var currentWaypointIndex = 0; // Track which waypoint user is heading to
var proximityThreshold = 0.0005; // ~50 meters (approx, in lat/lng units)

// Initialize map
var map = L.map('map').setView([55.9533, -3.1883], 13);

// Add OSM tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Add markers for all waypoints
tourWaypoints.forEach(function(point) {
    L.marker(point.coords).addTo(map).bindPopup(point.name);
});

// Function to calculate distance between two coordinates (lat/lng)
function distance(lat1, lng1, lat2, lng2) {
    return Math.sqrt(Math.pow(lat1 - lat2, 2) + Math.pow(lng1 - lng2, 2));
}

// Draw route to current waypoint
function drawRoute(userLat, userLng) {
    if (currentWaypointIndex >= tourWaypoints.length) return;

    // Remove old route
    if (window.routeControl) {
        map.removeControl(window.routeControl);
    }

    const target = tourWaypoints[currentWaypointIndex];

    // Draw new route
    window.routeControl = L.Routing.control({
        waypoints: [
            L.latLng(userLat, userLng),
            L.latLng(target.coords[0], target.coords[1])
        ],
        routeWhileDragging: false,
        show: false,
        addWaypoints: false,
        draggableWaypoints: false,
        lineOptions: {
            styles: [{ color: '#1E90FF', weight: 5, opacity: 0.8 }]
        }
    }).addTo(map);
}

// Track user location
if (navigator.geolocation) {
    navigator.geolocation.watchPosition(
        function(position) {
            const userLat = position.coords.latitude;
            const userLng = position.coords.longitude;

            // Add or update user marker
            if (!window.userMarker) {
                window.userMarker = L.marker([userLat, userLng], {icon: L.icon({iconUrl: 'https://cdn-icons-png.flaticon.com/512/64/64113.png', iconSize: [32,32]})})
                    .addTo(map)
                    .bindPopup("You are here")
                    .openPopup();
            } else {
                window.userMarker.setLatLng([userLat, userLng]);
            }

            // Center map
            map.setView([userLat, userLng], 15);

            // Draw route to current waypoint
            if (currentWaypointIndex < tourWaypoints.length) {
                drawRoute(userLat, userLng);

                // Check if user is near the current waypoint
                const target = tourWaypoints[currentWaypointIndex];
                const dist = distance(userLat, userLng, target.coords[0], target.coords[1]);

                if (dist < proximityThreshold) {
                    alert(`You have reached ${target.name}!`);
                    currentWaypointIndex++; // Move to next waypoint
                    if (currentWaypointIndex >= tourWaypoints.length) {
                        alert("Tour completed! 🎉");
                        if (window.routeControl) {
                            map.removeControl(window.routeControl); // Remove final route
                        }
                    }
                }
            }
        },
        function(error) {
            console.error("Error getting location:", error);
            alert("Unable to access your location. Please enable GPS.");
        },
        { enableHighAccuracy: true }
    );
} else {
    alert("Geolocation is not supported by your browser.");
}
