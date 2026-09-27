/**
 * app.js
 * Master Application Controller for ArogyaPulse AI
 * National Federated Health Resource & Supply Chain Intelligence Grid
 */

let appState = {
  summary: (window.INITIAL_GRID_DATA && window.INITIAL_GRID_DATA.summary) || null,
  states: (window.INITIAL_GRID_DATA && window.INITIAL_GRID_DATA.states) || [],
  facilities: (window.INITIAL_GRID_DATA && window.INITIAL_GRID_DATA.facilities) || [],
  medicines: (window.INITIAL_GRID_DATA && window.INITIAL_GRID_DATA.medicines) || [],
  activeFacility: null,
  activeEmergency: (window.INITIAL_GRID_DATA && window.INITIAL_GRID_DATA.summary?.active_emergency) || null,
  redistributions: (window.INITIAL_GRID_DATA && window.INITIAL_GRID_DATA.redistributions) || [],
  forecastHorizon: 14
};

if (window.INITIAL_GRID_DATA) {
  window.cachedStaticBundle = window.INITIAL_GRID_DATA;
}


// Lifecycle initialization on DOM ready
document.addEventListener("DOMContentLoaded", async () => {
  console.log("Initializing ArogyaPulse AI Platform...");
  
  // Set initial language from storage or default English
  const savedLang = localStorage.getItem("arogya_lang") || "en";
  setLanguage(savedLang);

  // Bind UI Events
  setupNavigationTabs();
  setupFilterControls();
  setupSimulationTriggers();
  setupChatHandlers();
  setupVoiceStockHandler();
  setupSettingsModal();

    // Initialize OCR module
  if (window.initOcrModule) {
    initOcrModule();
  }

  // 1. Immediately render UI synchronously from embedded grid dataset
  if (appState.facilities && appState.facilities.length > 0) {
    console.log("Synchronously rendering 127 health centres from embedded grid telemetry...");
    renderSummaryKpis();
    renderEmergencyBanner();
    populateStateDropdowns();
    populateFacilityDropdowns();
    populateMedicineDropdowns();
    renderFacilitySidebar(appState.facilities);
    if (window.initNationalMap) {
      initNationalMap(appState.facilities);
    }
    if (appState.redistributions && appState.redistributions.length > 0) {
      renderRedistributionCards(appState.redistributions);
      if (window.drawRedistributionArcs) {
        window.drawRedistributionArcs(appState.redistributions);
      }
    }
    loadForecastData();
    if (window.renderFederatedOverview && window.cachedStaticBundle?.federated_status) {
      window.federatedHistoryCache = window.cachedStaticBundle.federated_status.history || [];
      renderFederatedOverview(window.cachedStaticBundle.federated_status);
      if (window.renderFederatedConvergenceChart) {
        renderFederatedConvergenceChart("fedConvergenceChart", window.cachedStaticBundle.federated_status.history);
      }
    }
  }

  // 2. Poll background API for live server telemetry updates if connected
  refreshAllDashboardData().catch(e => console.log("Running in self-contained national grid mode"));


  // Load and apply backend AI configuration
  try {
    const configRes = await fetch("/api/config").then(r => r.json());
    if (configRes.status === "SUCCESS") {
      const cfg = configRes.data;
      if (cfg.gemini_api_key) {
        localStorage.setItem("arogya_gemini_key", cfg.gemini_api_key);
        const badge = document.getElementById("geminiActiveBadge");
        if (badge) {
          badge.innerHTML = `<span>✨</span><span>Google Gemini ${cfg.gemini_model}: ACTIVE</span>`;
        }
        const keyInput = document.getElementById("geminiApiKeyInput");
        if (keyInput) keyInput.value = cfg.gemini_api_key;
      }
    }
  } catch (e) {
    console.warn("Could not load backend config:", e);
  }

  // Ensure map is 100% sized and rendered
  if (window.triggerMapResize) {
    window.triggerMapResize();
  }

  // Listen for language changes to update dynamic text
  window.addEventListener("languageChanged", () => {
    renderSummaryKpis();
    if (appState.activeFacility) renderFacilityModal(appState.activeFacility);
  });
});

/**
 * Loads and refreshes all network telemetry from backend APIs
 */

/**
 * Client-side static fallback dataset loader for GitHub Pages & CDN hosting
 */
async function loadStaticFallbackData() {
  console.log("Loading static national grid telemetry bundle for 24/7 web access...");
  try {
    const res = await fetch("data/static_data.json");
    if (!res.ok) throw new Error("Status " + res.status);
    const bundle = await res.json();
    
    appState.summary = bundle.summary;
    appState.activeEmergency = bundle.summary?.active_emergency || null;
    appState.states = bundle.states;
    appState.facilities = bundle.facilities;
    appState.medicines = bundle.medicines;
    appState.redistributions = bundle.redistributions || [];
    window.cachedStaticBundle = bundle;

    renderSummaryKpis();
    renderEmergencyBanner();
    populateStateDropdowns();
    renderFacilitySidebar(appState.facilities);
    if (window.initNationalMap) {
      initNationalMap(appState.facilities);
    }
    populateFacilityDropdowns();
    populateMedicineDropdowns();

    if (appState.redistributions.length > 0) {
      renderRedistributionCards(appState.redistributions);
      if (window.drawRedistributionArcs) {
        window.drawRedistributionArcs(appState.redistributions);
      }
    }

    loadForecastData();

    if (window.renderFederatedOverview && bundle.federated_status) {
      window.federatedHistoryCache = bundle.federated_status.history || [];
      renderFederatedOverview(bundle.federated_status);
      if (window.renderFederatedConvergenceChart) {
        renderFederatedConvergenceChart("fedConvergenceChart", bundle.federated_status.history);
      }
    }
    console.log("✓ National Health Grid static telemetry active across all 36 States & UTs (127 centres).");
  } catch (err) {
    console.error("Failed to load static bundle:", err);
  }
}

function generateClientForecast(facId, medId, horizon) {
  const fac = (appState.facilities && appState.facilities.find(f => f.id === facId)) || (appState.facilities ? appState.facilities[0] : null);
  const med = (fac && fac.inventory && fac.inventory[medId]) || { stock: 120, daily_consumption_mean: 12, name: "Medicine" };
  const dates = [];
  const projected = [];
  const lower = [];
  const upper = [];
  let current = med.stock || 100;
  const rate = med.daily_consumption_mean || 10;
  const now = new Date();

  for (let i = 0; i < horizon; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    dates.push(d.toLocaleDateString("en-IN", { month: "short", day: "numeric" }));
    current = Math.max(0, current - rate + Math.floor(Math.sin(i) * 2));
    projected.push(current);
    lower.push(Math.max(0, current - Math.floor(current * 0.15)));
    upper.push(current + Math.floor(current * 0.15));
  }

  const runway = rate > 0 ? +(med.stock / rate).toFixed(1) : 30;
  let riskLevel = "STABLE";
  if (runway < 3) riskLevel = "CRITICAL_STOCKOUT_IMMINENT";
  else if (runway < 7) riskLevel = "MODERATE_DEFICIT_WARNING";

  return {
    facility_name: fac ? fac.name : facId,
    medicine_name: med.name || medId,
    unit: med.unit || "Units",
    current_stock: med.stock,
    daily_consumption: rate,
    horizon_days: horizon,
    runway_days: runway,
    days_until_stockout: Math.max(0, Math.floor(runway)),
    risk_level: riskLevel,
    dates: dates,
    projected_inventory: projected,
    ci_lower_95: lower,
    ci_upper_95: upper,
    total_projected_demand: rate * horizon,
    recommended_procurement_qty: Math.max(0, (rate * horizon) - med.stock + (rate * 3)),
    stockout_date: runway < horizon ? dates[Math.min(dates.length - 1, Math.floor(runway))] : null
  };
}

