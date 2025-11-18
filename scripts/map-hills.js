// initialises locations

const tourPoints = [
    { name: "Castle Rock",            coords: [55.9486, -3.1999] },
    { name: "Calton Hill",            coords: [55.9553, -3.1835] },
    { name: "Arthur's Seat",          coords: [55.9441, -3.1618] },
    { name: "Salisbury Crags",        coords: [55.9415, -3.1735] },
    { name: "Blackford Hill",         coords: [55.9229, -3.1958] },
    { name: "Craiglockhart Hill (E)", coords: [55.9220, -3.2250] },
    { name: "Corstorphine Hill",      coords: [55.9512, -3.2796] }
];

let currentPointIndex = 0;
const proximityThreshold = 0.0005;

let map, userMarker, routeControl;



// initialise and start up the map
function initMap() {
    map = L.map('map').setView([55.9533, -3.1883], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: "© OpenStreetMap contributors"
    }).addTo(map);

    tourPoints.forEach((point, i) => {
        L.marker(point.coords)
            .addTo(map)
            .bindPopup(`<b>${i + 1}. ${point.name}</b>`);
    });

    updateNextPointInfo();
}



// update location to next when button pressed

function updateNextPointInfo() {
    const nameEl = document.getElementById('next-point-name');
    const btn = document.getElementById('next-point-btn');

    if (!nameEl || !btn) return;

    if (currentPointIndex >= tourPoints.length) {
        nameEl.textContent = "Tour Complete!";
        btn.textContent = "Finished";
        btn.disabled = true;
    } else {
        const next = tourPoints[currentPointIndex];
        nameEl.textContent = next.name;
        btn.textContent = `Go to ${next.name}`;
        btn.disabled = false;
    }
}



// draw route on map and overlay it

function drawRoute(userLat, userLng) {
    if (currentPointIndex >= tourPoints.length) return;

    if (routeControl) map.removeControl(routeControl);

    const target = tourPoints[currentPointIndex];

    routeControl = L.Routing.control({
        waypoints: [
            L.latLng(userLat, userLng),
            L.latLng(target.coords[0], target.coords[1])
        ],
        routeWhileDragging: false,
        addWaypoints: false,
        draggableWaypoints: false,
        show: false,
        lineOptions: { styles: [{ color: '#1E90FF', weight: 5 }] }
    }).addTo(map);

    map.fitBounds(routeControl.getBounds().pad(0.1));
}



// distance function for proximity check

function distance(lat1, lng1, lat2, lng2) {
    return Math.sqrt(
        Math.pow(lat1 - lat2, 2) +
        Math.pow(lng1 - lng2, 2)
    );
}



// button code

document.getElementById('next-point-btn').addEventListener('click', () => {
    if (currentPointIndex >= tourPoints.length) return;

    alert(`You have reached ${tourPoints[currentPointIndex].name}!`);

    currentPointIndex++;
    updateNextPointInfo();

    if (currentPointIndex >= tourPoints.length) {
        alert("Tour complete — well done!");
        if (routeControl) map.removeControl(routeControl);
        return;
    }

    const pos = userMarker ? userMarker.getLatLng() : map.getCenter();
    drawRoute(pos.lat, pos.lng);
});



// live location tracker

if (navigator.geolocation) {
    navigator.geolocation.watchPosition(
        pos => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;

            if (!userMarker) {
                userMarker = L.marker([lat, lng], {
                    icon: L.icon({
                        iconUrl: "https://cdn-icons-png.flaticon.com/512/64/64113.png",
                        iconSize: [40, 40],
                        iconAnchor: [20, 40]
                    })
                })
                .addTo(map)
                .bindPopup("You are here")
                .openPopup();
            } else {
                userMarker.setLatLng([lat, lng]);
            }

            map.setView([lat, lng], 15);

            if (currentPointIndex < tourPoints.length) {
                drawRoute(lat, lng);

                const target = tourPoints[currentPointIndex];
                const dist = distance(lat, lng, target.coords[0], target.coords[1]);

                if (dist < proximityThreshold) {
                    alert(`You have reached ${target.name}!`);

                    currentPointIndex++;
                    updateNextPointInfo();

                    if (currentPointIndex >= tourPoints.length) {
                        alert("Tour complete — well done!");
                        if (routeControl) map.removeControl(routeControl);
                    }
                }
            }
        },
        err => console.error("Geolocation error:", err),
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
}

document.addEventListener("DOMContentLoaded", initMap);
