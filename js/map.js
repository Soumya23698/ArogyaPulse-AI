/**
 * map.js
 * Interactive National Health Grid Map of India powered by Leaflet.js
 * Displays Primary Health Centres (PHCs), CHCs, District Hospitals, and
 * active cross-district redistribution logistics corridors.
 */

let mapInstance = null;
let markersLayerGroup = null;
let redistributionArcsGroup = null;
let allFacilitiesCache = [];
let allMarkerInstances = [];

function initNationalMap(facilities) {
  allFacilitiesCache = facilities || [];
  const mapElement = document.getElementById("nationalMap");
  if (!mapElement) return;

  // Initialize Leaflet map if not already created
  if (!mapInstance) {
    try {
      mapInstance = L.map("nationalMap", {
        center: [22.5, 80.0],
        zoom: 5,
        minZoom: 4,
        maxZoom: 16,
        zoomControl: true,
        scrollWheelZoom: true
      });

      // Layer 1: OpenStreetMap Standard (Vibrant, high-contrast, fully visible roads & boundaries)
      const osmLayer = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      });

      // Layer 2: CartoDB Dark Matter (Cyber-Dark mode)
      const darkLayer = L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 19,
        subdomains: "abcd",
        attribution: '&copy; CartoDB &copy; OpenStreetMap'
      });

      // Layer 3: CartoDB Positron (Clean Light mode)
      const lightLayer = L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 19,
        subdomains: "abcd",
        attribution: '&copy; CartoDB'
      });

      // Set default base layer to OpenStreetMap for maximum clarity and visibility
      osmLayer.addTo(mapInstance);

      // Add Base Layer Switcher Control in top-right
      const baseMaps = {
        "🗺️ Standard Detailed (OSM)": osmLayer,
        "🌙 Cyber Dark (CartoDB)": darkLayer,
        "☀️ Light Clinical (CartoDB)": lightLayer
      };

      markersLayerGroup = L.layerGroup().addTo(mapInstance);
      redistributionArcsGroup = L.layerGroup().addTo(mapInstance);

      const overlayMaps = {
        "📍 Health Facilities (PHC/CHC/DH)": markersLayerGroup,
        "🚚 Redistribution Corridors": redistributionArcsGroup
      };

      L.control.layers(baseMaps, overlayMaps, { position: "topright" }).addTo(mapInstance);

    } catch (e) {
      console.error("Leaflet initialization error:", e);
    }
  }

  // Render facility markers
  renderFacilityMarkers(allFacilitiesCache);

  // Auto-fit to all facilities across India
  fitAllFacilities();

  // Trigger size invalidation to guarantee 100% visibility
  triggerMapResize();
}

function triggerMapResize() {
  if (!mapInstance) return;
  [50, 200, 500, 1000].forEach(delay => {
    setTimeout(() => {
      if (mapInstance) {
        mapInstance.invalidateSize();
      }
    }, delay);
  });
}

window.addEventListener("resize", () => {
  if (mapInstance) mapInstance.invalidateSize();
});

function fitAllFacilities() {
  if (!mapInstance || allMarkerInstances.length === 0) return;
  try {
    const group = L.featureGroup(allMarkerInstances);
    mapInstance.fitBounds(group.getBounds().pad(0.08));
  } catch (e) {
    console.warn("Could not fit map bounds:", e);
  }
}

window.fitAllFacilities = fitAllFacilities;