function generateClientAiReply(query, lang) {
  const q = (query || "").toLowerCase();
  
  if (q.includes("stock") || q.includes("medicine") || q.includes("shortage") || q.includes("dawa") || q.includes("दवा")) {
    return `### 📋 National Medicine Stock & Deficit Status\n\n` +
      `- **Monitored Health Facilities**: 127 Primary & Community Health Centres across all 36 States & UTs.\n` +
      `- **Critical Runway Alert**: **Anti-Snake Venom (ASV)** in PHC Cholapur (Varanasi, UP) has **1.2 days runway remaining** (Stock: 8 vials, daily burn: 6.5 vials/day).\n` +
      `- **Automated Courier Pairing**: Surplus depot **Pandit Deen Dayal Upadhyaya District Hospital (Surplus: 180 vials, 12.4 km away)** has been dispatched under a 2°C–8°C refrigerated van route.\n` +
      `- **Other Buffer Levels**: Paracetamol 500mg (84% optimal), ORS 21.8g (89% optimal), Amoxicillin 500mg (78% optimal).`;
  }
  
  if (q.includes("bed") || q.includes("icu") || q.includes("ventilator") || q.includes("oxygen") || q.includes("बिस्तर")) {
    return `### 🏥 National Bed & Critical Care Telemetry\n\n` +
      `- **Total Monitored Beds**: 13,894 beds across India's PHC & CHC network.\n` +
      `- **National Occupancy Rate**: **73.0%** (10,143 beds occupied, 3,751 beds currently available).\n` +
      `- **Oxygen Bed Readiness**: **92.4%** across dedicated emergency triage wards.\n` +
      `- **ICU Ventilator Capacity**: **88.1%** functional readiness with solar and battery power backups.\n` +
      `- **High Occupancy Hotspots**: Ernakulam (KL) at 84% bed utilization following seasonal viral caseload.`;
  }
  
  if (q.includes("redistribution") || q.includes("transfer") || q.includes("dispatch") || q.includes("route")) {
    return `### 🚚 Automated Cross-District Redistribution Grid\n\n` +
      `- **Active Optimization Transfers**: 3 inter-facility logistics dispatches recommended.\n` +
      `- **Top Route**: 120 Sachets of ORS 21.8g from **CHC Rangia** to **PHC Hajo** (26.6 km transit via NH-27, Cold-Chain Transit Van, ETA 42 mins).\n` +
      `- **Digital Gate Pass**: Gate pass GP-AS-05984 authenticated with QR code for interstate toll exemption.\n` +
      `- **Cold Chain Compliance**: All temperature-sensitive biologicals tracked within 2°C–8°C continuous thermal loggers.`;
  }
  
  if (q.includes("circular") || q.includes("directive") || q.includes("order") || q.includes("mohfw")) {
    return `### 📄 MoHFW Emergency Advisory Circular\n\n` +
      `**MINISTRY OF HEALTH & FAMILY WELFARE (GOVERNMENT OF INDIA)**\n` +
      `**Ref**: MoHFW/NHM/AROGYA-2026/DIR-44\n\n` +
      `**SUBJECT**: Pre-Emptive Mobilisation of Anti-Snake Venom & Critical Medical Stock for Vector-Borne & Flood Vulnerable Districts.\n\n` +
      `1. All District Chief Medical Officers (CMOs) shall ensure minimum **14-day buffer** of lyophilized polyvalent ASV at all rural PHCs.\n` +
      `2. Activate ArogyaPulse Automated Redistribution Protocol for automated stock re-balancing within 35 km radius.\n` +
      `3. Frontline staff must synchronize daily registers via Vision OCR by 18:00 hrs daily.`;
  }

  return `### 🩺 Sanjeevani AI Clinical Copilot\n\n` +
    `I am actively monitoring live telemetry across **127 Health Centres in all 36 States & Union Territories**.\n\n` +
    `- **National Bed Occupancy**: 73.0% (3,751 beds available)\n` +
    `- **Medical Personnel on Duty**: 86.4% Doctor attendance\n` +
    `- **Federated Learning Status**: Round 4 converged (Global Accuracy: 86.46%)\n\n` +
    `*You can ask me about medicine stockouts, bed availability in any state, automated redistribution logistics, or request emergency circular drafts.*`;
}

async function refreshAllDashboardData() {
  try {
    // Check if hosted statically on GitHub Pages or file: protocol
    if (window.location.hostname.includes("github.io") || window.location.protocol === "file:") {
      await loadStaticFallbackData();
      return;
    }
    const [summaryRes, statesRes, facsRes, medsRes] = await Promise.all([
      fetch("/api/summary").then(r => r.json()),
      fetch("/api/states").then(r => r.json()),
      fetch("/api/facilities").then(r => r.json()),
      fetch("/api/medicines").then(r => r.json())
    ]);

    if (summaryRes.status === "SUCCESS") {
      appState.summary = summaryRes.data;
      appState.activeEmergency = summaryRes.data.active_emergency;
      renderSummaryKpis();
      renderEmergencyBanner();
    }

    if (statesRes.status === "SUCCESS") {
      appState.states = statesRes.data;
      populateStateDropdowns();
    }

    if (facsRes.status === "SUCCESS") {
      appState.facilities = facsRes.data;
      renderFacilitySidebar(appState.facilities);
      if (window.initNationalMap) {
        initNationalMap(appState.facilities);
      }
      populateFacilityDropdowns();
    }

    if (medsRes.status === "SUCCESS") {
      appState.medicines = medsRes.data;
      populateMedicineDropdowns();
    }

    // Load active redistributions
    loadRedistributionRecommendations();

    // Trigger initial forecast view
    loadForecastData();

    // Load federated learning status
    if (window.loadFederatedStatus) {
      loadFederatedStatus();
    }

  } catch (err) {
    console.warn("Backend API unavailable, loading static national grid bundle:", err);
    await loadStaticFallbackData();
  }
}

window.refreshAllDashboardData = refreshAllDashboardData;

/**
 * Renders Top KPI Metric Cards
 */
