// ===== 7 Hills Tour (mobile-first, lean) =====
// Same features as oldTown version.

const TOUR_ID = "hills";
const STORAGE_KEY = `tour:${TOUR_ID}`;

const tourPoints = [
  { name: "Arthur's Seat", coords: [55.9440, -3.1610], image: "images/arthurs-seat.jpg", info: "Extinct volcano and Edinburgh’s most famous viewpoint." },
  { name: "Castle Rock", coords: [55.9486, -3.2008], image: "images/edinburgh-castle.jpg", info: "Volcanic plug forming the Castle’s dramatic base." },
  { name: "Calton Hill", coords: [55.9553, -3.1829], image: "images/calton-hill.jpg", info: "Iconic city viewpoint with monuments and skyline views." },
  { name: "Corstorphine Hill", coords: [55.9529, -3.2797], image: "images/corstorphine-hill.jpg", info: "Woodland hill on the west side with great views." },
  { name: "Craiglockhart Hill", coords: [55.9219, -3.2264], image: "images/craiglockhart-hill.jpg", info: "A quieter hill with paths and views across the city." },
  { name: "Braid Hills", coords: [55.9166, -3.2119], image: "images/braid-hills.jpg", info: "Open hillside with panoramic views south of Edinburgh." },
  { name: "Blackford Hill", coords: [55.9233, -3.1950], image: "images/blackford-hill.jpg", info: "Popular viewpoint near the Observatory and the Hermitage." }
];

let activeRoute = [...tourPoints];
let currentIndex = 0;
let skipped = 0;

// Arrival detection (hills are broader areas)
const ARRIVAL_RADIUS_METERS = 45;
let lastArrivalIndex = -1;
let lastArrivalTime = 0;
const ARRIVAL_COOLDOWN_MS = 15000;

// Leaflet state
let map, userMarker, routeControl;

// ===== DOM (arrival modal) =====
const arrivalModal = document.getElementById("arrivalModal");
const arrivalTitle = document.getElementById("arrivalTitle");
const arrivalImg = document.getElementById("arrivalImg");
const arrivalText = document.getElementById("arrivalText");
const arrivalClose = document.getElementById("arrivalClose");
const arrivalNext = document.getElementById("arrivalNext");

// ===== DOM (custom order modal) =====
const orderModal = document.getElementById("orderModal");
const orderList = document.getElementById("orderList");
const orderClose = document.getElementById("orderClose");
const orderCancel = document.getElementById("orderCancel");
const orderSave = document.getElementById("orderSave");

// ===== DOM (progress) =====
const progressText = document.getElementById("progressText");
const progressFill = document.getElementById("progressFill");
const progressBar = document.querySelector(".progress-bar");

// ---------- Utilities ----------
function openModal(el) {
  if (!el) return;
  el.classList.add("open");
  el.setAttribute("aria-hidden", "false");
}
function closeModal(el) {
  if (!el) return;
  el.classList.remove("open");
  el.setAttribute("aria-hidden", "true");
}

function distanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function nearestNeighbourSort(startLat, startLng, points) {
  const remaining = [...points];
  const sorted = [];
  let curLat = startLat, curLng = startLng;

  while (remaining.length) {
    let bestI = 0, bestD = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const p = remaining[i];
      const d = distanceMeters(curLat, curLng, p.coords[0], p.coords[1]);
      if (d < bestD) { bestD = d; bestI = i; }
    }
    const next = remaining.splice(bestI, 1)[0];
    sorted.push(next);
    curLat = next.coords[0];
    curLng = next.coords[1];
  }
  return sorted;
}

