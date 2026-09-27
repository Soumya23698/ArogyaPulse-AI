"""
app.py
Production Flask REST API server for ArogyaPulse AI:
National Federated Health Resource & Supply Chain Intelligence Grid.
Serves full-featured REST API endpoints, health monitors, and static frontend dashboard.
"""

import os
import sys
import time
from datetime import datetime
from flask import Flask, jsonify, request, send_from_directory, make_response
from flask_cors import CORS

# Add root folder to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.database import db
from backend.seed_data import STATES, NLEM_MEDICINES
from backend.redistribution import RedistributionEngine
from backend.forecasting import HealthDemandForecaster
from backend.federated_engine import FederatedLearningGrid
from backend.ai_copilot import ArogyaAICopilot
from backend.config import GEMINI_API_KEY, GEMINI_MODEL_NAME

# Server start timestamp for uptime calculation
SERVER_START_TIME = time.time()

# Initialize Engines
redistribution_engine = RedistributionEngine(db)
forecaster = HealthDemandForecaster(db)
federated_grid = FederatedLearningGrid(db)
ai_copilot = ArogyaAICopilot(db, redistribution_engine, forecaster)

# Initialize Flask app
FRONTEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend"))
app = Flask(__name__, static_folder=FRONTEND_DIR)
CORS(app)

# Cached transfer recommendations
cached_recommendations = []

# --- SYSTEM HEALTH & CONFIGURATION ---

@app.route("/api/health", methods=["GET"])
def api_get_health():
    """System health check and uptime monitor."""
    uptime_seconds = int(time.time() - SERVER_START_TIME)
    return jsonify({
        "status": "HEALTHY",
        "system": "ArogyaPulse AI Health Grid Backend",
        "uptime_seconds": uptime_seconds,
        "database": {
            "facilities_loaded": len(db.facilities),
            "states_monitored": len(STATES),
            "nlem_catalog_items": len(NLEM_MEDICINES),
            "active_emergency": bool(db.active_emergency)
        },
        "ai_engine": {
            "model": GEMINI_MODEL_NAME,
            "api_key_configured": bool(GEMINI_API_KEY),
            "copilot_ready": True
        },
        "timestamp": datetime.utcnow().isoformat() + "Z"
    })

@app.route("/api/config", methods=["GET"])
def api_get_config():
    """Returns AI model and key status for frontend initialization."""
    return jsonify({
        "status": "SUCCESS",
        "data": {
            "gemini_api_key": GEMINI_API_KEY,
            "gemini_model": GEMINI_MODEL_NAME,
            "gemini_active": bool(GEMINI_API_KEY)
        }
    })

# --- CORE HEALTH TELEMETRY ENDPOINTS ---

@app.route("/api/summary", methods=["GET"])
def api_get_summary():
    """National health grid macro telemetry."""
    summary = db.get_summary()
    return jsonify({"status": "SUCCESS", "data": summary})

@app.route("/api/states", methods=["GET"])
def api_get_states():
    """List of all monitored Indian States."""
    return jsonify({"status": "SUCCESS", "data": list(STATES)})

@app.route("/api/facilities", methods=["GET"])
def api_get_facilities():
    """List health facilities with multi-criteria filtering."""
    state = request.args.get("state")
    district = request.args.get("district")
    f_type = request.args.get("type")
    search = request.args.get("search")
    
    facs = db.get_facilities(state=state, district=district, f_type=f_type, search=search)
    return jsonify({
        "status": "SUCCESS",
        "count": len(facs),
        "data": facs
    })

@app.route("/api/facilities/<facility_id>", methods=["GET"])
def api_get_facility_detail(facility_id):
    """Detailed telemetry of a single facility."""
    fac = db.get_facility(facility_id)
    if not fac:
        return jsonify({"status": "ERROR", "message": f"Facility {facility_id} not found"}), 404
    return jsonify({"status": "SUCCESS", "data": fac})

@app.route("/api/facilities/<facility_id>/beds", methods=["POST"])
def api_update_facility_beds(facility_id):
    """Updates bed occupancy for a facility."""
    fac = db.get_facility(facility_id)
    if not fac:
        return jsonify({"status": "ERROR", "message": f"Facility {facility_id} not found"}), 404

    data = request.get_json() or {}
    bed_type = data.get("bed_type")
    occupied = data.get("occupied")

    if not bed_type or occupied is None:
        return jsonify({"status": "ERROR", "message": "bed_type and occupied count required"}), 400

    if bed_type not in fac["beds"]:
        return jsonify({"status": "ERROR", "message": f"Invalid bed type {bed_type}"}), 400

    tot = fac["beds"][bed_type]["total"]
    occupied = max(0, min(tot, int(occupied)))
    fac["beds"][bed_type]["occupied"] = occupied
    fac["beds"][bed_type]["available"] = tot - occupied
    fac["beds"][bed_type]["occupancy_rate"] = round((occupied / tot) * 100, 1) if tot > 0 else 0.0

    db._refresh_facility_alerts()
    db.save_state()
    return jsonify({"status": "SUCCESS", "data": fac["beds"]})

