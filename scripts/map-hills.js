const tourWaypoints = [
    { name: "Castle Rock",            coords: [55.9486, -3.1999] },
    { name: "Calton Hill",            coords: [55.9553, -3.1835] },
    { name: "Arthur's Seat",          coords: [55.9441, -3.1618] },
    { name: "Salisbury Crags",        coords: [55.9415, -3.1735] },
    { name: "Blackford Hill",         coords: [55.9229, -3.1958] },
    { name: "Craiglockhart Hill (E)", coords: [55.9220, -3.2250] },
    { name: "Corstorphine Hill",      coords: [55.9512, -3.2796] }
];

let currentWaypointIndex = 0;
const proximityThreshold = 0.0005; // -50m radius
let map, userMarker, routeControl;


function initMap() {
    map = L.map('map').setView([55.9533, -3.1883], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);


    tourWaypoints.forEach((point, i) => {
        L.marker(point.coords)
            .addTo(map)
            .bindPopup(`<b>${i + 1}. ${point.name}</b>`);
    });

    updateNextInfo(); 
}

function updateNextInfo() {
    const nameEl = document.getElementById('next-hill-name');
    const btn    = document.getElementById('next-btn');

    if (currentWaypointIndex >= tourWaypoints.length) {
        nameEl.textContent = "Tour Complete!";
        btn.textContent    = "Finished";
        btn.disabled       = true;
    } else {
        const next = tourWaypoints[currentWaypointIndex];
        nameEl.textContent = next.name;
        btn.textContent    = `Go to ${next.name}`;
        btn.disabled       = false;
    }
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
        lineOptions: { styles: [{ color: '#1E90FF', weight: 5, opacity: 0.8 }] }
    }).addTo(map);

    map.fitBounds(routeControl.getBounds().pad(0.1));
}


document.getElementById('next-btn').addEventListener('click', () => {
    if (currentWaypointIndex >= tourWaypoints.length) return;

    alert(`You have reached ${tourWaypoints[currentWaypointIndex].name}!`);
    currentWaypointIndex++;

    updateNextInfo();

    if (currentWaypointIndex >= tourWaypoints.length) {
        alert('The 7 Hills of Edinburgh tour is complete – congratulations!');
        if (routeControl) map.removeControl(routeControl);
        return;
    }

    if (userMarker) {
        const pos = userMarker.getLatLng();
        drawRoute(pos.lat, pos.lng);
    } else {
        const center = map.getCenter();
        drawRoute(center.lat, center.lng);
    }
});


function distance(lat1, lng1, lat2, lng2) {
    return Math.sqrt(Math.pow(lat1 - lat2, 2) + Math.pow(lng1 - lng2, 2));
}


if (navigator.geolocation) {
    navigator.geolocation.watchPosition(
        function (position) {
            const userLat = position.coords.latitude;
            const userLng = position.coords.longitude;

            // User marker
            if (!userMarker) {
                userMarker = L.marker([userLat, userLng], {
                    icon: L.icon({
                        iconUrl: 'https://cdn-icons-png.flaticon.com/512/64/64113.png',
                        iconSize: [32, 32]
                    })
                })
                    .addTo(map)
                    .bindPopup('You are here')
                    .openPopup();
            } else {
                userMarker.setLatLng([userLat, userLng]);
            }

            map.setView([userLat, userLng], 15);

            if (currentWaypointIndex < tourWaypoints.length) {
                drawRoute(userLat, userLng);

                const target = tourWaypoints[currentWaypointIndex];
                const dist = distance(userLat, userLng, target.coords[0], target.coords[1]);

                if (dist < proximityThreshold) {
                    alert(`You have reached ${target.name}!`);
                    currentWaypointIndex++;
                    updateNextInfo();

                    if (currentWaypointIndex >= tourWaypoints.length) {
                        alert('The 7 Hills of Edinburgh tour is complete – congratulations!');
                        if (routeControl) map.removeControl(routeControl);
                    } else {
                        drawRoute(userLat, userLng);
                    }
                }
            }
        },
        function (err) {
            console.error('Geolocation error:', err);
        },
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
} else {
    console.warn('Geolocation not supported – manual mode only');
}

document.addEventListener('DOMContentLoaded', () => {
    initMap();
});