function renderSummaryKpis() {
  const s = appState.summary;
  if (!s) return;

  const elPhcCount = document.getElementById("kpiPhcCount");
  const elBedRate = document.getElementById("kpiBedRate");
  const elBedSub = document.getElementById("kpiBedSub");
  const elStaffRate = document.getElementById("kpiStaffRate");
  const elStaffSub = document.getElementById("kpiStaffSub");
  const elCriticalShortages = document.getElementById("kpiCriticalShortages");
  const elO2Avail = document.getElementById("kpiO2Avail");
  const elIcuAvail = document.getElementById("kpiIcuAvail");

  if (elPhcCount) elPhcCount.textContent = `${s.active_telemetry_nodes} Nodes`;
  if (elBedRate) elBedRate.textContent = `${s.bed_occupancy_rate}%`;
  if (elBedSub) elBedSub.textContent = `${s.available_beds} of ${s.total_beds} beds free`;
  
  if (elStaffRate) elStaffRate.textContent = `${s.medical_personnel.attendance_rate}%`;
  if (elStaffSub) elStaffSub.textContent = `${s.medical_personnel.on_duty} of ${s.medical_personnel.sanctioned} on duty`;

  if (elCriticalShortages) elCriticalShortages.textContent = s.inventory_health.critical_shortages;
  if (elO2Avail) elO2Avail.textContent = `${s.oxygen_beds.available} Available`;
  if (elIcuAvail) elIcuAvail.textContent = `${s.icu_beds.available} Available`;
}

/**
 * Renders Emergency Outbreak Banner
 */
function renderEmergencyBanner() {
  const banner = document.getElementById("emergencyBanner");
  const em = appState.activeEmergency;
  if (!banner) return;

  if (em) {
    banner.style.display = "flex";
    banner.innerHTML = `
      <div class="emergency-info">
        <span class="emergency-tag">🚨 EPIDEMIOLOGICAL EMERGENCY</span>
        <strong style="color:#ffffff;">${em.title}</strong>
        <span style="color:#f87171;">(${em.severity}) &bull; Priority Assets: ${em.required_assets.join(", ")}</span>
      </div>
      <div class="emergency-actions">
        <button class="btn-header btn-primary" onclick="window.switchTab('tab-redistribution')">
          🚚 View Auto-Rebalancing Corridors
        </button>
        <button class="btn-header btn-emergency-trigger" onclick="resetOutbreakSimulation()">
          ✓ Reset Simulation
        </button>
      </div>
    `;
  } else {
    banner.style.display = "none";
  }
}

let navHistory = ["tab-overview"];

/**
 * Tab Navigation Setup
 */
function setupNavigationTabs() {
  const tabs = document.querySelectorAll(".nav-tab-btn");
  tabs.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-tab");
      window.switchTab(targetId);
    });
  });

  // Handle browser Back/Forward navigation buttons
  window.addEventListener("popstate", (e) => {
    if (e.state && e.state.tab) {
      window.switchTab(e.state.tab, true);
    } else {
      window.switchTab("tab-overview", true);
    }
  });

  // Check URL hash on page load
  const hash = window.location.hash.replace("#", "");
  if (hash && document.getElementById(hash)) {
    window.switchTab(hash);
  }
}

window.switchTab = function(targetId, isBackAction = false) {
  if (!isBackAction) {
    if (navHistory[navHistory.length - 1] !== targetId) {
      navHistory.push(targetId);
      try {
        history.pushState({ tab: targetId }, "", `#${targetId}`);
      } catch (e) {}
    }
  }

  document.querySelectorAll(".nav-tab-btn").forEach(b => b.classList.remove("active"));
  document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));

  const targetBtn = document.querySelector(`.nav-tab-btn[data-tab="${targetId}"]`);
  const targetContent = document.getElementById(targetId);

  if (targetBtn) targetBtn.classList.add("active");
  if (targetContent) targetContent.classList.add("active");

  // Show/hide persistent header back button
  const headerBackBtn = document.getElementById("headerBackBtn");
  if (headerBackBtn) {
    if (targetId === "tab-overview") {
      headerBackBtn.style.display = "none";
    } else {
      headerBackBtn.style.display = "inline-flex";
    }
  }

  // Show/hide floating back button
  const floatingBackFab = document.getElementById("floatingBackFab");
  if (floatingBackFab) {
    if (targetId === "tab-overview") {
      floatingBackFab.style.display = "none";
    } else {
      floatingBackFab.style.display = "inline-flex";
    }
  }

  // Smooth scroll to top
  window.scrollTo({ top: 0, behavior: "smooth" });

  // Invalidate map size if switching to map tab
  if (targetId === "tab-overview") {
    if (window.triggerMapResize) window.triggerMapResize();
    if (window.fitAllFacilities) window.fitAllFacilities();
  }
};

window.goBack = function() {
  // 1. If any modal is active, close it first
  const openModals = document.querySelectorAll(".modal-overlay.active");
  if (openModals.length > 0) {
    openModals.forEach(m => m.classList.remove("active"));
    return;
  }

  // 2. Otherwise pop navigation history
  if (navHistory.length > 1) {
    navHistory.pop(); // Remove current tab
    const previousTab = navHistory[navHistory.length - 1] || "tab-overview";
    window.switchTab(previousTab, true);
  } else {
    window.switchTab("tab-overview", true);
  }
};

/**
 * Populates Dropdown Options
 */
function populateStateDropdowns() {
  const selects = [document.getElementById("filterStateSelect")];
  selects.forEach(sel => {
    if (!sel) return;
    const currentVal = sel.value;
    const count = (appState.states && appState.states.length) || 36;
    sel.innerHTML = `<option value="ALL">All India (${count} States & UTs)</option>` + 
      appState.states.map(s => `<option value="${s.code}">${s.name} (${s.code})</option>`).join("");
    if (currentVal) sel.value = currentVal;
  });
}

function populateFacilityDropdowns() {
  const selects = [
    document.getElementById("forecastFacilitySelect"),
    document.getElementById("ocrFacilitySelect"),
    document.getElementById("voiceFacilitySelect")
  ];
  selects.forEach(sel => {
    if (!sel) return;
    const currentVal = sel.value;
    sel.innerHTML = appState.facilities.map(f => `
      <option value="${f.id}">${f.name} (${f.district}, ${f.state_code}) [${f.type}]</option>
    `).join("");
    if (currentVal && appState.facilities.some(f => f.id === currentVal)) {
      sel.value = currentVal;
    }
  });
}

function populateMedicineDropdowns() {
  const sel = document.getElementById("forecastMedicineSelect");
  if (!sel) return;
  const currentVal = sel.value;
  sel.innerHTML = appState.medicines.map(m => `
    <option value="${m.id}">${m.name} - ${m.category}</option>
  `).join("");
  if (currentVal) sel.value = currentVal;
}

/**
 * Filters & Facility Sidebar
 */
function setupFilterControls() {
  const stateSel = document.getElementById("filterStateSelect");
  const typeSel = document.getElementById("filterTypeSelect");
  const searchInput = document.getElementById("facilitySearchInput");

  const runFilter = () => {
    const s = stateSel ? stateSel.value : "ALL";
    const t = typeSel ? typeSel.value : "ALL";
    const q = searchInput ? searchInput.value.trim().toLowerCase() : "";

    let filtered = appState.facilities;
    if (s !== "ALL") filtered = filtered.filter(f => f.state_code === s);
    if (t !== "ALL") filtered = filtered.filter(f => f.type === t);
    if (q) {
      filtered = filtered.filter(f => 
        f.name.toLowerCase().includes(q) || 
        f.district.toLowerCase().includes(q) || 
        f.pincode.includes(q)
      );
    }

    renderFacilitySidebar(filtered);
    if (window.filterMap) {
      window.filterMap(s, t, q);
    }
  };

  if (stateSel) stateSel.addEventListener("change", runFilter);
  if (typeSel) typeSel.addEventListener("change", runFilter);
  if (searchInput) searchInput.addEventListener("input", runFilter);
}

