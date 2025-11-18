
var tourWaypoints = [
    { name: "Start – Tesco (Morrison St)", coords: [55.9445, -3.2089] },
    { name: "Edinburgh Castle",           coords: [55.9486, -3.1999] },
    { name: "Grassmarket",                coords: [55.9468, -3.1956] },
    { name: "St Giles' Cathedral",        coords: [55.9496, -3.1908] }, 
    { name: "Greyfriars Kirkyard",        coords: [55.9467, -3.1922] },
    { name: "Holyrood Palace",            coords: [55.9526, -3.1722] }
];

var currentWaypointIndex = 0;
var proximityThreshold = 0.0005; 
var map, userMarker, routeControl;


var map = L.map('map').setView([55.9533, -3.1883], 14);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

tourWaypoints.forEach(function(point, i) {
    L.marker(point.coords)
        .addTo(map)
        .bindPopup(`<b>${i + 1}. ${point.name}</b>`);
});


function distance(lat1, lng1, lat2, lng2) {
    return Math.sqrt(Math.pow(lat1 - lat2, 2) + Math.pow(lng1 - lng2, 2));
}


function drawRoute(userLat, userLng) {
    if (currentWaypointIndex >= tourWaypoints.length) return;

    if (routeControl) map.removeControl(routeControl);

    const target = tourWaypoints[currentWaypointIndex];

    routeControl = L.Routing.control({
        waypoints: [
            L.latLng(userLat, userLng),
            L.latLng(target.coords[0], target.coords[1])
        ],
        routeWhileDragging: false,
        show: false,
        addWaypoints: false,
        draggableWaypoints: false,
        lineOptions: { styles: [{ color: '#1E90FF', weight: 6, opacity: 0.9 }] }
    }).addTo(map);

    map.fitBounds(routeControl.getBounds().pad(0.1));
}

-
function updateNextInfo() {
    const nameEl = document.getElementById('next-location-name');
    const btn    = document.getElementById('next-btn');

    if (!nameEl || !btn) return; 

    if (currentWaypointIndex >= tourWaypoints.length) {
        nameEl.textContent = "Tour Complete!";
        btn.textContent = "Finished";
        btn.disabled = true;
    } else {
        const next = tourWaypoints[currentWaypointIndex];
        nameEl.textContent = next.name;
        btn.textContent = `Go to ${next.name}`;
        btn.disabled = false;
    }
}


document.addEventListener('DOMContentLoaded', function() {
    const nextBtn = document.getElementById('next-btn');
    if (nextBtn) {
        nextBtn.addEventListener('click', function() {
            if (currentWaypointIndex >= tourWaypoints.length) return;

            alert(`You've reached ${tourWaypoints[currentWaypointIndex].name}!`);
            currentWaypointIndex++;
            updateNextInfo();

            if (currentWaypointIndex >= tourWaypoints.length) {
                alert("Tour Complete! You've explored the Old Town!");
                if (routeControl) map.removeControl(routeControl);
            } else if (userMarker) {
                const pos = userMarker.getLatLng();
                drawRoute(pos.lat, pos.lng);
            }
        });
    }


    updateNextInfo();
});


if (navigator.geolocation) {
    navigator.geolocation.watchPosition(
        function(position) {
            const userLat = position.coords.latitude;
            const userLng = position.coords.longitude;

            if (!userMarker) {
                userMarker = L.marker([userLat, userLng], {
                    icon: L.icon({
                        iconUrl: 'https://cdn-icons-png.flaticon.com/512/64/64113.png',
                        iconSize: [40, 40],
                        iconAnchor: [20, 40]
                    })
                })
                .addTo(map)
                .bindPopup("You are here")
                .openPopup();
            } else {
                userMarker.setLatLng([userLat, userLng]);
            }

            map.setView([userLat, userLng], 16);

            if (currentWaypointIndex < tourWaypoints.length) {
                drawRoute(userLat, userLng);

                const target = tourWaypoints[currentWaypointIndex];
                const dist = distance(userLat, userLng, target.coords[0], target.coords[1]);

                if (dist < proximityThreshold) {
                    alert(`You've arrived at ${target.name}!`);
                    currentWaypointIndex++;
                    updateNextInfo();

                    if (currentWaypointIndex >= tourWaypoints.length) {
                        alert("Tour Complete! You've explored the Old Town! Well done!");
                        if (routeControl) map.removeControl(routeControl);
                    } else {
                        setTimeout(() => drawRoute(userLat, userLng), 1000);
                    }
                }
            }
        },
        function(err) {
            console.error("Geolocation error:", err);
        },
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
} else {
    console.warn("Geolocation not supported – using manual mode");
}