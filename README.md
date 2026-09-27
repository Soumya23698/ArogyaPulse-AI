# 🏥 ArogyaPulse AI (आरोग्य पल्स)

> 🌐 **24/7 Live Web Access**: [https://soumya23698.github.io/ArogyaPulse-AI/](https://soumya23698.github.io/ArogyaPulse-AI/)
> *(Accessible anytime from any smartphone, tablet, or PC worldwide)*

---

### National Federated Health Resource & Supply Chain Intelligence Grid
*A National-Scale Federated AI Platform for Real-Time Visibility, Demand Forecasting, Automated Cross-District Redistribution, and Edge Collaborative Modeling across India's Primary Health Centres (PHCs).*

---

## 📌 Executive Summary & Problem Addressed

India's public healthcare infrastructure encompasses over **13,900+ Primary Health Centres (PHCs)**, Community Health Centres (CHCs), and District Hospitals (DHs) serving over 1.4 billion citizens. Yet, public healthcare systems across states face persistent vulnerabilities:
- **Zero Real-Time Granular Visibility**: Inventory tracking is often trapped in physical paper ledgers or fragmented state silos.
- **Catastrophic Stockouts during Emergencies**: Outbreaks (such as post-monsoon Dengue surges in Kerala, acute flood-related waterborne gastroenteritis in Assam, or agricultural harvest snakebites in Uttar Pradesh) quickly deplete vital NLEM assets (Anti-Snake Venom, ORS, Rabies vaccines, Blood/Platelets, and Oxygen).
- **Data Sovereignty & Federal Health Autonomy**: Under Indian health data regulations (DISHA / ABDM), states cannot centralize identifiable patient records into a single monolithic cloud repository.

**ArogyaPulse AI** solves this by establishing an end-to-end **Federated National Health Supply Chain Grid**:
1. **Real-Time Visibility**: Live telemetry across medicine inventories, bed allocations (General, Oxygen, ICU Ventilator, Maternity), and healthcare staff attendance.
2. **Predictive Demand Forecasting**: 7-day, 14-day, and 30-day forward trajectories with 95% confidence intervals, accounting for seasonal epidemiological multipliers and day-of-week surges.
3. **Automated Cross-District Redistribution**: Pairs deficit PHCs with optimal surplus donor hubs using Haversine road algorithms, transit speeds, cold-chain safety windows (2°C–8°C), and digital dispatch gate passes.
4. **Shared Predictive Modeling via Federated Learning (FedAvg)**: Multi-State Edge Nodes train locally on PHC telemetry and aggregate model parameters under Differential Privacy ($\epsilon=1.25$), protecting citizen health data.
5. **Google AI Multi-Agent & Vision Integration**: Powered by Google Gemini 1.5 Flash for natural language triage and Computer Vision OCR to digitize handwritten PHC stock ledgers and medicine blister strips.
6. **Built for India with Multilingual Voice Support**: 6 Indian languages (English, हिन्दी, বাংলা, தமிழ், తెలుగు, मराठी) with Web Speech voice recognition and synthesis.

---

## 🏆 Submission Criteria Alignment Matrix

| Submission Criterion | ArogyaPulse AI Implementation | Verified Verification Link |
| :--- | :--- | :--- |
| **✓ Functioning End-to-End Flow** | Live interactive dashboard covering National Map, Facility Drilldown, Forecasting, Emergency Outbreak Simulation, Redistribution, and Frontline Logging. | `http://localhost:5050` |
| **✓ Mandatory Integration of Google AI** | **Google Gemini 1.5 Flash**: (1) Sanjeevani AI Clinical Supply Copilot for NL triage and MoHFW circular generation. (2) Computer Vision OCR for handwritten paper registers and medicine blister strips. | `backend/ai_copilot.py` |
| **✓ Real or Realistic Indian Data** | All 36 States & Union Territories (127 authentic Primary & Community Health Centres with GPS coordinates, NLEM medicines, beds, and staff rosters). | `backend/seed_data.py` |
| **✓ Built for India & Scalable** | Hierarchical state-district-PHC structure, cold-chain monitoring protocols (2-8°C), rural low-bandwidth gradient updates (48 KB), and emergency outbreak simulation. | `backend/redistribution.py` |
| **✓ Multilingual & Voice Support** | 6 Indian languages (English, Hindi, Bengali, Tamil, Telugu, Marathi), Web Speech API voice input, and Text-to-Speech audio readout. | `frontend/js/translations.js`, `frontend/js/voice.js` |

---

## 🏗️ System Architecture

```
                       ┌────────────────────────────────────────────────────────┐
                       │          CENTRAL NATIONAL HEALTH GRID AGGREGATOR        │
                       │   (MoHFW / National Health Mission Command Center)     │
                       └──────────────────────────┬─────────────────────────────┘
                                                  │
                 ┌────────────────────────────────┴────────────────────────────────┐
                 │ FedAvg Parameter Broadcast & Aggregation (Differential Privacy) │
                 ▼                                                                 ▼
   ┌───────────────────────────┐                                     ┌───────────────────────────┐
   │    STATE EDGE NODE: UP    │                                     │    STATE EDGE NODE: KL    │
   │  (Varanasi / Gorakhpur)   │                                     │   (Ernakulam / Wayanad)   │
   ├───────────────────────────┤                                     ├───────────────────────────┤
   │ • Local Training on PHC   │                                     │ • Local Training on PHC   │
   │   Telemetry (1.9M+ records│                                     │   Telemetry               │
   │ • Zero PHI Data Leaves    │                                     │ • Zero PHI Data Leaves    │
   └─────────────┬─────────────┘                                     └─────────────┬─────────────┘
                 │                                                                 │
                 ▼                                                                 ▼
   ┌───────────────────────────┐                                     ┌───────────────────────────┐
   │ PHC Cholapur (Rural)      │ ◄─── Automated Cross-District ──────┤ Pandit Deen Dayal         │
   │ Deficit: Anti-Snake Venom │      Dispatch Route (12.4 km)       │ Upadhyaya District Depot  │
   │ Runway: 1.2 Days          │      Cold-Chain Van (2°C - 8°C)     │ Surplus: 180 Vials        │
   └───────────────────────────┘                                     └───────────────────────────┘
```

---

## 🚀 Quickstart & How to Run

### Step 1: Launch the Application
Double-click `run_arogya.bat` in the root directory, or execute in PowerShell:
```powershell
& "d:\SoumyaD\.venv\Scripts\python.exe" d:\SoumyaD\backend\app.py
```

### Step 2: Open in Web Browser
Navigate to:
```
http://localhost:5050
```

---

## 🧭 Guided Demonstration Walkthrough

### 1. National Overview & Interactive Map (`Tab 1`)
- **Action**: Explore the high-contrast Leaflet.js map of India.
- **Inspect**: Click on any pulsing PHC marker (e.g. **PHC Cholapur** in Varanasi, UP).
- **Examine**: The detailed modal reveals bed allocations (General, Oxygen, ICU Ventilator), medical personnel on-duty, and full NLEM medicine inventory with days of runway remaining.

### 2. Simulate a Public Health Emergency (`Outbreak Simulator`)
- **Action**: Click the red **"⚠️ Simulate Outbreak"** button in the top navigation.
- **Select**: **"1. Dengue & Thrombocytopenia Spike (Kerala)"** or **"2. Monsoon Riverine Flood Gastro Surge (Assam)"**.
- **Observe**:
  - The pulsing red **Emergency Alert Banner** appears instantly.
  - Medicine burn rates accelerate (up to 4.5x), General and Oxygen bed occupancy saturates, and inventory runways drop to `< 3 days` (CRITICAL).

### 3. Automated Cross-District Redistribution (`Tab 3`)
- **Action**: Switch to the **Cross-District Redistribution** tab.
- **Observe**: The AI engine computes optimal surplus-to-deficit pairings:
  - Displays surplus donor hospital (e.g. District Hospital depot) and deficit rural PHC.
  - Computes Haversine transit distance, estimated road transit time, and cold-chain safety window (2°C–8°C).
  - Displays post-transfer runway stability for both facilities.
  - Displays AI Allocation Rationale and digital dispatch gate pass (e.g., `GP-UP-35449`).
- **Action**: Click **"🚚 1-Click Dispatch Gate Pass"** to formally execute the transfer.

### 4. Predictive Demand Forecasting (`Tab 2`)
- **Action**: Select **PHC Cholapur** and **Anti-Snake Venom (ASV)**.
- **Observe**: The Chart.js graph displays the 14-day projected consumption curve, stock depletion trajectory, and 95% confidence bands, highlighting the imminent stockout date.

### 5. Federated Learning across India's States (`Tab 4`)
- **Action**: View the 8 participating Indian state edge nodes (UP, Maharashtra, Kerala, Assam, Odisha, Rajasthan, West Bengal, Tamil Nadu).
- **Click**: **"⚡ Run Federated Round"**.
- **Observe**: An animated 5-step progress sequence simulates:
  1. Parameter distribution to state nodes.
  2. Local edge training on 1.9M+ patient records.
  3. Adaptive gradient clipping and Differential Privacy masking ($\epsilon=1.25$).
  4. Central FedAvg aggregation.
  5. Parameter broadcast. Global model accuracy climbs and loss decreases.

### 6. Sanjeevani AI Clinical Supply Copilot (`Tab 5`)
- **Action**: Ask questions in English or Hindi (e.g. *"वाराणसी और गोरखपुर में एंटी-स्नेक वेनम का स्टॉक कितना है?"* or *"Summarize critical shortages across Uttar Pradesh"*).
- **Multilingual Voice**: Tap the microphone button to dictate questions or click **"🔊 Listen Aloud"** for speech synthesis.

### 7. Frontline Voice & Computer Vision Entry (`Tab 6`)
- **Voice Logger**: Tap the mic and say: *"Received 500 Paracetamol tablets and 20 Anti-Snake Venom vials"* or *"२०० ओआरएस पैकेट प्राप्त हुए"*. The parser extracts structured medicine quantities and logs them.
- **Gemini Vision OCR**: Click on **"1. Handwritten Register"** or **"2. Paracetamol Foil"** sample assets and click **"🔍 Analyze with Gemini Vision OCR"**. The AI extracts the drug name, batch number, expiry date, and unit count, automatically replenishing the designated PHC's inventory.

---

## 🔒 Data Privacy & Compliance
- **Zero Raw Data Transfer**: Citizen medical records never leave their respective state health departments.
- **Differential Privacy**: Model gradient updates are perturbed using Renyi Differential Privacy ($\epsilon = 1.25, \delta = 10^{-5}$) to prevent membership inference attacks.
- **Low-Bandwidth Optimized**: Model weight updates require only ~48 KB per communication round, fully functioning over 2G/3G rural networks.