@app.route("/api/medicines", methods=["GET"])
def api_get_medicines():
    """Master NLEM medicines & critical supplies catalog."""
    return jsonify({"status": "SUCCESS", "data": NLEM_MEDICINES})

@app.route("/api/stock/update", methods=["POST"])
def api_update_stock():
    """Manual or automated stock update from a frontline health centre."""
    data = request.get_json() or {}
    fac_id = data.get("facility_id")
    med_id = data.get("medicine_id")
    quantity = int(data.get("quantity", 0))
    operation = data.get("operation", "ADD")
    reported_by = data.get("reported_by", "Staff Nurse / Pharmacist")
    batch_no = data.get("batch_no")
    remarks = data.get("remarks", "")

    if not fac_id or not med_id:
        return jsonify({"status": "ERROR", "message": "Missing facility_id or medicine_id"}), 400

    try:
        audit = db.update_stock(fac_id, med_id, quantity, operation, reported_by, batch_no, remarks)
        return jsonify({"status": "SUCCESS", "data": audit})
    except Exception as e:
        return jsonify({"status": "ERROR", "message": str(e)}), 400

# --- REDISTRIBUTION & LOGISTICS ---

@app.route("/api/redistribution/recommendations", methods=["GET"])
def api_get_redistribution_recommendations():
    """Calculates automated cross-district resource rebalancing transfers."""
    global cached_recommendations
    recs = redistribution_engine.compute_optimal_redistributions()
    cached_recommendations = recs
    return jsonify({
        "status": "SUCCESS",
        "total_recommendations": len(recs),
        "data": recs
    })

@app.route("/api/redistribution/execute", methods=["POST"])
def api_execute_transfer():
    """Approves and executes a recommended transfer order."""
    global cached_recommendations
    data = request.get_json() or {}
    transfer_id = data.get("transfer_id")
    execute_all = data.get("execute_all", False)

    if not cached_recommendations:
        cached_recommendations = redistribution_engine.compute_optimal_redistributions()

    try:
        if execute_all:
            dispatched = []
            for rec in list(cached_recommendations):
                res = redistribution_engine.execute_transfer(rec["id"], cached_recommendations)
                dispatched.append(res)
            cached_recommendations = []
            return jsonify({"status": "SUCCESS", "message": f"Successfully dispatched {len(dispatched)} transfers", "data": dispatched})
        else:
            if not transfer_id:
                return jsonify({"status": "ERROR", "message": "transfer_id is required"}), 400
            res = redistribution_engine.execute_transfer(transfer_id, cached_recommendations)
            return jsonify({"status": "SUCCESS", "data": res})
    except Exception as e:
        return jsonify({"status": "ERROR", "message": str(e)}), 400

@app.route("/api/redistribution/active-transfers", methods=["GET"])
def api_get_active_transfers():
    """List of executed transfers currently in transit or delivered."""
    return jsonify({"status": "SUCCESS", "data": db.transfer_orders})

@app.route("/api/manifest/<transfer_id>", methods=["GET"])
def api_get_manifest(transfer_id):
    """Generates official medical dispatch gate pass manifest."""
    global cached_recommendations
    if not cached_recommendations:
        cached_recommendations = redistribution_engine.compute_optimal_redistributions()

    rec = next((t for t in db.transfer_orders if t["id"] == transfer_id), None)
    if not rec:
        rec = next((t for t in cached_recommendations if t["id"] == transfer_id), None)
    if not rec and cached_recommendations:
        rec = cached_recommendations[0]
    if not rec:
        return jsonify({"status": "ERROR", "message": "Transfer order not found"}), 404

    manifest = {
        "manifest_title": "MINISTRY OF HEALTH & FAMILY WELFARE - EMERGENCY DISPATCH GATE PASS",
        "transfer_id": rec["id"],
        "gate_pass_number": rec["logistics"]["gate_pass_code"],
        "dispatched_at": rec.get("dispatched_at", datetime.utcnow().isoformat() + "Z"),
        "donor_facility": rec["source"]["name"],
        "donor_district": rec["source"]["district"],
        "receiving_facility": rec["destination"]["name"],
        "receiving_district": rec["destination"]["district"],
        "medicine_name": rec["medicine_name"],
        "quantity": rec["quantity"],
        "unit": rec["unit"],
        "cold_chain_required": rec["cold_chain"],
        "temperature_range": "2°C to 8°C Monitored" if rec["cold_chain"] else "Ambient",
        "carrier_vehicle": rec["logistics"]["recommended_carrier"],
        "estimated_transit_hours": rec["logistics"]["est_transit_hours"],
        "authority": "National Health Mission Cross-District Logistics Command"
    }
    return jsonify({"status": "SUCCESS", "data": manifest})

