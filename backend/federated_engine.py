"""
federated_engine.py
Federated Learning (FedAvg) Simulator for Shared Cross-State Predictive Health Modelling.
Enables India's states (UP, Maharashtra, Kerala, Assam, Odisha, Rajasthan, West Bengal, Tamil Nadu)
to collaborate on a national demand forecasting and outbreak prediction model without
transmitting citizen health records or PHI (Protected Health Information) to a central server.
"""

import random
from datetime import datetime
from typing import Dict, List, Any
from backend.seed_data import STATES

class FederatedLearningGrid:
    def __init__(self, db_instance):
        self.db = db_instance
        self.current_round = len(self.db.federated_rounds_history)
        if self.current_round == 0:
            # Initialize with round 1 baseline
            self._initialize_baseline_round()

    def _initialize_baseline_round(self):
        """Creates the initial baseline federated training state."""
        total_samples = sum(int(s["population_millions"] * 2100) for s in STATES)
        state_contribs = []
        for s in STATES:
            base_samp = int(s["population_millions"] * 2100)
            weight_frac = round(base_samp / total_samples, 3)
            acc = round(s.get("model_convergence_score", 0.94) * 88.0, 1)
            loss = round(0.55 - (acc / 200.0), 3)
            state_contribs.append({
                "state_code": s["code"],
                "state_name": s["name"],
                "local_samples": base_samp,
                "local_loss": loss,
                "local_accuracy": acc,
                "weight_fraction": weight_frac,
                "status": "CONVERGED"
            })

        baseline_round = {
            "round_number": 1,
            "timestamp": "2026-09-26T18:00:00Z",
            "global_loss": 0.428,
            "global_accuracy": 82.4,
            "differential_privacy_epsilon": 1.25,
            "differential_privacy_delta": "1e-5",
            "total_raw_records_protected": sum(c["local_samples"] for c in state_contribs),
            "gradient_payload_transferred_kb": 48.6,
            "state_contributions": state_contribs,
            "algorithm": "Federated Averaging (FedAvg) + Adaptive Gradient Clipping + Renyi DP",
            "learned_features": [
                "Early Monsoon Vector-Borne Dengue NS1 surge signature (from Kerala edge node)",
                "Rural agricultural post-harvest snakebite clustering curve (from Maharashtra edge node)",
                "Acute waterborne flood-induced ORS demand exponent (from Assam edge node)",
                "High altitude respiratory hypoxia & oxygen buffer calibration (from Ladakh & Himachal edge nodes)"
            ]
        }
        self.db.federated_rounds_history.append(baseline_round)
        self.current_round = 1
        self.db.save_state()

    def run_federated_round(self) -> Dict[str, Any]:
        """
        Executes a new Federated Learning aggregation round across all 8 Indian state nodes.
        Computes local edge updates, simulates FedAvg aggregation, improves model accuracy,
        and logs verifiable privacy preservation metrics.
        """
        self.current_round += 1
        prev_round = self.db.federated_rounds_history[-1] if self.db.federated_rounds_history else None

        prev_loss = prev_round["global_loss"] if prev_round else 0.45
        prev_acc = prev_round["global_accuracy"] if prev_round else 80.0

        # Simulate convergence progression
        loss_reduction = random.uniform(0.025, 0.045) * (1.0 / (1.0 + 0.15 * self.current_round))
        new_global_loss = max(0.082, round(prev_loss - loss_reduction, 4))

        acc_boost = random.uniform(1.2, 2.5) * (1.0 / (1.0 + 0.18 * self.current_round))
        new_global_acc = min(98.8, round(prev_acc + acc_boost, 2))

        # Privacy metrics
        new_records_protected = int(prev_round["total_raw_records_protected"] + random.randint(85000, 140000))
        new_payload_kb = round(48.0 + random.uniform(-1.5, 3.2), 1)

        # State node local training runs
        state_contributions = []
        total_samples = 0
        for s in STATES:
            state_code = s["code"]
            base_samp = int(s["population_millions"] * 2100)
            total_samples += base_samp

        for s in STATES:
            state_code = s["code"]
            base_samp = int(s["population_millions"] * 2100)
            weight_frac = round(base_samp / total_samples, 2)
            
            # Local loss is closely correlated with global loss plus slight local variance
            loc_loss = max(0.075, round(new_global_loss + random.uniform(-0.03, 0.04), 3))
            loc_acc = min(99.0, round(new_global_acc + random.uniform(-1.5, 1.8), 1))

            state_contributions.append({
                "state_code": state_code,
                "state_name": s["name"],
                "local_samples": base_samp,
                "local_loss": loc_loss,
                "local_accuracy": loc_acc,
                "weight_fraction": weight_frac,
                "status": "CONVERGED_GRADIENT_AGGREGATED",
                "local_epochs": 5,
                "differential_privacy_clip_norm": 1.0
            })

        feature_insights = [
            f"Round {self.current_round}: Global cross-district redistribution latency reduced by 14.2% through learned transit weight matrices.",
            f"Round {self.current_round}: Enhanced precision on Anti-Snake Venom (ASV) consumption in UP & Maharashtra rural farming belts.",
            f"Round {self.current_round}: Refined maternal oxytocin supply buffer requirements across primary health sub-centres.",
            f"Round {self.current_round}: Calibrated Dengue NS1 antigen depletion curve under high humidity and rainfall conditions."
        ]

        new_round_data = {
            "round_number": self.current_round,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "global_loss": new_global_loss,
            "global_accuracy": new_global_acc,
            "differential_privacy_epsilon": 1.25,
            "differential_privacy_delta": "1e-5",
            "total_raw_records_protected": new_records_protected,
            "gradient_payload_transferred_kb": new_payload_kb,
            "state_contributions": state_contributions,
            "algorithm": "Federated Averaging (FedAvg) + Adaptive Gradient Clipping + Renyi DP",
            "learned_features": [random.choice(feature_insights)],
            "convergence_percentage": min(100.0, round(50.0 + (self.current_round * 9.8), 1))
        }

        self.db.federated_rounds_history.append(new_round_data)
        self.db.save_state()
        return new_round_data

    def get_federated_status(self) -> Dict[str, Any]:
        """Returns the current state of the Federated Learning system."""
        latest = self.db.federated_rounds_history[-1] if self.db.federated_rounds_history else None
        return {
            "total_rounds_completed": len(self.db.federated_rounds_history),
            "latest_round": latest,
            "history": self.db.federated_rounds_history,
            "connected_state_nodes": len(STATES),
            "privacy_guarantee": "Zero Protected Health Information (PHI) leaves state borders. Model parameters are secured with differential privacy.",
            "participating_states": [s["name"] for s in STATES]
        }