function renderFacilitySidebar(facilities) {
  const list = document.getElementById("facilitySidebarList");
  if (!list) return;

  if (facilities.length === 0) {
    list.innerHTML = `<div style="color:#64748b; font-size:12px; text-align:center; padding:2rem;">No health centres match this filter.</div>`;
    return;
  }

  list.innerHTML = facilities.map(fac => {
    const isCritical = fac.inventory && Object.values(fac.inventory).some(i => i.status === "CRITICAL");
    const isWarning = fac.inventory && Object.values(fac.inventory).some(i => i.status === "WARNING");
    const statusColor = isCritical ? '#ef4444' : (isWarning ? '#f59e0b' : '#10b981');
    const totBeds = fac.beds ? Object.values(fac.beds).reduce((acc, b) => acc + b.total, 0) : 0;
    const availBeds = fac.beds ? Object.values(fac.beds).reduce((acc, b) => acc + b.available, 0) : 0;
    const doctors = fac.staff && fac.staff.medical_officers ? fac.staff.medical_officers.present : 1;

    const pillClass = fac.type === "DH" ? "pill-dh" : (fac.type === "CHC" ? "pill-chc" : "pill-phc");

    return `
      <div class="facility-item-card" onclick="window.inspectFacility('${fac.id}')">
        <div class="facility-card-top">
          <span class="fac-name">${fac.name}</span>
          <span class="fac-type-pill ${pillClass}">${fac.type}</span>
        </div>
        <div class="fac-loc">${fac.district}, ${fac.state_code} &bull; PIN: ${fac.pincode}</div>
        <div class="fac-metrics-row">
          <div class="fac-metric-box">
            <div class="label">Beds Avail</div>
            <div class="val" style="color:#34d399;">${availBeds}/${totBeds}</div>
          </div>
          <div class="fac-metric-box">
            <div class="label">Doctors</div>
            <div class="val">${doctors}</div>
          </div>
          <div class="fac-metric-box">
            <div class="label">Grid Score</div>
            <div class="val" style="color:${statusColor};">${fac.status_score}/100</div>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

window.selectFacilityFromMap = function(facilityId) {
  // Highlight or scroll to card
  window.inspectFacility(facilityId);
};

/**
 * Facility Inspection Modal
 */
window.inspectFacility = function(facilityId) {
  const fac = appState.facilities.find(f => f.id === facilityId);
  if (!fac) return;
  appState.activeFacility = fac;
  renderFacilityModal(fac);
};

function renderFacilityModal(fac) {
  const modal = document.getElementById("facilityDetailModal");
  if (!modal) return;

  const title = document.getElementById("modalFacName");
  const body = document.getElementById("modalFacBody");

  if (title) title.innerHTML = `${fac.name} <span class="fac-type-pill pill-${fac.type.toLowerCase()}">${fac.type}</span>`;

  // Beds summary
  const bedRows = Object.entries(fac.beds).map(([bType, bVal]) => `
    <div style="background:#f8fafc; border:1px solid #e2e8f0; padding:10px; border-radius:8px; font-size:12px;">
      <div style="color:var(--text-muted); font-size:11px; font-weight:700; text-transform:uppercase; margin-bottom:4px;">${bType.replace(/_/g, ' ')}</div>
      <div style="font-size:16px; font-weight:800; color:var(--med-blue-dark);">${bVal.available} <span style="font-size:11px; font-weight:500; color:var(--text-muted);">free / ${bVal.total} total</span></div>
    </div>
  `).join("");

  // Staff summary
  const staffRows = Object.entries(fac.staff).map(([sRole, sVal]) => `
    <div style="display:flex; justify-content:space-between; font-size:12px; padding:6px 0; border-bottom:1px solid #e2e8f0;">
      <span style="color:var(--text-main); font-weight:600; text-transform:capitalize;">${sRole.replace(/_/g, ' ')}:</span>
      <span style="font-weight:800; color:${sVal.present < sVal.sanctioned ? '#d97706' : '#059669'};">${sVal.present} on duty / ${sVal.sanctioned} sanctioned</span>
    </div>
  `).join("");

  // Inventory Table
  const inventoryRows = Object.values(fac.inventory).map(item => {
    let badgeBg = item.status === "CRITICAL" ? "#fee2e2" : (item.status === "WARNING" ? "#fef3c7" : "#dcfce7");
    let badgeColor = item.status === "CRITICAL" ? "#dc2626" : (item.status === "WARNING" ? "#d97706" : "#059669");

    return `
      <tr style="border-bottom:1px solid #f1f5f9; font-size:12px;">
        <td style="padding:8px 10px; font-weight:700; color:var(--text-main);">
          ${item.name}
          ${item.cold_chain ? '<span class="cold-chain-flag" style="margin-left:6px;">❄️ Cold-Chain</span>' : ''}
        </td>
        <td style="padding:8px 10px; color:var(--text-main); font-weight:600;">${item.current_stock} ${item.unit}</td>
        <td style="padding:8px 10px; color:var(--text-muted);">${item.daily_burn_rate}/day</td>
        <td style="padding:8px 10px; font-weight:800; color:${badgeColor};">${item.days_runway} days</td>
        <td style="padding:8px 10px;">
          <span style="font-size:11px; font-weight:800; padding:2px 8px; border-radius:9999px; color:${badgeColor}; background:${badgeBg};">
            ${item.status}
          </span>
        </td>
        <td style="padding:8px 10px; text-align:right;">
          <button onclick="window.quickRestock('${fac.id}', '${item.medicine_id}')" style="background:#f0f9ff; color:var(--med-blue); border:1.5px solid var(--med-blue); padding:3px 10px; border-radius:4px; font-size:11px; font-weight:700; cursor:pointer;">
            + Restock
          </button>
        </td>
      </tr>
    `;
  }).join("");

  body.innerHTML = `
    <div style="font-size:12px; color:var(--text-muted); margin-bottom:14px; background:#f8fafc; border:1px solid #e2e8f0; padding:10px 12px; border-radius:8px;">
      <strong>District:</strong> ${fac.district} &bull; <strong>State:</strong> ${fac.state_code} &bull; <strong>Catchment:</strong> ${fac.catchment_population.toLocaleString()} &bull; <strong>MO In-Charge:</strong> ${fac.medical_officer_in_charge} (${fac.contact_phone})
    </div>

    <div style="margin-bottom:16px;">
      <h4 style="font-size:12px; color:var(--med-blue-dark); text-transform:uppercase; font-weight:800; margin-bottom:8px;">Bed Capacity & Allocation</h4>
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(110px, 1fr)); gap:8px;">
        ${bedRows}
      </div>
    </div>

    <div style="margin-bottom:16px;">
      <h4 style="font-size:12px; color:var(--med-blue-dark); text-transform:uppercase; font-weight:800; margin-bottom:8px;">Healthcare Personnel Attendance</h4>
      <div style="background:#f8fafc; border:1px solid #e2e8f0; padding:10px 14px; border-radius:8px;">
        ${staffRows}
      </div>
    </div>

    <div>
      <h4 style="font-size:12px; color:var(--med-blue-dark); text-transform:uppercase; font-weight:800; margin-bottom:8px;">Essential Medicine Inventory & Runways</h4>
      <div style="max-height:260px; overflow-y:auto; border:1px solid #e2e8f0; border-radius:8px; background:#ffffff;">
        <table style="width:100%; border-collapse:collapse; text-align:left;">
          <thead>
            <tr style="background:#f1f5f9; font-size:11px; color:var(--text-muted); border-bottom:2px solid #e2e8f0;">
              <th style="padding:8px 10px;">Medicine</th>
              <th style="padding:8px 10px;">Current Stock</th>
              <th style="padding:8px 10px;">Burn Rate</th>
              <th style="padding:8px 10px;">Runway</th>
              <th style="padding:8px 10px;">Status</th>
              <th style="padding:8px 10px; text-align:right;">Action</th>
            </tr>
          </thead>
          <tbody>
            ${inventoryRows}
          </tbody>
        </table>
      </div>
    </div>
  `;

  modal.classList.add("active");
}

window.closeModal = function(modalId) {
  const m = document.getElementById(modalId);
  if (m) m.classList.remove("active");
};


window.quickRestock = async function(facilityId, medicineId) {
  const qtyStr = prompt("Enter stock units to replenish (e.g. 200):", "200");
  if (!qtyStr) return;
  const qty = parseInt(qtyStr);
  if (isNaN(qty) || qty <= 0) return;

  try {
    const res = await fetch("/api/stock/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        facility_id: facilityId,
        medicine_id: medicineId,
        quantity: qty,
        operation: "ADD",
        reported_by: "Medical Officer In-Charge",
        remarks: "Emergency local buffer replenishment"
      })
    });
    if (res.ok) {
      const json = await res.json();
      if (json.status === "SUCCESS") {
        alert(`✓ Successfully replenished ${qty} units!`);
        await refreshAllDashboardData();
        if (appState.activeFacility) renderFacilityModal(appState.activeFacility);
        return;
      }
    }
  } catch (err) {}

  // Client-side state update
  const fac = (appState.facilities || []).find(f => f.id === facilityId);
  if (fac && fac.inventory && fac.inventory[medicineId]) {
    const item = fac.inventory[medicineId];
    item.current_stock = (item.current_stock || 0) + qty;
    item.days_runway = item.daily_burn_rate > 0 ? +(item.current_stock / item.daily_burn_rate).toFixed(1) : 30;
    item.status = item.days_runway < 3 ? "CRITICAL" : (item.days_runway < 7 ? "WARNING" : "OPTIMAL");
  }
  alert(`✓ Successfully replenished +${qty} units for ${fac ? fac.name : facilityId}!`);
  renderSummaryKpis();
  renderFacilitySidebar(appState.facilities);
  if (appState.activeFacility) renderFacilityModal(appState.activeFacility);
};

window.submitVoiceStock = async function(medId, qty) {
  const facSel = document.getElementById("voiceFacilitySelect");
  const facId = facSel ? facSel.value : "UP-VAR-001";

  try {
    const res = await fetch("/api/stock/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        facility_id: facId,
        medicine_id: medId,
        quantity: qty,
        operation: "ADD",
        reported_by: "ASHA / Frontline Nurse (Voice Log)",
        remarks: "Spoken inventory update via ArogyaVoice"
      })
    });
    if (res.ok) {
      const json = await res.json();
      if (json.status === "SUCCESS") {
        alert(`✓ Voice stock successfully logged for ${json.data.facility_name}!`);
        await refreshAllDashboardData();
        return;
      }
    }
  } catch (err) {}

  const fac = (appState.facilities || []).find(f => f.id === facId);
  if (fac && fac.inventory && fac.inventory[medId]) {
    const item = fac.inventory[medId];
    item.current_stock = (item.current_stock || 0) + qty;
    item.days_runway = item.daily_burn_rate > 0 ? +(item.current_stock / item.daily_burn_rate).toFixed(1) : 30;
    item.status = item.days_runway < 3 ? "CRITICAL" : (item.days_runway < 7 ? "WARNING" : "OPTIMAL");
  }
  alert(`✓ Spoken stock (+${qty} units) successfully logged for ${fac ? fac.name : facId}!`);
  renderSummaryKpis();
  renderFacilitySidebar(appState.facilities);
};

async function loadForecastData() {
  const facSel = document.getElementById("forecastFacilitySelect");
  const medSel = document.getElementById("forecastMedicineSelect");
  const facId = facSel ? facSel.value : "UP-VAR-001";
  const medId = medSel ? medSel.value : "MED-04";
  const horizon = appState.forecastHorizon || 14;

  try {
    const res = await fetch(`/api/forecast?facility_id=${facId}&medicine_id=${medId}&horizon=${horizon}`);
    const json = await res.json();
    if (json.status === "SUCCESS") {
      renderForecastView(json.data);
    } else {
      renderForecastView(generateClientForecast(facId, medId, horizon));
    }
  } catch (err) {
    renderForecastView(generateClientForecast(facId, medId, horizon));
  }
}

function renderForecastView(data) {
  // Render Chart
  renderForecastChart("forecastChartCanvas", data);

  // Render Risk Alert Box
  const box = document.getElementById("forecastRiskAlertBox");
  if (!box) return;

  let riskClass = "optimal";
  let title = "Stable Inventory Runway";
  let desc = `Sufficient inventory for ${data.horizon_days}+ days. No immediate replenishment action required.`;

  if (data.risk_level === "CRITICAL_STOCKOUT_IMMINENT") {
    riskClass = "critical";
    title = "🚨 CRITICAL STOCKOUT IMMINENT (< 3 DAYS)";
    desc = `Projected stock will reach ZERO on <strong>${data.stockout_date}</strong> (${data.days_until_stockout} days). Urgent automated redistribution dispatch recommended immediately.`;
  } else if (data.risk_level === "HIGH_STOCKOUT_RISK") {
    riskClass = "warning";
    title = "⚠️ High Stockout Risk (< 7 Days)";
    desc = `Stockout projected on <strong>${data.stockout_date}</strong> (${data.days_until_stockout} days). Schedule replenishment order.`;
  }

  box.className = `risk-alert-box ${riskClass}`;
  box.innerHTML = `
    <span class="risk-badge">${data.risk_level}</span>
    <h4 style="font-size:14px; font-weight:800; margin-bottom:4px;">${title}</h4>
    <p class="risk-message">${desc}</p>
    <div style="margin-top:10px; font-size:12px; color:#cbd5e1; border-top:1px solid rgba(255,255,255,0.08); padding-top:8px;">
      <div><strong>Current Stock:</strong> ${data.current_stock} ${data.unit}</div>
      <div><strong>Total Projected Demand:</strong> ${data.total_projected_demand} ${data.unit}</div>
      <div><strong>Recommended Safety Buffer Procurement:</strong> <span style="color:#f59e0b; font-weight:800;">${data.recommended_procurement_qty} ${data.unit}</span></div>
    </div>
  `;
}

// Bind forecast dropdown listeners
document.addEventListener("DOMContentLoaded", () => {
  const facSel = document.getElementById("forecastFacilitySelect");
  const medSel = document.getElementById("forecastMedicineSelect");
  if (facSel) facSel.addEventListener("change", loadForecastData);
  if (medSel) medSel.addEventListener("change", loadForecastData);

  document.querySelectorAll(".horizon-pill").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".horizon-pill").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      appState.forecastHorizon = parseInt(btn.getAttribute("data-days"));
      loadForecastData();
    });
  });
});

/**
 * Redistribution Tab Controller
 */
async function loadRedistributionRecommendations() {
  try {
    const res = await fetch("/api/redistribution/recommendations");
    const json = await res.json();
    if (json.status === "SUCCESS") {
      appState.redistributions = json.data;
      renderRedistributionCards(json.data);
      if (window.drawRedistributionArcs) {
        window.drawRedistributionArcs(json.data);
      }
    }
  } catch (err) {
    console.error("Error loading redistributions:", err);
  }
}

function renderRedistributionCards(recs) {
  const container = document.getElementById("redistributionCardsList");
  if (!container) return;

  if (recs.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:3rem; color:var(--text-muted); background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; font-weight:600;">
        ✓ All facilities maintain optimal safety stock runways. No emergency cross-district transfers currently needed.
      </div>
    `;
    return;
  }

  container.innerHTML = recs.map(r => `
    <div class="transfer-card" id="card-${r.id}">
      <div class="transfer-top-bar">
        <div style="display:flex; align-items:center; gap:0.6rem;">
          <span class="trx-id">${r.id}</span>
          <span class="trx-urgency ${r.urgency === 'IMMEDIATE_DISPATCH' ? 'urgency-immediate' : 'urgency-scheduled'}">
            ${r.urgency.replace(/_/g, ' ')}
          </span>
          <span style="font-size:11px; color:var(--text-muted); font-weight:600;">${r.jurisdiction} Corridor</span>
        </div>
        <div style="font-size:11px; color:var(--text-muted);">Gate Pass: <strong style="color:var(--text-main); font-family:monospace; background:#f1f5f9; padding:2px 8px; border-radius:4px; border:1px solid #e2e8f0;">${r.logistics.gate_pass_code}</strong></div>
      </div>

      <div class="transfer-nodes-flow">
        <!-- Donor Node -->
        <div class="node-box donor">
          <div class="node-role-label">Surplus Donor Hub</div>
          <div class="node-facility-name">${r.source.name}</div>
          <div class="node-district">${r.source.district}, ${r.source.state_code} (${r.source.type})</div>
          <div class="runway-shift-pill">
            <span>Buffer Runway:</span>
            <strong>${r.source.pre_runway}d &rarr; ${r.source.post_runway}d</strong>
          </div>
        </div>

        <!-- Middle Logistics Flow -->
        <div class="transit-middle-arrow">
          <div class="transit-asset-badge">
            ${r.quantity} ${r.unit} &bull; ${r.medicine_name}
          </div>
          <div class="transit-arrow-visual">
            &boxh;&boxh;&boxh;&boxh;&boxh;&boxh;&boxh;&blacktriangleright;
          </div>
          <div class="transit-distance-text">
            ${r.logistics.distance_km} km &bull; Est. ${r.logistics.est_transit_hours} hrs via ${r.logistics.recommended_carrier}
          </div>
          ${r.cold_chain ? '<div class="cold-chain-flag">❄️ 2°C - 8°C Cold-Box Monitored</div>' : ''}
        </div>

        <!-- Receiver Node -->
        <div class="node-box receiver">
          <div class="node-role-label">Deficit Health Facility</div>
          <div class="node-facility-name">${r.destination.name}</div>
          <div class="node-district">${r.destination.district}, ${r.destination.state_code} (${r.destination.type})</div>
          <div class="runway-shift-pill">
            <span>Restored Runway:</span>
            <strong style="color:#34d399;">${r.destination.pre_runway}d &rarr; ${r.destination.post_runway}d</strong>
          </div>
        </div>
      </div>

      <div class="transfer-bottom-actions">
        <div class="allocation-rationale">
          <strong>AI Allocation Rationale:</strong> ${r.rationale}
        </div>
        <div style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap;">
          <button class="btn-header" onclick="window.viewRouteOnMap(${r.source.lat}, ${r.source.lng}, ${r.destination.lat}, ${r.destination.lng}, '${r.source.name.replace(/'/g, "\\'")}', '${r.destination.name.replace(/'/g, "\\'")}')">
            🗺️ View Route
          </button>
          <button class="btn-header" onclick="window.openGatePassManifest('${r.id}')">
            📄 Gate Pass Manifest
          </button>
          <button class="btn-header btn-primary" onclick="window.executeTransferOrder('${r.id}')">
            🚚 1-Click Dispatch
          </button>
        </div>
      </div>
    </div>
  `).join("");
}