// ---------- Storage ----------
function saveState() {
  const state = {
    i: currentIndex,
    skipped,
    order: activeRoute.map(p => p.name)
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function clearState() {
  localStorage.removeItem(STORAGE_KEY);
}

function rebuildRouteFromNames(names) {
  const byName = new Map(tourPoints.map(p => [p.name, p]));
  const rebuilt = names.map(n => byName.get(n)).filter(Boolean);
  return rebuilt.length === tourPoints.length ? rebuilt : [...tourPoints];
}

function loadStateIfAny() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;

  let state;
  try { state = JSON.parse(raw); } catch { return; }
  if (!state) return;

  const hasSomething =
    (Number.isFinite(state.i) && state.i > 0) ||
    (Number.isFinite(state.skipped) && state.skipped > 0) ||
    (Array.isArray(state.order) && state.order.length === tourPoints.length);

  if (!hasSomething) return;

  const resume = confirm("Resume your previous progress for this tour?");
  if (!resume) {
    clearState();
    return;
  }

  if (Array.isArray(state.order) && state.order.length === tourPoints.length) {
    activeRoute = rebuildRouteFromNames(state.order);
  }

  if (Number.isFinite(state.i)) {
    currentIndex = Math.max(0, Math.min(activeRoute.length, parseInt(state.i)));
  }

  if (Number.isFinite(state.skipped)) {
    skipped = Math.max(0, parseInt(state.skipped));
  }
}

// ---------- UI ----------
function updateProgressUI() {
  const total = activeRoute.length;
  const done = Math.min(currentIndex, total);
  const remaining = Math.max(0, total - done);
  const percent = total ? Math.round((done / total) * 100) : 0;

  if (progressText) {
    const skipTxt = skipped ? ` • Skipped ${skipped}` : "";
    progressText.textContent = `${percent}% completed • ${remaining} stops remaining${skipTxt}`;
  }
  if (progressFill) progressFill.style.width = `${percent}%`;
  if (progressBar) progressBar.setAttribute("aria-valuenow", String(percent));
}

function updateNextStopUI() {
  const nameEl = document.getElementById("next-point-name");
  const btn = document.getElementById("next-point-btn");
  if (!nameEl || !btn) return;

  if (currentIndex >= activeRoute.length) {
    nameEl.textContent = "Tour Complete!";
    btn.textContent = "Finished";
    btn.disabled = true;
    clearState();
    removeRoute();
  } else {
    const next = activeRoute[currentIndex];
    nameEl.textContent = next.name;
    btn.textContent = `Click once you have reached ${next.name}`;
    btn.disabled = false;
  }

  updateProgressUI();
}

// ---------- Routing ----------
function removeRoute() {
  if (routeControl && map) {
    map.removeControl(routeControl);
    routeControl = null;
  }
}

function drawRoute(userLat, userLng) {
  if (!map) return;
  if (currentIndex >= activeRoute.length) return;

  removeRoute();

  const target = activeRoute[currentIndex];
  routeControl = L.Routing.control({
    waypoints: [L.latLng(userLat, userLng), L.latLng(target.coords[0], target.coords[1])],
    routeWhileDragging: false,
    addWaypoints: false,
    draggableWaypoints: false,
    show: false,
    lineOptions: { styles: [{ color: "#1E90FF", weight: 5 }] }
  }).addTo(map);

  map.fitBounds(routeControl.getBounds().pad(0.1));
}

// ---------- Tour actions ----------
function openArrival(point) {
  if (!arrivalModal) return;
  arrivalTitle.textContent = point.name;
  arrivalImg.src = point.image || "";
  arrivalImg.alt = point.name;
  arrivalText.textContent = point.info || "";
  openModal(arrivalModal);
}

function completeStop() {
  if (currentIndex >= activeRoute.length) return;
  const point = activeRoute[currentIndex];
  openArrival(point);

  arrivalNext.onclick = () => {
    closeModal(arrivalModal);
    advance();
  };
}

function advance() {
  currentIndex++;
  saveState();
  updateNextStopUI();

  if (currentIndex >= activeRoute.length) return;

  const pos = userMarker ? userMarker.getLatLng() : map.getCenter();
  drawRoute(pos.lat, pos.lng);
}

function skipStop() {
  if (currentIndex >= activeRoute.length) return;
  skipped++;
  advance();
}

function resetTour() {
  const ok = confirm("Reset this tour? This clears saved progress and custom order.");
  if (!ok) return;

  clearState();
  activeRoute = [...tourPoints];
  currentIndex = 0;
  skipped = 0;
  lastArrivalIndex = -1;
  lastArrivalTime = 0;

  updateNextStopUI();

  const pos = userMarker ? userMarker.getLatLng() : map.getCenter();
  drawRoute(pos.lat, pos.lng);
}

function shortestRoute() {
  if (!userMarker) {
    alert("Turn on location services first, then try again.");
    return;
  }
  const pos = userMarker.getLatLng();
  const donePart = activeRoute.slice(0, currentIndex);
  const remainingPart = activeRoute.slice(currentIndex);
  const sortedRemaining = nearestNeighbourSort(pos.lat, pos.lng, remainingPart);

  activeRoute = donePart.concat(sortedRemaining);
  saveState();
  updateNextStopUI();
  drawRoute(pos.lat, pos.lng);
}

// ---------- Custom order modal (tap Up/Down) ----------
function buildOrderList() {
  if (!orderList) return;
  orderList.innerHTML = "";

  const remaining = activeRoute.slice(currentIndex);
  remaining.forEach((p) => {
    const li = document.createElement("li");
    li.className = "order-item";
    li.dataset.name = p.name;

    li.innerHTML = `
      <span class="order-name">${p.name}</span>
      <div class="order-move">
        <button type="button" class="move-up" aria-label="Move up">▲</button>
        <button type="button" class="move-down" aria-label="Move down">▼</button>
      </div>
    `;

    li.querySelector(".move-up").addEventListener("click", () => {
      const prev = li.previousElementSibling;
      if (prev) orderList.insertBefore(li, prev);
    });

    li.querySelector(".move-down").addEventListener("click", () => {
      const next = li.nextElementSibling;
      if (next) orderList.insertBefore(next, li);
    });

    orderList.appendChild(li);
  });
}

function openCustomOrder() {
  buildOrderList();
  openModal(orderModal);
}

function saveCustomOrder() {
  if (!orderList) return;

  const donePart = activeRoute.slice(0, currentIndex);
  const remainingMap = new Map(activeRoute.slice(currentIndex).map(p => [p.name, p]));

  const names = [...orderList.querySelectorAll(".order-item")].map(li => li.dataset.name);
  const newRemaining = names.map(n => remainingMap.get(n)).filter(Boolean);

  activeRoute = donePart.concat(newRemaining);
  saveState();
  updateNextStopUI();

  if (userMarker) {
    const pos = userMarker.getLatLng();
    drawRoute(pos.lat, pos.lng);
  }

  closeModal(orderModal);
}

// ---------- Events ----------
arrivalClose?.addEventListener("click", () => closeModal(arrivalModal));
arrivalModal?.addEventListener("click", (e) => { if (e.target === arrivalModal) closeModal(arrivalModal); });

orderClose?.addEventListener("click", () => closeModal(orderModal));
orderCancel?.addEventListener("click", () => closeModal(orderModal));
orderModal?.addEventListener("click", (e) => { if (e.target === orderModal) closeModal(orderModal); });
orderSave?.addEventListener("click", saveCustomOrder);

document.getElementById("next-point-btn")?.addEventListener("click", completeStop);
document.getElementById("skipStopBtn")?.addEventListener("click", skipStop);
document.getElementById("resetTourBtn")?.addEventListener("click", resetTour);
document.getElementById("shortestRouteBtn")?.addEventListener("click", shortestRoute);
document.getElementById("customOrderBtn")?.addEventListener("click", openCustomOrder);

// ---------- Location tracking ----------
function startLocation() {
  if (!navigator.geolocation) return;

  navigator.geolocation.watchPosition(
    (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;

      if (!userMarker) {
        userMarker = L.marker([lat, lng], {
          icon: L.icon({
            iconUrl: "https://cdn-icons-png.flaticon.com/512/64/64113.png",
            iconSize: [40, 40],
            iconAnchor: [20, 40]
          })
        }).addTo(map).bindPopup("You are here");
      } else {
        userMarker.setLatLng([lat, lng]);
      }

      map.setView([lat, lng], 15);

      if (currentIndex < activeRoute.length) {
        drawRoute(lat, lng);

        const target = activeRoute[currentIndex];
        const dist = distanceMeters(lat, lng, target.coords[0], target.coords[1]);

        const now = Date.now();
        const cooldownOk =
          currentIndex !== lastArrivalIndex || (now - lastArrivalTime) > ARRIVAL_COOLDOWN_MS;

        if (dist <= ARRIVAL_RADIUS_METERS && cooldownOk) {
          lastArrivalIndex = currentIndex;
          lastArrivalTime = now;
          completeStop();
        }
      }
    },
    (err) => console.error("Geolocation error:", err),
    { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
  );
}

// ---------- Init ----------
function initMap() {
  map = L.map("map").setView([55.9533, -3.1883], 13);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors"
  }).addTo(map);

  tourPoints.forEach((p, i) => {
    L.marker(p.coords).addTo(map).bindPopup(`<b>${i + 1}. ${p.name}</b>`);
  });

  loadStateIfAny();
  updateNextStopUI();
  startLocation();
}

document.addEventListener("DOMContentLoaded", initMap);
