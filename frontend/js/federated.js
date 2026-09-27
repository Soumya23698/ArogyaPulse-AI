/**
 * federated.js
 * Federated Learning (FedAvg) Controller for Shared Cross-State Predictive Health Modelling
 */

let federatedHistoryCache = [];

async function loadFederatedStatus() {
  try {
    const res = await fetch("/api/federated/status");
    const json = await res.json();
    if (json.status === "SUCCESS") {
      federatedHistoryCache = json.data.history;
      renderFederatedOverview(json.data);
      renderFederatedConvergenceChart("fedConvergenceChart", json.data.history);
    }
  } catch (err) {
    console.error("Error loading federated status:", err);
  }
}

function renderFederatedOverview(fedData) {
  const latest = fedData.latest_round;
  if (!latest) return;

  // KPI cards
  const elAcc = document.getElementById("fedGlobalAccuracy");
  const elLoss = document.getElementById("fedGlobalLoss");
  const elRecords = document.getElementById("fedRecordsProtected");
  const elPayload = document.getElementById("fedGradientPayload");
  const elRoundNum = document.getElementById("fedCurrentRoundNum");

  if (elAcc) elAcc.textContent = `${latest.global_accuracy}%`;
  if (elLoss) elLoss.textContent = latest.global_loss.toFixed(4);
  if (elRecords) elRecords.textContent = `${(latest.total_raw_records_protected / 1000000).toFixed(2)}M`;
  if (elPayload) elPayload.textContent = `${latest.gradient_payload_transferred_kb} KB`;
  if (elRoundNum) elRoundNum.textContent = `Round ${latest.round_number}`;

  // Feature insight
  const insightBox = document.getElementById("fedLatestInsight");
  if (insightBox && latest.learned_features && latest.learned_features.length > 0) {
    insightBox.innerHTML = `<strong>Latest National Convergence Insight:</strong> ${latest.learned_features[0]}`;
  }

  // Render State Node Cards
  const statesContainer = document.getElementById("fedStatesGrid");
  if (statesContainer && latest.state_contributions) {
    statesContainer.innerHTML = latest.state_contributions.map(s => `
      <div class="state-node-card">
        <div class="state-node-header">
          <span class="state-name">${s.state_name}</span>
          <span class="state-code-pill">${s.state_code} Node</span>
        </div>
        <div class="state-metrics-list">
          <div class="state-metric-item">
            <span>Local PHC Patient Samples:</span>
            <span class="val">${s.local_samples.toLocaleString()} records</span>
          </div>
          <div class="state-metric-item">
            <span>Local Test Loss:</span>
            <span class="val" style="color:#f87171;">${s.local_loss.toFixed(3)}</span>
          </div>
          <div class="state-metric-item">
            <span>Local Accuracy:</span>
            <span class="val" style="color:#34d399;">${s.local_accuracy}%</span>
          </div>
          <div class="state-metric-item">
            <span>FedAvg Aggregation Weight:</span>
            <span class="val" style="color:#38bdf8;">${(s.weight_fraction * 100).toFixed(0)}%</span>
          </div>
          <div class="state-metric-item" style="margin-top:4px; font-size:11px; color:#10b981;">
            <span>✓ Privacy Status:</span>
            <span>Differential Privacy Masked</span>
          </div>
        </div>
      </div>
    `).join("");
  }
}

async function triggerFederatedRound() {
  const btn = document.getElementById("btnTriggerFederatedRound");
  const progressContainer = document.getElementById("fedRoundProgressContainer");
  const progressFill = document.getElementById("fedRoundProgressFill");
  const progressText = document.getElementById("fedRoundProgressText");

  if (btn) btn.disabled = true;
  if (progressContainer) progressContainer.style.display = "block";

  // Multi-step animated progress to demonstrate the 5 steps of Federated Learning
  const steps = [
    { p: 20, msg: "Step 1/5: Distributing Global Parameters to 36 State & UT Edge Nodes..." },
    { p: 45, msg: "Step 2/5: Local Edge Training on 2.4M+ PHC Telemetry Records (Zero Data Leaving States)..." },
    { p: 70, msg: "Step 3/5: Applying Adaptive Gradient Clipping & Differential Privacy Noise (ε=1.25)..." },
    { p: 88, msg: "Step 4/5: Running FedAvg Aggregation at Central National Health Grid..." },
    { p: 100, msg: "Step 5/5: Broadcasting Calibrated Epidemiological Model Weights!" }
  ];

  for (let i = 0; i < steps.length; i++) {
    if (progressFill) progressFill.style.width = `${steps[i].p}%`;
    if (progressText) progressText.textContent = steps[i].msg;
    await new Promise(r => setTimeout(r, 400));
  }

  try {
    const res = await fetch("/api/federated/train-round", { method: "POST" });
    const json = await res.json();
    if (json.status === "SUCCESS") {
      await loadFederatedStatus();
      if (progressText) {
        progressText.innerHTML = `
          <span style="color:#34d399; font-weight:700;">
            ✓ Round ${json.data.round_number} Completed! Global Accuracy: ${json.data.global_accuracy}% (Loss: ${json.data.global_loss})
          </span>
        `;
      }
    }
  } catch (err) {
    console.error("Federated training error:", err);
  } finally {
    if (btn) btn.disabled = false;
    setTimeout(() => {
      if (progressContainer) progressContainer.style.display = "none";
    }, 4000);
  }
}