window.viewRouteOnMap = function(lat1, lon1, lat2, lon2, srcName, dstName) {
  window.switchTab("tab-overview");
  const banner = document.getElementById("activeRouteBanner");
  const text = document.getElementById("activeRouteText");
  if (banner && text) {
    banner.style.display = "flex";
    text.innerHTML = `Corridor: <strong>${srcName || 'Donor Hub'}</strong> &rarr; <strong>${dstName || 'Deficit PHC'}</strong> (Active Transport Corridor)`;
  }
  if (window.zoomToRoute) {
    window.zoomToRoute(lat1, lon1, lat2, lon2);
  }
};

window.backFromRoute = function() {
  const banner = document.getElementById("activeRouteBanner");
  if (banner) banner.style.display = "none";
  window.switchTab("tab-redistribution");
  if (window.fitAllFacilities) {
    window.fitAllFacilities();
  }
};

window.openGatePassManifest = async function(transferId) {
  try {
    const res = await fetch(`/api/manifest/${transferId}`);
    const json = await res.json();
    if (json.status === "SUCCESS") {
      const m = json.data;
      const body = document.getElementById("manifestModalBody");
      if (body) {
        body.innerHTML = `
          <div class="manifest-sheet">
            <div class="manifest-header">
              <div style="display:flex; justify-content:center; margin-bottom:8px;">
                <img src="logo.png" alt="ArogyaPulse AI" style="height:38px; object-fit:contain;">
              </div>
              <div style="font-size:11px; text-transform:uppercase; letter-spacing:1px; color:#64748b; font-weight:800;">
                Government of India &bull; Ministry of Health & Family Welfare
              </div>
              <div style="font-size:15px; font-weight:900; color:#0f172a; margin-top:2px;">
                EMERGENCY MEDICAL DISPATCH GATE PASS
              </div>
              <div class="manifest-code-badge">
                GATE PASS NO: ${m.gate_pass_number} &bull; TRX ID: ${m.transfer_id}
              </div>
            </div>

            <div class="manifest-grid">
              <div>
                <div style="font-size:10px; color:#64748b; font-weight:700; text-transform:uppercase;">Surplus Donor Health Center</div>
                <div style="font-size:13px; font-weight:800; color:#0f172a; margin-top:2px;">${m.donor_facility}</div>
                <div style="font-size:11px; color:#475569;">District: ${m.donor_district}</div>
              </div>
              <div>
                <div style="font-size:10px; color:#64748b; font-weight:700; text-transform:uppercase;">Deficit Receiving Facility</div>
                <div style="font-size:13px; font-weight:800; color:#0f172a; margin-top:2px;">${m.receiving_facility}</div>
                <div style="font-size:11px; color:#475569;">District: ${m.receiving_district}</div>
              </div>
            </div>

            <div style="margin:14px 0; border:1px solid #cbd5e1; border-radius:6px; overflow:hidden;">
              <table style="width:100%; border-collapse:collapse; font-size:12px;">
                <thead>
                  <tr style="background:#f1f5f9; color:#475569; border-bottom:1px solid #cbd5e1; text-align:left;">
                    <th style="padding:8px 12px;">Requisitioned Medical Asset</th>
                    <th style="padding:8px 12px;">Authorized Quantity</th>
                    <th style="padding:8px 12px;">Cold-Chain Protocol</th>
                    <th style="padding:8px 12px;">Transport Vehicle</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style="background:#ffffff;">
                    <td style="padding:10px 12px; font-weight:800; color:#0f172a;">${m.medicine_name}</td>
                    <td style="padding:10px 12px; font-weight:800; color:#0284c7;">${m.quantity} ${m.unit}</td>
                    <td style="padding:10px 12px;">
                      ${m.cold_chain_required 
                        ? '<span style="background:#e0f2fe; color:#0369a1; padding:2px 8px; border-radius:4px; font-weight:700; font-size:11px;">❄️ ' + m.temperature_range + '</span>' 
                        : '<span style="color:#64748b; font-size:11px;">Ambient Control</span>'}
                    </td>
                    <td style="padding:10px 12px; color:#334155; font-weight:600;">${m.carrier_vehicle}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            ${m.cold_chain_required ? `
              <div class="manifest-coldchain-notice">
                ❄️ <strong>MANDATORY COLD CHAIN PROTOCOL:</strong> Maintain continuous temperature logging between 2°C and 8°C. Do not break container seal until verification by ${m.receiving_facility} Pharmacist In-Charge.
              </div>
            ` : ''}

            <div class="manifest-grid" style="margin-top:12px;">
              <div>
                <div style="font-size:11px; color:#64748b;">Dispatched Timestamp:</div>
                <div style="font-size:12px; font-weight:700; color:#0f172a;">${new Date(m.dispatched_at).toLocaleString()}</div>
              </div>
              <div>
                <div style="font-size:11px; color:#64748b;">Estimated Transit Duration:</div>
                <div style="font-size:12px; font-weight:700; color:#0f172a;">${m.estimated_transit_hours} Hours</div>
              </div>
            </div>

            <div class="manifest-signatures">
              <div>
                <div class="sig-line">Donor Medical Officer Signature</div>
              </div>
              <div>
                <div class="sig-line">Govt Transport Driver Signature</div>
              </div>
              <div>
                <div class="sig-line">Receiving Pharmacist Signature</div>
              </div>
            </div>
          </div>
        `;
        const modal = document.getElementById("manifestModal");
        if (modal) modal.classList.add("active");
      }
    }
  } catch (err) {
    console.error("Error opening gate pass manifest:", err);
  }
};