# --- PREDICTIVE FORECASTING & EPIDEMIOLOGY ---

@app.route("/api/forecast", methods=["GET"])
def api_get_forecast():
    """Generates demand forecast for a medicine at a facility."""
    fac_id = request.args.get("facility_id", "UP-VAR-001")
    med_id = request.args.get("medicine_id", "MED-04")
    raw_horizon = request.args.get("horizon") or request.args.get("days") or "14"
    try:
        horizon = int(raw_horizon)
    except (ValueError, TypeError):
        horizon = 14

    try:
        res = forecaster.forecast_demand(fac_id, med_id, horizon)
        return jsonify({"status": "SUCCESS", "data": res})
    except Exception as e:
        return jsonify({"status": "ERROR", "message": str(e)}), 400

# --- FEDERATED LEARNING GRID ---

@app.route("/api/federated/status", methods=["GET"])
def api_get_federated_status():
    """Gets status of shared predictive modelling across India's states."""
    status = federated_grid.get_federated_status()
    return jsonify({"status": "SUCCESS", "data": status})

@app.route("/api/federated/train-round", methods=["POST"])
def api_run_federated_round():
    """Executes a new Federated Learning round (FedAvg) across all state edge nodes."""
    res = federated_grid.run_federated_round()
    return jsonify({"status": "SUCCESS", "data": res})

# --- SIMULATION SUITE ---

@app.route("/api/simulation/trigger", methods=["POST"])
def api_trigger_simulation():
    """Simulates a public health emergency outbreak."""
    data = request.get_json() or {}
    scenario = data.get("scenario", "DENGUE_SPIKE")
    state = data.get("state")
    
    emergency = db.trigger_epidemic_simulation(scenario, state)
    return jsonify({"status": "SUCCESS", "data": emergency})

@app.route("/api/simulation/reset", methods=["POST"])
def api_reset_simulation():
    """Resets network state back to standard baseline."""
    res = db.clear_emergency()
    return jsonify({"status": "SUCCESS", "data": res})

# --- GOOGLE AI INTEGRATION (GEMINI 2.5 FLASH & VISION OCR) ---

@app.route("/api/ai/chat", methods=["POST"])
def api_ai_chat():
    """Sanjeevani AI Clinical Supply Chain Intelligence Copilot."""
    data = request.get_json() or {}
    query = data.get("query") or data.get("prompt") or data.get("message") or ""
    language = data.get("language", "en")
    api_key = data.get("api_key") or request.headers.get("X-Gemini-Key") or GEMINI_API_KEY

    if not query.strip():
        return jsonify({"status": "ERROR", "message": "Query cannot be empty"}), 400

    res = ai_copilot.chat(query, language=language, api_key=api_key)
    return jsonify({"status": "SUCCESS", "data": res})

@app.route("/api/ai/vision-ocr", methods=["POST"])
def api_ai_vision_ocr():
    """Extracts stock from a photographed register or medicine blister strip."""
    data = request.get_json() or {}
    image_base64 = data.get("image", "")
    fac_id = data.get("facility_id", "UP-VAR-001")
    api_key = data.get("api_key") or request.headers.get("X-Gemini-Key") or GEMINI_API_KEY

    if not image_base64:
        return jsonify({"status": "ERROR", "message": "Image data is required"}), 400

    res = ai_copilot.process_vision_ocr(image_base64, fac_id, api_key=api_key)
    return jsonify({"status": "SUCCESS", "data": res})

# --- STATIC ASSET SERVING ---

@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_frontend(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, "index.html")

# --- ERROR HANDLERS ---

@app.errorhandler(404)
def not_found(e):
    if request.path.startswith("/api/"):
        return jsonify({"status": "ERROR", "message": f"Resource not found: {request.path}", "code": 404}), 404
    return send_from_directory(app.static_folder, "index.html")

@app.errorhandler(500)
def server_error(e):
    return jsonify({"status": "ERROR", "message": "Internal server error occurred", "details": str(e), "code": 500}), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5050))
    print(f"================================================================")
    print(f"  AROGYAPULSE AI: National Health Supply Chain Intelligence Grid")
    print(f"  Ministry of Health & Family Welfare / National Health Mission")
    print(f"  Proper REST Backend Running: http://localhost:{port}")
    print(f"================================================================")
    app.run(host="0.0.0.0", port=port, debug=False)
