"""
redistribution.py
Intelligent Cross-District and Inter-PHC Resource Redistribution Optimization Engine.
Pairs deficit facilities with nearest surplus facilities, taking into account
geographical Haversine distances, road transit speeds, cold-chain safety windows,
and minimum donor safety stock margins.
"""

import math
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional

def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Computes great-circle distance between two GPS coordinates in kilometers."""
    R = 6371.0  # Earth's radius in km
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(R * c, 1)

def estimate_road_transit_hours(dist_km: float, is_cold_chain: bool = False) -> float:
    """Estimates realistic transit time across Indian state highways & rural roads."""
    # Rural/State Highway avg speed: 45 km/h, adding 30 mins dispatch handling overhead
    base_hours = (dist_km / 45.0) + 0.5
    if is_cold_chain:
        # Extra 15 mins for insulated ice-pack vaccine carrier packing
        base_hours += 0.25
    return round(base_hours, 1)

class RedistributionEngine:
    def __init__(self, db_instance):
        self.db = db_instance

    def compute_optimal_redistributions(self) -> List[Dict[str, Any]]:
        """
        Analyzes entire network inventory to find critical deficit nodes
        and pairs them with optimal surplus donor facilities.
        """
        facilities = list(self.db.facilities.values())
        recommendations = []

        # Find all deficit items (< 4 days runway)
        deficits = []
        for fac in facilities:
            for med_id, item in fac["inventory"].items():
                if item["days_runway"] < 4.0:
                    needed_qty = max(item["min_threshold"] * 2 - item["current_stock"], item["daily_burn_rate"] * 7)
                    deficits.append({
                        "facility_id": fac["id"],
                        "facility_name": fac["name"],
                        "facility_type": fac["type"],
                        "district": fac["district"],
                        "state_code": fac["state_code"],
                        "lat": fac["lat"],
                        "lng": fac["lng"],
                        "medicine_id": med_id,
                        "medicine_name": item["name"],
                        "category": item["category"],
                        "unit": item["unit"],
                        "cold_chain": item["cold_chain"],
                        "criticality": item["criticality"],
                        "current_stock": item["current_stock"],
                        "daily_burn_rate": item["daily_burn_rate"],
                        "current_runway": item["days_runway"],
                        "needed_qty": int(needed_qty)
                    })

        # For each deficit, find candidate donor facilities with surplus
        for d in deficits:
            med_id = d["medicine_id"]
            needed = d["needed_qty"]

            candidate_donors = []
            for fac in facilities:
                if fac["id"] == d["facility_id"]:
                    continue  # Can't donate to self
                
                # Check item in donor
                donor_item = fac["inventory"].get(med_id)
                if not donor_item:
                    continue

                donor_stock = donor_item["current_stock"]
                donor_burn = donor_item["daily_burn_rate"]
                donor_min_safe = donor_item["min_threshold"] * 1.5  # Don't cannibalize donor safety buffer

                available_surplus = donor_stock - donor_min_safe
                if available_surplus > 10:  # Has viable transfer volume
                    dist_km = haversine_distance_km(d["lat"], d["lng"], fac["lat"], fac["lng"])
                    
                    # Preference scoring: Same district >> Same state >> Cross state
                    locality_bonus = 0
                    if fac["district"] == d["district"]:
                        locality_bonus = 500
                    elif fac["state_code"] == d["state_code"]:
                        locality_bonus = 200

                    # Hub tier bonus: District Hospital depot preferred over another PHC
                    tier_bonus = 150 if fac["type"] == "DH" else (50 if fac["type"] == "CHC" else 0)

                    # Score = locality + tier - distance
                    priority_score = locality_bonus + tier_bonus - (dist_km * 0.5)

                    candidate_donors.append({
                        "facility": fac,
                        "donor_item": donor_item,
                        "dist_km": dist_km,
                        "available_surplus": int(available_surplus),
                        "priority_score": priority_score
                    })

            if not candidate_donors:
                continue

            # Pick best candidate
            candidate_donors.sort(key=lambda x: x["priority_score"], reverse=True)
            best = candidate_donors[0]
            donor_fac = best["facility"]
            donor_item = best["donor_item"]
            dist_km = best["dist_km"]

            transfer_qty = min(needed, best["available_surplus"])
            transit_hours = estimate_road_transit_hours(dist_km, d["cold_chain"])

            # Compute post-transfer runways
            donor_post_stock = donor_item["current_stock"] - transfer_qty
            donor_post_runway = round(donor_post_stock / donor_item["daily_burn_rate"], 1) if donor_item["daily_burn_rate"] > 0 else 999.0

            receiver_post_stock = d["current_stock"] + transfer_qty
            receiver_post_runway = round(receiver_post_stock / d["daily_burn_rate"], 1) if d["daily_burn_rate"] > 0 else 999.0

            urgency = "IMMEDIATE_DISPATCH" if d["current_runway"] < 2.0 or d["criticality"] == "LIFE_SAVING" else "SCHEDULED_TRANSFER"

            transfer_id = f"TRX-{donor_fac['state_code']}-{len(recommendations)+1:04d}"

            # Logistics description and AI allocation rationale
            is_cross_district = donor_fac["district"] != d["district"]
            is_cross_state = donor_fac["state_code"] != d["state_code"]
            jurisdiction = "Cross-State" if is_cross_state else ("Cross-District" if is_cross_district else "Intra-District")

            rationale = (
                f"Selected {donor_fac['name']} ({donor_fac['type']}) as optimal donor based on "
                f"distance ({dist_km} km), surplus buffer ({best['available_surplus']} {d['unit']}), "
                f"and post-transfer donor stability ({donor_post_runway} days runway remaining). "
                f"{'Requires ILR/Vaccine cold-box maintain 2-8°C with digital data logger.' if d['cold_chain'] else 'Standard pharmaceutical transport container.'}"
            )

            recommendations.append({
                "id": transfer_id,
                "urgency": urgency,
                "jurisdiction": jurisdiction,
                "medicine_id": med_id,
                "medicine_name": d["medicine_name"],
                "category": d["category"],
                "unit": d["unit"],
                "cold_chain": d["cold_chain"],
                "quantity": transfer_qty,
                "source": {
                    "id": donor_fac["id"],
                    "name": donor_fac["name"],
                    "type": donor_fac["type"],
                    "district": donor_fac["district"],
                    "state_code": donor_fac["state_code"],
                    "lat": donor_fac["lat"],
                    "lng": donor_fac["lng"],
                    "pre_stock": donor_item["current_stock"],
                    "post_stock": donor_post_stock,
                    "pre_runway": donor_item["days_runway"],
                    "post_runway": donor_post_runway
                },
                "destination": {
                    "id": d["facility_id"],
                    "name": d["facility_name"],
                    "type": d["facility_type"],
                    "district": d["district"],
                    "state_code": d["state_code"],
                    "lat": d["lat"],
                    "lng": d["lng"],
                    "pre_stock": d["current_stock"],
                    "post_stock": receiver_post_stock,
                    "pre_runway": d["current_runway"],
                    "post_runway": receiver_post_runway
                },
                "logistics": {
                    "distance_km": dist_km,
                    "est_transit_hours": transit_hours,
                    "recommended_carrier": "Refrigerated EV Van" if d["cold_chain"] else "District Health Rapid Dispatch Vehicle",
                    "temperature_protocol": "2°C to 8°C Monitored" if d["cold_chain"] else "Ambient (Below 25°C)",
                    "gate_pass_code": f"GP-{donor_fac['state_code']}-{abs(hash(transfer_id)) % 100000:05d}"
                },
                "rationale": rationale,
                "status": "RECOMMENDED",
                "created_at": datetime.utcnow().isoformat() + "Z"
            })

        return recommendations

    def execute_transfer(self, transfer_id: str, recommendations_list: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Approves and executes a recommended transfer order, adjusting inventories."""
        target_trx = next((t for t in recommendations_list if t["id"] == transfer_id), None)
        if not target_trx:
            # Check existing transfers
            target_trx = next((t for t in self.db.transfer_orders if t["id"] == transfer_id), None)
            if not target_trx:
                raise ValueError(f"Transfer order {transfer_id} not found")

        source_id = target_trx["source"]["id"]
        dest_id = target_trx["destination"]["id"]
        med_id = target_trx["medicine_id"]
        qty = target_trx["quantity"]

        # Deduct from donor
        self.db.update_stock(source_id, med_id, qty, operation="CONSUME",
                             reported_by="District Logistician",
                             remarks=f"Dispatched via transfer {transfer_id} to {target_trx['destination']['name']}")

        # Add to receiver
        self.db.update_stock(dest_id, med_id, qty, operation="ADD",
                             reported_by="District Logistician",
                             remarks=f"Received via transfer {transfer_id} from {target_trx['source']['name']}")

        target_trx["status"] = "DISPATCHED"
        target_trx["dispatched_at"] = datetime.utcnow().isoformat() + "Z"
        target_trx["eta"] = (datetime.utcnow() + timedelta(hours=target_trx["logistics"]["est_transit_hours"])).isoformat() + "Z"

        # Record in active transfers
        existing = [t for t in self.db.transfer_orders if t["id"] == transfer_id]
        if not existing:
            self.db.transfer_orders.insert(0, target_trx)
        else:
            existing[0]["status"] = "DISPATCHED"

        self.db.save_state()
        return target_trx