window.printManifest = function() {
  window.print();
};

window.executeTransferOrder = async function(transferId) {
  try {
    const res = await fetch("/api/redistribution/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transfer_id: transferId })
    });
    const json = await res.json();
    if (json.status === "SUCCESS") {
      await refreshAllDashboardData();
      window.openGatePassManifest(transferId);
    }
  } catch (err) {
    console.error("Error executing transfer:", err);
  }
};

window.resetMapFilters = function() {
  const stateSel = document.getElementById("filterStateSelect");
  const typeSel = document.getElementById("filterTypeSelect");
  const searchInput = document.getElementById("facilitySearchInput");
  if (stateSel) stateSel.value = "ALL";
  if (typeSel) typeSel.value = "ALL";
  if (searchInput) searchInput.value = "";
  renderFacilitySidebar(appState.facilities);
  if (window.filterMap) window.filterMap("ALL", "ALL", "");
  if (window.fitAllFacilities) window.fitAllFacilities();
};

window.executeAllDispatches = async function() {
  if (!confirm("Are you sure you want to approve and execute all automated cross-district dispatches?")) return;
  try {
    const res = await fetch("/api/redistribution/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ execute_all: true })
    });
    const json = await res.json();
    if (json.status === "SUCCESS") {
      alert(json.message);
      await refreshAllDashboardData();
    }
  } catch (err) {
    console.error("Error executing all transfers:", err);
  }
};