function renderFacilityMarkers(facilities) {
  if (!markersLayerGroup || !mapInstance) return;
  markersLayerGroup.clearLayers();
  allMarkerInstances = [];

  facilities.forEach(fac => {
    // Determine status color
    let statusClass = "optimal";
    let pinColor = "#10b981"; // Emerald
    let ringColor = "rgba(16, 185, 129, 0.4)";
    let pulseAnim = "";

    const hasCritical = fac.inventory && Object.values(fac.inventory).some(i => i.status === "CRITICAL");
    const hasWarning = fac.inventory && Object.values(fac.inventory).some(i => i.status === "WARNING");

    if (hasCritical) {
      statusClass = "critical";
      pinColor = "#ef4444"; // Crimson
      ringColor = "rgba(239, 68, 68, 0.6)";
      pulseAnim = "animation: pulse-ring 1.5s infinite;";
    } else if (hasWarning) {
      statusClass = "warning";
      pinColor = "#f59e0b"; // Saffron
      ringColor = "rgba(245, 158, 11, 0.5)";
      pulseAnim = "animation: pulse-ring 2.2s infinite;";
    }

    const isDH = fac.type === "DH";
    const isCHC = fac.type === "CHC";
    const size = isDH ? 34 : (isCHC ? 28 : 24);
    const label = isDH ? "DH" : (isCHC ? "CHC" : "PHC");

    // Vibrant custom SVG/HTML pin
    const customHtml = `
      <div style="
        position: relative;
        width: ${size}px;
        height: ${size}px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
      ">
        <!-- Outer pulsing halo -->
        <div style="
          position: absolute;
          width: ${size + 10}px;
          height: ${size + 10}px;
          border-radius: 50%;
          background: ${ringColor};
          ${pulseAnim}
        "></div>
        <!-- Inner solid badge -->
        <div style="
          position: relative;
          width: ${size}px;
          height: ${size}px;
          background: ${pinColor};
          border: 2px solid #ffffff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 10px rgba(0,0,0,0.5);
          font-family: 'Inter', sans-serif;
          font-weight: 800;
          font-size: ${isDH ? '11px' : (isCHC ? '9px' : '8px')};
          color: #ffffff;
          text-shadow: 0 1px 2px rgba(0,0,0,0.8);
        ">
          ${label}
        </div>
      </div>
    `;

    const icon = L.divIcon({
      html: customHtml,
      className: "custom-health-marker",
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -size / 2]
    });

    const marker = L.marker([fac.lat, fac.lng], { icon: icon });

    // Beds info
    const totBeds = fac.beds ? Object.values(fac.beds).reduce((acc, b) => acc + b.total, 0) : 0;
    const availBeds = fac.beds ? Object.values(fac.beds).reduce((acc, b) => acc + b.available, 0) : 0;
    const doctors = fac.staff && fac.staff.medical_officers ? fac.staff.medical_officers.present : 1;

    // Tooltip for quick hover inspection
    marker.bindTooltip(`
      <strong style="font-size:12px;">${fac.name}</strong> (${fac.type})<br>
      <span style="font-size:11px; color:#64748b;">${fac.district}, ${fac.state_code} &bull; Score: <strong style="color:${pinColor}">${fac.status_score}/100</strong></span>
    `, { direction: "top", offset: [0, -size / 2] });

    // Rich detailed popup
    const popupHtml = `
      <div style="min-width: 220px; font-family:'Inter', sans-serif;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px; gap:8px;">
          <strong style="color:#0f172a; font-size:13px;">${fac.name}</strong>
          <span style="background:#e0f2fe; color:#0284c7; font-size:10px; font-weight:800; padding:2px 8px; border-radius:4px; border:1px solid #bae6fd;">${fac.type}</span>
        </div>
        <div style="font-size:11px; color:#64748b; margin-bottom:8px;">${fac.district}, ${fac.state_code} &bull; PIN: ${fac.pincode}</div>
        <div style="background:#f8fafc; border:1px solid #e2e8f0; color:#334155; padding:8px 10px; border-radius:6px; font-size:11px; margin-bottom:10px; line-height:1.6;">
          <div><strong>MO In-Charge:</strong> ${fac.medical_officer_in_charge}</div>
          <div><strong>Beds Available:</strong> <span style="color:#059669; font-weight:800;">${availBeds}</span> of ${totBeds}</div>
          <div><strong>Doctors on Duty:</strong> ${doctors}</div>
          <div><strong>Operational Score:</strong> <strong style="color:${pinColor};">${fac.status_score}/100</strong></div>
        </div>
        <button onclick="window.inspectFacility('${fac.id}')" style="
          width: 100%;
          background: #0284c7;
          color: white;
          border: none;
          padding: 7px 10px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.2s;
        ">Inspect Full Telemetry & Inventory &rarr;</button>
      </div>
    `;

    marker.bindPopup(popupHtml);
    marker.on("click", () => {
      if (window.selectFacilityFromMap) {
        window.selectFacilityFromMap(fac.id);
      }
    });

    markersLayerGroup.addLayer(marker);
    allMarkerInstances.push(marker);
  });
}

function drawRedistributionArcs(recommendations) {
  if (!redistributionArcsGroup || !mapInstance) return;
  redistributionArcsGroup.clearLayers();

  recommendations.forEach(rec => {
    const latlngs = [
      [rec.source.lat, rec.source.lng],
      [rec.destination.lat, rec.destination.lng]
    ];

    const polyline = L.polyline(latlngs, {
      color: rec.cold_chain ? '#06b6d4' : '#f59e0b',
      weight: 3.5,
      opacity: 0.9,
      dashArray: '8, 8',
      lineCap: 'round'
    });

    polyline.bindTooltip(`
      <strong>Dispatch: ${rec.medicine_name}</strong><br>
      From: ${rec.source.name} &rarr; To: ${rec.destination.name}<br>
      Distance: ${rec.logistics.distance_km} km (${rec.logistics.est_transit_hours} hrs)
    `, { sticky: true });

    redistributionArcsGroup.addLayer(polyline);
  });
}

function zoomToRoute(lat1, lon1, lat2, lon2) {
  if (!mapInstance) return;
  const bounds = L.latLngBounds([lat1, lon1], [lat2, lon2]);
  mapInstance.fitBounds(bounds, { padding: [60, 60], maxZoom: 11 });
  triggerMapResize();
}

function filterMap(stateCode, facilityType, search) {
  let filtered = allFacilitiesCache;
  if (stateCode && stateCode !== "ALL") {
    filtered = filtered.filter(f => f.state_code === stateCode);
  }
  if (facilityType && facilityType !== "ALL") {
    filtered = filtered.filter(f => f.type === facilityType);
  }
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(f => 
      f.name.toLowerCase().includes(q) || 
      f.district.toLowerCase().includes(q) || 
      f.pincode.includes(q)
    );
  }
  renderFacilityMarkers(filtered);
  if (filtered.length > 0) {
    fitAllFacilities();
  }
}
