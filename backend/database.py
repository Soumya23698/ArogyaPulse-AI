"""
database.py
In-memory and JSON-backed data manager for ArogyaPulse AI.
Manages state, facilities, real-time inventory, personnel, beds, alerts, and redistribution logs.
"""

import json
import os
import random
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from backend.seed_data import NLEM_MEDICINES, STATES, FACILITIES, RESOURCE_TIER_SPECS

DATA_FILE = os.path.join(os.path.dirname(__file__), "health_grid_state.json")

class HealthGridDatabase:
    def __init__(self):
        self.medicines_master = {m["id"]: m for m in NLEM_MEDICINES}
        self.states = {s["code"]: s for s in STATES}
        self.facilities: Dict[str, Dict[str, Any]] = {}
        self.transfer_orders: List[Dict[str, Any]] = []
        self.audit_log: List[Dict[str, Any]] = []
        self.active_emergency: Optional[Dict[str, Any]] = None
        self.federated_rounds_history: List[Dict[str, Any]] = []
        self.initialize_state()

    def initialize_state(self, force_reset: bool = False):
        if not force_reset and os.path.exists(DATA_FILE):
            try:
                with open(DATA_FILE, "r", encoding="utf-8") as f:
                    saved_data = json.load(f)
                    self.facilities = saved_data.get("facilities", {})
                    self.transfer_orders = saved_data.get("transfer_orders", [])
                    self.audit_log = saved_data.get("audit_log", [])
                    self.active_emergency = saved_data.get("active_emergency", None)
                    self.federated_rounds_history = saved_data.get("federated_rounds_history", [])
                    print(f"Loaded existing database with {len(self.facilities)} facilities.")
                    return
            except Exception as e:
                print(f"Error loading saved state, generating fresh baseline: {e}")

        # Generate realistic baseline data
        random.seed(42)  # Deterministic seed for reproducible baseline
        self.facilities = {}
        self.transfer_orders = []
        self.audit_log = []
        self.active_emergency = None

        for fac in FACILITIES:
            fac_id = fac["id"]
            fac_type = fac["type"]
            specs = RESOURCE_TIER_SPECS[fac_type]
            multiplier = specs["stock_multiplier"]

            # Beds setup
            beds_cfg = specs["beds"]
            beds = {}
            for bed_type, total in beds_cfg.items():
                if total == 0:
                    beds[bed_type] = {"total": 0, "occupied": 0, "available": 0, "occupancy_rate": 0.0}
                else:
                    # Realistic baseline occupancy: 65% - 85%
                    occ_ratio = random.uniform(0.65, 0.85)
                    occupied = min(total, int(total * occ_ratio))
                    beds[bed_type] = {
                        "total": total,
                        "occupied": occupied,
                        "available": total - occupied,
                        "occupancy_rate": round((occupied / total) * 100, 1)
                    }

            # Staff roster
            staff_cfg = specs["staff"]
            staff = {}
            for role, counts in staff_cfg.items():
                sanc = counts["sanctioned"]
                # Daily attendance fluctuations (80% - 100%)
                present = max(1, min(sanc, int(counts["avg_present"] * random.uniform(0.85, 1.0))))
                staff[role] = {
                    "sanctioned": sanc,
                    "present": present,
                    "on_leave": sanc - present,
                    "attendance_rate": round((present / sanc) * 100, 1)
                }

            # Footfall
            min_f, max_f = specs["daily_footfall_range"]
            daily_opd = random.randint(min_f, max_f)
            footfall = {
                "opd_today": daily_opd,
                "emergency_today": int(daily_opd * random.uniform(0.08, 0.16)),
                "fever_clinic_today": int(daily_opd * random.uniform(0.20, 0.35)),
                "diarrheal_today": int(daily_opd * random.uniform(0.05, 0.12)),
                "maternity_admissions": int(daily_opd * random.uniform(0.03, 0.08))
            }

            # Medicines Inventory
            inventory = {}
            for med in NLEM_MEDICINES:
                m_id = med["id"]
                base_pack = med["standard_pack_size"]
                
                # Daily burn rate depends on footfall
                daily_burn = max(1, int((daily_opd / 100) * (base_pack / 20) * random.uniform(0.8, 1.3)))
                if med["category"] in ["Respiratory Life Support", "Blood Transfusion Asset", "Emergency Antidote / Toxin Neutralizer"]:
                    daily_burn = max(1, int(daily_burn * 0.15))

                # Standard days of stock (normally 14 - 30 days)
                # Introduce a few pre-existing vulnerability hotspots for realism
                if fac_id == "UP-VAR-001" and m_id == "MED-04": # Varanasi PHC low on Anti-Snake Venom
                    days_stock = random.uniform(1.2, 2.5)
                elif fac_id == "KL-EKM-001" and m_id == "SUP-02": # Ernakulam Dengue test kits low
                    days_stock = random.uniform(1.8, 3.0)
                elif fac_id == "AS-KAM-001" and m_id == "MED-03": # Assam flood zone low on ORS
                    days_stock = random.uniform(2.0, 3.5)
                else:
                    days_stock = random.uniform(12.0, 28.0)

                current_stock = int(daily_burn * days_stock)
                min_threshold = int(daily_burn * 5)  # 5 days safety buffer
                max_capacity = int(daily_burn * 45)  # 45 days max warehouse capacity

                runway_days = round(current_stock / daily_burn, 1) if daily_burn > 0 else 999.0
                
                if runway_days < 3.0:
                    status = "CRITICAL"
                elif runway_days < 7.0:
                    status = "WARNING"
                elif runway_days > 30.0:
                    status = "SURPLUS"
                else:
                    status = "OPTIMAL"

                batch_year = 2025
                expiry_year = random.choice([2027, 2028])
                expiry_month = random.randint(1, 12)
                expiry_date = f"{expiry_year}-{expiry_month:02d}-28"

                inventory[m_id] = {
                    "medicine_id": m_id,
                    "name": med["name"],
                    "generic": med["generic"],
                    "category": med["category"],
                    "unit": med["unit"],
                    "cold_chain": med["cold_chain"],
                    "criticality": med["criticality"],
                    "current_stock": current_stock,
                    "daily_burn_rate": daily_burn,
                    "min_threshold": min_threshold,
                    "max_capacity": max_capacity,
                    "days_runway": runway_days,
                    "status": status,
                    "batch_no": f"BATCH-{batch_year}-{random.randint(1000, 9999)}",
                    "expiry_date": expiry_date,
                    "last_replenished": "2026-09-15"
                }

            self.facilities[fac_id] = {
                **fac,
                "beds": beds,
                "staff": staff,
                "footfall": footfall,
                "inventory": inventory,
                "status_score": self._compute_facility_health_score(beds, staff, inventory),
                "active_alerts": []
            }

        self._refresh_facility_alerts()
        self.save_state()
        print(f"Generated fresh state for {len(self.facilities)} facilities.")

    def _compute_facility_health_score(self, beds: Dict, staff: Dict, inventory: Dict) -> int:
        """Computes a 0-100 composite operational health score."""
        score = 100
        # Deduct for critical stock
        for m in inventory.values():
            if m["status"] == "CRITICAL":
                score -= 12
            elif m["status"] == "WARNING":
                score -= 4
        # Deduct for bed crunch
        tot_beds = sum(b["total"] for b in beds.values())
        tot_occ = sum(b["occupied"] for b in beds.values())
        if tot_beds > 0 and (tot_occ / tot_beds) > 0.90:
            score -= 15
        elif tot_beds > 0 and (tot_occ / tot_beds) > 0.80:
            score -= 7
        # Deduct for doctor shortage
        mo = staff.get("medical_officers", {"sanctioned": 1, "present": 1})
        if mo["present"] < mo["sanctioned"]:
            score -= 10
        return max(15, min(100, score))

    def _refresh_facility_alerts(self):
        """Scans facilities and populates active alerts."""
        for fac_id, fac in self.facilities.items():
            alerts = []
            # Check inventory
            for m_id, item in fac["inventory"].items():
                if item["status"] == "CRITICAL":
                    alerts.append({
                        "id": f"ALT-{fac_id}-{m_id}",
                        "level": "CRITICAL",
                        "category": "INVENTORY_STOCKOUT",
                        "title": f"Critical Stockout Risk: {item['name']}",
                        "message": f"Only {item['current_stock']} {item['unit']} remaining ({item['days_runway']} days runway at current burn rate {item['daily_burn_rate']}/day). Immediate cross-district replenishment needed.",
                        "facility_id": fac_id,
                        "facility_name": fac["name"],
                        "timestamp": datetime.utcnow().isoformat() + "Z"
                    })
                elif item["status"] == "WARNING":
                    alerts.append({
                        "id": f"ALT-{fac_id}-{m_id}",
                        "level": "WARNING",
                        "category": "INVENTORY_LOW",
                        "title": f"Low Buffer Alert: {item['name']}",
                        "message": f"Inventory down to {item['days_runway']} days runway ({item['current_stock']} {item['unit']}).",
                        "facility_id": fac_id,
                        "facility_name": fac["name"],
                        "timestamp": datetime.utcnow().isoformat() + "Z"
                    })

            # Check ICU / Oxygen bed exhaustion
            icu = fac["beds"].get("icu_ventilator", {"total": 0, "available": 0})
            if icu["total"] > 0 and icu["available"] == 0:
                alerts.append({
                    "id": f"ALT-{fac_id}-ICU",
                    "level": "CRITICAL",
                    "category": "BED_CAPACITY",
                    "title": "100% ICU Ventilator Bed Saturation",
                    "message": f"All {icu['total']} ICU ventilator beds occupied. Emergency patient diversion protocol recommended.",
                    "facility_id": fac_id,
                    "facility_name": fac["name"],
                    "timestamp": datetime.utcnow().isoformat() + "Z"
                })

            oxygen = fac["beds"].get("oxygen_supported", {"total": 0, "available": 0})
            if oxygen["total"] > 0 and oxygen["available"] <= 1:
                alerts.append({
                    "id": f"ALT-{fac_id}-O2",
                    "level": "WARNING",
                    "category": "BED_CAPACITY",
                    "title": "Oxygen Bed Capacity Exhaustion",
                    "message": f"Only {oxygen['available']} of {oxygen['total']} oxygen beds available.",
                    "facility_id": fac_id,
                    "facility_name": fac["name"],
                    "timestamp": datetime.utcnow().isoformat() + "Z"
                })

            fac["active_alerts"] = alerts
            fac["status_score"] = self._compute_facility_health_score(fac["beds"], fac["staff"], fac["inventory"])

    def get_summary(self) -> Dict[str, Any]:
        """Provides national macro overview for command dashboard."""
        total_facilities = len(self.facilities)
        total_states = len(set(f["state_code"] for f in self.facilities.values()))
        
        total_beds = 0
        occupied_beds = 0
        total_oxygen_beds = 0
        occupied_oxygen_beds = 0
        total_icu_beds = 0
        occupied_icu_beds = 0

        total_staff_sanctioned = 0
        total_staff_present = 0

        critical_stock_count = 0
        warning_stock_count = 0
        total_alerts = 0

        for f in self.facilities.values():
            for b in f["beds"].values():
                total_beds += b["total"]
                occupied_beds += b["occupied"]
            
            o2 = f["beds"].get("oxygen_supported", {"total": 0, "occupied": 0})
            total_oxygen_beds += o2["total"]
            occupied_oxygen_beds += o2["occupied"]

            icu = f["beds"].get("icu_ventilator", {"total": 0, "occupied": 0})
            total_icu_beds += icu["total"]
            occupied_icu_beds += icu["occupied"]

            for s in f["staff"].values():
                total_staff_sanctioned += s["sanctioned"]
                total_staff_present += s["present"]

            for m in f["inventory"].values():
                if m["status"] == "CRITICAL":
                    critical_stock_count += 1
                elif m["status"] == "WARNING":
                    warning_stock_count += 1

            total_alerts += len(f["active_alerts"])

        bed_occupancy_rate = round((occupied_beds / total_beds) * 100, 1) if total_beds > 0 else 0.0
        staff_attendance_rate = round((total_staff_present / total_staff_sanctioned) * 100, 1) if total_staff_sanctioned > 0 else 0.0

        return {
            "total_phc_network_count": 13919,  # India national PHC scale represented
            "active_telemetry_nodes": total_facilities,
            "monitored_states": total_states,
            "total_beds": total_beds,
            "occupied_beds": occupied_beds,
            "available_beds": total_beds - occupied_beds,
            "bed_occupancy_rate": bed_occupancy_rate,
            "oxygen_beds": {"total": total_oxygen_beds, "occupied": occupied_oxygen_beds, "available": total_oxygen_beds - occupied_oxygen_beds},
            "icu_beds": {"total": total_icu_beds, "occupied": occupied_icu_beds, "available": total_icu_beds - occupied_icu_beds},
            "medical_personnel": {
                "sanctioned": total_staff_sanctioned,
                "on_duty": total_staff_present,
                "attendance_rate": staff_attendance_rate
            },
            "inventory_health": {
                "critical_shortages": critical_stock_count,
                "warning_low": warning_stock_count,
                "optimal_supplies": (len(NLEM_MEDICINES) * total_facilities) - critical_stock_count - warning_stock_count
            },
            "total_active_alerts": total_alerts,
            "active_emergency": self.active_emergency,
            "redistribution_dispatches_active": len([t for t in self.transfer_orders if t.get("status") in ["IN_TRANSIT", "DISPATCHED", "PENDING_APPROVAL"]]),
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }

    def get_facilities(self, state: Optional[str] = None, district: Optional[str] = None,
                       f_type: Optional[str] = None, search: Optional[str] = None) -> List[Dict[str, Any]]:
        results = []
        for f in self.facilities.values():
            if state and f["state_code"].upper() != state.upper():
                continue
            if district and f["district"].lower() != district.lower():
                continue
            if f_type and f["type"].upper() != f_type.upper():
                continue
            if search:
                query = search.lower()
                if (query not in f["name"].lower() and
                    query not in f["district"].lower() and
                    query not in f["id"].lower()):
                    continue
            results.append(f)
        return results

    def get_facility(self, facility_id: str) -> Optional[Dict[str, Any]]:
        return self.facilities.get(facility_id)

    def update_stock(self, facility_id: str, med_id: str, quantity: int, 
                     operation: str = "ADD", reported_by: str = "Staff Nurse", 
                     batch_no: Optional[str] = None, remarks: str = "") -> Dict[str, Any]:
        fac = self.facilities.get(facility_id)
        if not fac:
            raise ValueError(f"Facility {facility_id} not found")
        
        item = fac["inventory"].get(med_id)
        if not item:
            raise ValueError(f"Medicine {med_id} not in inventory catalog")

        old_stock = item["current_stock"]
        if operation == "ADD":
            item["current_stock"] += quantity
        elif operation == "SET":
            item["current_stock"] = max(0, quantity)
        elif operation == "CONSUME":
            item["current_stock"] = max(0, item["current_stock"] - quantity)
        else:
            raise ValueError(f"Unsupported operation {operation}")

        if batch_no:
            item["batch_no"] = batch_no
        item["last_replenished"] = datetime.utcnow().strftime("%Y-%m-%d")

        # Recalculate runway
        daily_burn = item["daily_burn_rate"]
        item["days_runway"] = round(item["current_stock"] / daily_burn, 1) if daily_burn > 0 else 999.0
        
        if item["days_runway"] < 3.0:
            item["status"] = "CRITICAL"
        elif item["days_runway"] < 7.0:
            item["status"] = "WARNING"
        elif item["days_runway"] > 30.0:
            item["status"] = "SURPLUS"
        else:
            item["status"] = "OPTIMAL"

        self._refresh_facility_alerts()
        self.save_state()

        audit_entry = {
            "id": f"AUD-{len(self.audit_log)+1:05d}",
            "facility_id": facility_id,
            "facility_name": fac["name"],
            "medicine_id": med_id,
            "medicine_name": item["name"],
            "old_stock": old_stock,
            "new_stock": item["current_stock"],
            "operation": operation,
            "reported_by": reported_by,
            "remarks": remarks,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
        self.audit_log.insert(0, audit_entry)
        return audit_entry

    def trigger_epidemic_simulation(self, scenario: str, target_state: Optional[str] = None) -> Dict[str, Any]:
        """
        Simulates sudden public health emergency outbreaks:
        - DENGUE_SPIKE: Massive surge in vector-borne fever and dengue antigen demand.
        - MONSOON_FLOOD_GASTRO: Severe waterborne gastro outbreak, ORS & IV fluid drain.
        - HEATWAVE_SURGE: Acute heatstroke, dehydration, oxygen & DNS deficit.
        - SNAKEBITE_CLUSTER: High agricultural harvest season anti-snake venom deficit.
        """
        target_state = target_state or ("KL" if scenario == "DENGUE_SPIKE" else 
                                       "AS" if scenario == "MONSOON_FLOOD_GASTRO" else 
                                       "RJ" if scenario == "HEATWAVE_SURGE" else "UP")

        affected_facilities = [f for f in self.facilities.values() if f["state_code"] == target_state]
        if not affected_facilities:
            affected_facilities = list(self.facilities.values())[:4]

        affected_names = [f["name"] for f in affected_facilities]

        if scenario == "DENGUE_SPIKE":
            for f in affected_facilities:
                # Spike fever footfall
                f["footfall"]["fever_clinic_today"] = int(f["footfall"]["fever_clinic_today"] * 3.8)
                f["footfall"]["opd_today"] = int(f["footfall"]["opd_today"] * 2.2)
                # Rapidly drain Dengue kits and Paracetamol
                if "SUP-02" in f["inventory"]:
                    f["inventory"]["SUP-02"]["current_stock"] = max(5, int(f["inventory"]["SUP-02"]["current_stock"] * 0.15))
                    f["inventory"]["SUP-02"]["daily_burn_rate"] = int(f["inventory"]["SUP-02"]["daily_burn_rate"] * 4.5)
                if "MED-01" in f["inventory"]:
                    f["inventory"]["MED-01"]["current_stock"] = max(100, int(f["inventory"]["MED-01"]["current_stock"] * 0.20))
                    f["inventory"]["MED-01"]["daily_burn_rate"] = int(f["inventory"]["MED-01"]["daily_burn_rate"] * 3.5)
                if "MED-10" in f["inventory"]:
                    f["inventory"]["MED-10"]["current_stock"] = max(10, int(f["inventory"]["MED-10"]["current_stock"] * 0.25))
                # Fill general and oxygen beds
                for b_type in ["general_male", "general_female", "oxygen_supported"]:
                    if b_type in f["beds"]:
                        tot = f["beds"][b_type]["total"]
                        f["beds"][b_type]["occupied"] = min(tot, tot)
                        f["beds"][b_type]["available"] = max(0, tot - f["beds"][b_type]["occupied"])

            self.active_emergency = {
                "id": "EMERGENCY-DENGUE-2026",
                "scenario": scenario,
                "title": f"Dengue & Thrombocytopenia Outbreak Cluster ({target_state})",
                "state": target_state,
                "affected_facilities": [f["id"] for f in affected_facilities],
                "affected_names": affected_names,
                "severity": "CRITICAL / LEVEL-3",
                "triggered_at": datetime.utcnow().isoformat() + "Z",
                "required_assets": ["SUP-02 (Dengue Kits)", "MED-01 (Paracetamol)", "SUP-03 (PRBC Blood/Platelets)", "MED-10 (DNS Fluids)"]
            }

        elif scenario == "MONSOON_FLOOD_GASTRO":
            for f in affected_facilities:
                f["footfall"]["diarrheal_today"] = int(f["footfall"]["diarrheal_today"] * 5.2)
                if "MED-03" in f["inventory"]:
                    f["inventory"]["MED-03"]["current_stock"] = max(20, int(f["inventory"]["MED-03"]["current_stock"] * 0.12))
                    f["inventory"]["MED-03"]["daily_burn_rate"] = int(f["inventory"]["MED-03"]["daily_burn_rate"] * 4.8)
                if "MED-12" in f["inventory"]:
                    f["inventory"]["MED-12"]["current_stock"] = max(40, int(f["inventory"]["MED-12"]["current_stock"] * 0.2))
                if "MED-10" in f["inventory"]:
                    f["inventory"]["MED-10"]["current_stock"] = max(15, int(f["inventory"]["MED-10"]["current_stock"] * 0.18))
            
            self.active_emergency = {
                "id": "EMERGENCY-FLOOD-GASTRO-2026",
                "scenario": scenario,
                "title": f"Brahmaputra/Coastal Flood Acute Waterborne Gastro Surge ({target_state})",
                "state": target_state,
                "affected_facilities": [f["id"] for f in affected_facilities],
                "affected_names": affected_names,
                "severity": "CRITICAL / LEVEL-3",
                "triggered_at": datetime.utcnow().isoformat() + "Z",
                "required_assets": ["MED-03 (ORS Sachets)", "MED-12 (Zinc Sulfate)", "MED-10 (IV DNS 5%)"]
            }

        elif scenario == "SNAKEBITE_CLUSTER":
            for f in affected_facilities:
                if "MED-04" in f["inventory"]:
                    f["inventory"]["MED-04"]["current_stock"] = max(1, int(f["inventory"]["MED-04"]["current_stock"] * 0.08))
                    f["inventory"]["MED-04"]["daily_burn_rate"] = int(f["inventory"]["MED-04"]["daily_burn_rate"] * 3.5)
                # Ventilator beds required for envenomation neurotoxicity
                if "icu_ventilator" in f["beds"] and f["beds"]["icu_ventilator"]["total"] > 0:
                    f["beds"]["icu_ventilator"]["occupied"] = f["beds"]["icu_ventilator"]["total"]
                    f["beds"]["icu_ventilator"]["available"] = 0

            self.active_emergency = {
                "id": "EMERGENCY-SNAKEBITE-2026",
                "scenario": scenario,
                "title": f"Post-Monsoon Agricultural Snakebite Spike ({target_state})",
                "state": target_state,
                "affected_facilities": [f["id"] for f in affected_facilities],
                "affected_names": affected_names,
                "severity": "LIFE_SAVING / LEVEL-4",
                "triggered_at": datetime.utcnow().isoformat() + "Z",
                "required_assets": ["MED-04 (Anti-Snake Venom ASV)", "SUP-01 (Medical Oxygen)", "ICU Ventilators"]
            }

        # Recalculate runways
        for f in affected_facilities:
            for item in f["inventory"].values():
                d_burn = item["daily_burn_rate"]
                item["days_runway"] = round(item["current_stock"] / d_burn, 1) if d_burn > 0 else 999.0
                if item["days_runway"] < 3.0:
                    item["status"] = "CRITICAL"
                elif item["days_runway"] < 7.0:
                    item["status"] = "WARNING"
                else:
                    item["status"] = "OPTIMAL"

        self._refresh_facility_alerts()
        self.save_state()
        return self.active_emergency

    def clear_emergency(self):
        self.active_emergency = None
        self.initialize_state(force_reset=True)
        return {"status": "SUCCESS", "message": "Emergency cleared and baseline network restored."}

    def save_state(self):
        try:
            payload = {
                "facilities": self.facilities,
                "transfer_orders": self.transfer_orders,
                "audit_log": self.audit_log[:50],  # Keep last 50
                "active_emergency": self.active_emergency,
                "federated_rounds_history": self.federated_rounds_history
            }
            with open(DATA_FILE, "w", encoding="utf-8") as f:
                json.dump(payload, f, indent=2)
        except Exception as e:
            print(f"Error saving state: {e}")

# Global singleton
db = HealthGridDatabase()