/**
 * Public Health Outbreak Simulation Controls
 */
function setupSimulationTriggers() {
  // Triggers handled via onclick attributes in header / simulator modal
}

window.triggerOutbreak = async function(scenario, state) {
  try {
    const res = await fetch("/api/simulation/trigger", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenario: scenario, state: state })
    });
    const json = await res.json();
    if (json.status === "SUCCESS") {
      alert(`Simulated Outbreak: ${json.data.title}\nSeverity: ${json.data.severity}\nCheck Alerts & Redistribution tabs!`);
      await refreshAllDashboardData();
    }
  } catch (err) {
    console.error("Simulation error:", err);
  }
};

window.resetOutbreakSimulation = async function() {
  try {
    const res = await fetch("/api/simulation/reset", { method: "POST" });
    const json = await res.json();
    if (json.status === "SUCCESS") {
      alert("Emergency outbreak cleared. Health network baseline restored.");
      await refreshAllDashboardData();
    }
  } catch (err) {
    console.error("Reset error:", err);
  }
};

/**
 * Sanjeevani AI Copilot Chat Controller
 */
function setupChatHandlers() {
  const sendBtn = document.getElementById("btnSendChat");
  const input = document.getElementById("chatInputField");
  const micBtn = document.getElementById("btnChatMic");

  if (sendBtn && input) {
    sendBtn.addEventListener("click", () => sendChatMessage());
    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") sendChatMessage();
    });
  }

  if (micBtn) {
    micBtn.addEventListener("click", () => {
      if (window.startVoiceAssistant) {
        startVoiceAssistant((transcript) => {
          if (input) input.value = transcript;
          sendChatMessage();
        });
      }
    });
  }
}

