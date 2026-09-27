"""
test_suite.py
Automated end-to-end integration test for ArogyaPulse AI backend services.
"""

import sys
import os

# Add root folder to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.database import db
from backend.seed_data import STATES, NLEM_MEDICINES
from backend.redistribution import RedistributionEngine
from backend.forecasting import HealthDemandForecaster
from backend.federated_engine import FederatedLearningGrid
from backend.ai_copilot import ArogyaAICopilot

def run_tests():
    print(">>> 1. Testing Database & Summary...")
    summary = db.get_summary()
    assert summary["active_telemetry_nodes"] > 0, "No facilities found"
    assert summary["monitored_states"] >= 36, f"Expected 36 states, got {summary['monitored_states']}"
    print(f"    Summary OK: {summary['active_telemetry_nodes']} facilities, {summary['total_beds']} beds, {summary['bed_occupancy_rate']}% occupancy")

    print(">>> 2. Testing Demand Forecasting...")
    forecaster = HealthDemandForecaster(db)
    fc = forecaster.forecast_demand("UP-VAR-001", "MED-04", days_horizon=14)
    assert len(fc["dates"]) == 14, "Expected 14 forecast days"
    print(f"    Forecast OK for {fc['medicine_name']} in {fc['facility_name']}: Risk Level: {fc['risk_level']}, Stockout Date: {fc['stockout_date']}")

    print(">>> 3. Testing Automated Cross-District Redistribution...")
    re_engine = RedistributionEngine(db)
    recs = re_engine.compute_optimal_redistributions()
    print(f"    Redistribution OK: Found {len(recs)} optimization transfers")
    if recs:
        top = recs[0]
        print(f"    Top Transfer: {top['quantity']} {top['unit']} of {top['medicine_name']} from {top['source']['name']} -> {top['destination']['name']} ({top['logistics']['distance_km']} km)")
        # Test executing transfer
        dispatched = re_engine.execute_transfer(top["id"], recs)
        assert dispatched["status"] == "DISPATCHED"
        print(f"    Execution OK: Transfer {top['id']} dispatched with Gate Pass: {top['logistics']['gate_pass_code']}")

    print(">>> 4. Testing Federated Learning Round (FedAvg across 8 Indian States)...")
    fed_grid = FederatedLearningGrid(db)
    status_before = fed_grid.get_federated_status()
    print(f"    Baseline Round: {status_before['total_rounds_completed']}, Global Loss: {status_before['latest_round']['global_loss']}")
    new_round = fed_grid.run_federated_round()
    assert new_round["round_number"] > status_before["total_rounds_completed"]
    print(f"    Federated Round {new_round['round_number']} OK: Global Loss {new_round['global_loss']}, Accuracy {new_round['global_accuracy']}%, Records Protected: {new_round['total_raw_records_protected']:,}")

    print(">>> 5. Testing Sanjeevani AI Copilot (English & Hindi)...")
    copilot = ArogyaAICopilot(db, re_engine, forecaster)
    en_chat = copilot.chat("What is the current bed occupancy and stockout risk in Uttar Pradesh?", language="en")
    assert en_chat["status"] == "SUCCESS"
    print("    English Chat Response generated successfully.")

    hi_chat = copilot.chat("वाराणसी में दवाओं का क्या हाल है?", language="hi")
    assert hi_chat["status"] == "SUCCESS"
    print("    Hindi Chat Response generated successfully.")

    print(">>> 6. Testing Computer Vision / Stock Ledger OCR...")
    # Dummy base64 1x1 png image
    dummy_b64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="
    ocr_res = copilot.process_vision_ocr(dummy_b64, "UP-VAR-001")
    assert ocr_res["status"] == "SUCCESS"
    print(f"    Vision OCR OK: Extracted {ocr_res['parsed_data']['medicine_name']} ({ocr_res['parsed_data']['quantity_counted']} units)")

    print(">>> 7. Testing Epidemic Simulation (Dengue Spike)...")
    outbreak = db.trigger_epidemic_simulation("DENGUE_SPIKE", "KL")
    assert outbreak["severity"].startswith("CRITICAL")
    print(f"    Epidemic Simulation OK: {outbreak['title']}")

    # Reset
    db.clear_emergency()
    print("    Simulation reset OK.")

    print("\n=======================================================")
    print("ALL 7 SYSTEM INTEGRATION TESTS PASSED PERFECTLY!")
    print("=======================================================")

if __name__ == "__main__":
    run_tests()