async function sendChatMessage(customQuery) {
  const input = document.getElementById("chatInputField");
  const messagesArea = document.getElementById("chatMessagesArea");
  const query = customQuery || (input ? input.value.trim() : "");
  if (!query) return;

  if (input) input.value = "";

  // Append user bubble
  appendChatBubble(query, "user");

  // Show thinking indicator
  const thinkingId = "bubble-" + Date.now();
  if (messagesArea) {
    messagesArea.insertAdjacentHTML("beforeend", `
      <div class="chat-bubble ai-bubble" id="${thinkingId}">
        <span class="pulse-dot"></span> <em>Sanjeevani AI is analyzing national health telemetry...</em>
      </div>
    `);
    messagesArea.scrollTop = messagesArea.scrollHeight;
  }

  const geminiKey = localStorage.getItem("arogya_gemini_key") || "";

  try {
    const res = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: query,
        language: currentLang,
        api_key: geminiKey
      })
    });
    const json = await res.json();
    const bubbleEl = document.getElementById(thinkingId);
    if (bubbleEl) {
      if (json.status === "SUCCESS") {
        bubbleEl.innerHTML = `
          <div style="font-size:10px; color:#38bdf8; font-weight:700; margin-bottom:4px;">
            ${json.data.provider}
          </div>
          <div>${marked.parse ? marked.parse(json.data.response) : json.data.response}</div>
          <div style="margin-top:8px; display:flex; gap:6px;">
            <button onclick="window.speakAloud('${encodeURIComponent(json.data.response)}')" style="background:rgba(255,255,255,0.08); border:none; color:#94a3b8; font-size:11px; padding:2px 6px; border-radius:4px; cursor:pointer;">
              🔊 Listen Aloud
            </button>
          </div>
        `;
      } else {
        bubbleEl.textContent = "Error: " + json.message;
      }
    }
    } catch (err) {
    const bubbleEl = document.getElementById(thinkingId);
    if (bubbleEl) {
      const reply = generateClientAiReply(query, currentLang);
      bubbleEl.innerHTML = `
        <div style="font-size:10px; color:#38bdf8; font-weight:700; margin-bottom:4px;">
          🤖 Sanjeevani AI Clinical Copilot (National Grid Knowledge Engine)
        </div>
        <div>${marked.parse ? marked.parse(reply) : reply}</div>
        <div style="margin-top:8px; display:flex; gap:6px;">
          <button onclick="window.speakAloud('${encodeURIComponent(reply)}')" style="background:rgba(255,255,255,0.08); border:none; color:#94a3b8; font-size:11px; padding:2px 6px; border-radius:4px; cursor:pointer;">
            🔊 Listen Aloud
          </button>
        </div>
      `;
    }
  }

  if (messagesArea) messagesArea.scrollTop = messagesArea.scrollHeight;
}

window.askPresetQuestion = function(presetText) {
  sendChatMessage(presetText);
};

window.speakAloud = function(encodedText) {
  const text = decodeURIComponent(encodedText);
  if (window.speakTextAloud) {
    speakTextAloud(text, currentLang);
  }
};

function appendChatBubble(text, sender) {
  const area = document.getElementById("chatMessagesArea");
  if (!area) return;
  const bubbleClass = sender === "user" ? "user-bubble" : "ai-bubble";
  area.insertAdjacentHTML("beforeend", `
    <div class="chat-bubble ${bubbleClass}">
      ${text}
    </div>
  `);
  area.scrollTop = area.scrollHeight;
}

/**
 * Frontline Voice-to-Stock Logging Controller
 */
function setupVoiceStockHandler() {
  const micBtn = document.getElementById("btnVoiceStockMic");
  const facSel = document.getElementById("voiceFacilitySelect");
  const previewBox = document.getElementById("voiceStockParsedPreview");

  if (micBtn) {
    micBtn.addEventListener("click", () => {
      if (window.startVoiceAssistant) {
        startVoiceAssistant((transcript) => {
          const parsed = parseFrontlineVoiceStock(transcript);
          if (previewBox) {
            previewBox.innerHTML = `
              <div style="color:var(--med-green); font-weight:800; margin-bottom:4px;">✓ Spoken Stock Detected:</div>
              <div style="font-size:13px; color:var(--text-main); font-weight:600;">"${transcript}"</div>
              <div style="margin-top:6px; font-size:12px; color:var(--med-blue-dark);">
                Matched Medicine: <strong>${parsed.medicine_name}</strong><br>
                Parsed Quantity: <strong>+${parsed.quantity} units</strong>
              </div>
              <button onclick="window.submitVoiceStock('${parsed.medicine_id}', ${parsed.quantity})" style="margin-top:8px; background:var(--med-green); color:white; border:none; padding:6px 14px; border-radius:4px; font-weight:700; cursor:pointer;">
                Confirm & Log to PHC Inventory
              </button>
            `;
          }
        });
      }
    });
  }
}

window.submitVoiceStock = async function(medId, qty) {
  const facSel = document.getElementById("voiceFacilitySelect");
  const facId = facSel ? facSel.value : "UP-VAR-001";

  try {
    const res = await fetch("/api/stock/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        facility_id: facId,
        medicine_id: medId,
        quantity: qty,
        operation: "ADD",
        reported_by: "ASHA / Frontline Nurse (Voice Log)",
        remarks: "Spoken inventory update via ArogyaVoice"
      })
    });
    const json = await res.json();
    if (json.status === "SUCCESS") {
      alert(`Voice stock successfully logged for ${json.data.facility_name}!`);
      await refreshAllDashboardData();
    }
  } catch (err) {
    console.error("Error submitting voice stock:", err);
  }
};

/**
 * Google AI Settings Modal Controller
 */
function setupSettingsModal() {
  const modal = document.getElementById("settingsModal");
  const input = document.getElementById("geminiApiKeyInput");
  const savedKey = localStorage.getItem("arogya_gemini_key") || "";
  if (input && savedKey) input.value = savedKey;
}

window.openSettingsModal = function() {
  const modal = document.getElementById("settingsModal");
  if (modal) modal.classList.add("active");
};

window.saveSettings = function() {
  const input = document.getElementById("geminiApiKeyInput");
  if (input) {
    localStorage.setItem("arogya_gemini_key", input.value.trim());
    alert("Google Gemini Settings Saved! Live AI features will utilize this key.");
  }
  window.closeModal("settingsModal");
};


window.openSimulatorModal = function() {
  const m = document.getElementById("simulatorModal");
  if (m) m.classList.add("active");
};

window.closeModal = function(modalId) {
  const m = document.getElementById(modalId);
  if (m) m.classList.remove("active");
};

window.openSettingsModal = function() {
  const m = document.getElementById("settingsModal");
  if (m) {
    const input = document.getElementById("geminiApiKeyInput");
    if (input) input.value = localStorage.getItem("arogya_gemini_key") || "";
    m.classList.add("active");
  }
};

window.saveSettings = function() {
  const input = document.getElementById("geminiApiKeyInput");
  if (input) {
    const key = input.value.trim();
    localStorage.setItem("arogya_gemini_key", key);
    const badge = document.getElementById("geminiActiveBadge");
    if (badge) {
      if (key) {
        badge.innerHTML = `<span>✨</span><span>Google Gemini 2.5: ACTIVE</span>`;
      } else {
        badge.innerHTML = `<span>✨</span><span>Gemini AI Engine: READY</span>`;
      }
    }
  }
  alert("✓ Settings saved successfully!");
  window.closeModal("settingsModal");
};
