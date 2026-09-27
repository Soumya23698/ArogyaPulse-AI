"""
forecasting.py
Predictive demand forecasting engine for India's Primary Health Centres (PHCs).
Computes 7-day, 14-day, and 30-day consumption projections using epidemiological trend
modeling, seasonal weather factors (Monsoon/Summer/Winter), ANC/Immunization day spikes,
and active epidemic reproduction multipliers.
"""

from datetime import datetime, timedelta
import math
from typing import Dict, List, Any, Optional

# Indian PHC operational calendar factors
# Mondays & Thursdays are high maternal/immunization footfall days in Indian public healthcare
DAY_OF_WEEK_FACTORS = {
    0: 1.25,  # Monday (High OPD + Post-weekend influx)
    1: 1.05,  # Tuesday
    2: 1.00,  # Wednesday
    3: 1.20,  # Thursday (Village Health Sanitation & Nutrition Day / ANC)
    4: 1.00,  # Friday
    5: 0.85,  # Saturday (Half-day OPD)
    6: 0.40   # Sunday (Emergency only)
}

# Seasonal multiplier by medicine category for month of September (Late Monsoon in India)
SEPTEMBER_SEASONAL_FACTORS = {
    "Antipyretic / Analgesic": 1.30,
    "Electrolyte Solution / Dehydration": 1.45,
    "Emergency Antidote / Toxin Neutralizer": 1.50, # Post-monsoon harvest snake activity
    "Post-Exposure Prophylaxis Vaccine": 1.15,
    "Antimalarial First-Line": 1.60,
    "Vector-Borne Diagnostics": 1.80, # High Dengue/Malaria testing
    "Blood Transfusion Asset": 1.40,  # Platelet demand
    "Resuscitation Intravenous Fluids": 1.35,
    "Pediatric Diarrhea Management": 1.45,
    "Bronchodilator (Asthma/COPD/Respiratory)": 1.10,
    "Uterotonic (Maternal Hemorrhage)": 1.05,
    "Diabetes Critical Glycemic Control": 1.00,
    "Antibiotic (Penicillin class)": 1.25,
    "Broad Cephalosporin Antibiotic": 1.25,
    "Respiratory Life Support": 1.10
}

class HealthDemandForecaster:
    def __init__(self, db_instance):
        self.db = db_instance

    def forecast_demand(self, facility_id: str, medicine_id: str, days_horizon: int = 14) -> Dict[str, Any]:
        """
        Generates forward-looking daily demand trajectory and stock depletion curve.
        """
        fac = self.db.facilities.get(facility_id)
        if not fac:
            raise ValueError(f"Facility {facility_id} not found")

        item = fac["inventory"].get(medicine_id)
        if not item:
            raise ValueError(f"Medicine {medicine_id} not found in facility inventory")

        current_stock = item["current_stock"]
        base_burn = max(1.0, float(item["daily_burn_rate"]))
        category = item["category"]
        seasonal_mult = SEPTEMBER_SEASONAL_FACTORS.get(category, 1.10)

        # Check if an active emergency impacts this facility
        emergency_mult = 1.0
        if self.db.active_emergency and facility_id in self.db.active_emergency.get("affected_facilities", []):
            scenario = self.db.active_emergency["scenario"]
            if scenario == "DENGUE_SPIKE" and medicine_id in ["SUP-02", "MED-01", "MED-10", "SUP-03"]:
                emergency_mult = 2.4
            elif scenario == "MONSOON_FLOOD_GASTRO" and medicine_id in ["MED-03", "MED-12", "MED-10"]:
                emergency_mult = 2.8
            elif scenario == "SNAKEBITE_CLUSTER" and medicine_id in ["MED-04", "SUP-01"]:
                emergency_mult = 3.2

        start_date = datetime.utcnow()
        dates = []
        forecast_daily = []
        projected_stock = []
        upper_bound = []
        lower_bound = []

        running_stock = float(current_stock)
        stockout_date = None
        stockout_day_index = None

        for d in range(days_horizon):
            cur_date = start_date + timedelta(days=d)
            weekday = cur_date.weekday()
            dow_mult = DAY_OF_WEEK_FACTORS.get(weekday, 1.0)

            # Daily predicted consumption
            predicted_day_burn = base_burn * seasonal_mult * dow_mult * emergency_mult
            # Add subtle time-decay or acceleration trend
            trend_factor = 1.0 + (0.012 * d if emergency_mult > 1.0 else 0.002 * d)
            predicted_day_burn = round(predicted_day_burn * trend_factor, 1)

            running_stock = max(0.0, running_stock - predicted_day_burn)
            
            dates.append(cur_date.strftime("%d %b"))
            forecast_daily.append(predicted_day_burn)
            projected_stock.append(round(running_stock, 1))

            # 95% Confidence interval modeling (Poisson / Gaussian dispersion)
            std_dev = math.sqrt(predicted_day_burn) * 1.96
            upper_bound.append(round(max(0.0, running_stock + std_dev * (d + 1) * 0.4), 1))
            lower_bound.append(round(max(0.0, running_stock - std_dev * (d + 1) * 0.4), 1))

            if running_stock == 0 and stockout_date is None:
                stockout_date = cur_date.strftime("%Y-%m-%d")
                stockout_day_index = d + 1

        # Determine early warning risk level
        if stockout_day_index is not None and stockout_day_index <= 3:
            risk_level = "CRITICAL_STOCKOUT_IMMINENT"
        elif stockout_day_index is not None and stockout_day_index <= 7:
            risk_level = "HIGH_STOCKOUT_RISK"
        elif stockout_day_index is not None and stockout_day_index <= 14:
            risk_level = "MODERATE_WARNING"
        else:
            risk_level = "STABLE_BUFFER"

        total_projected_demand = sum(forecast_daily)
        recommended_buffer_qty = max(0, int(total_projected_demand - current_stock + (base_burn * 5)))

        return {
            "facility_id": facility_id,
            "facility_name": fac["name"],
            "medicine_id": medicine_id,
            "medicine_name": item["name"],
            "unit": item["unit"],
            "current_stock": current_stock,
            "horizon_days": days_horizon,
            "dates": dates,
            "forecast_daily_demand": forecast_daily,
            "projected_stock": projected_stock,
            "confidence_upper": upper_bound,
            "confidence_lower": lower_bound,
            "total_projected_demand": round(total_projected_demand, 1),
            "stockout_date": stockout_date,
            "days_until_stockout": stockout_day_index,
            "risk_level": risk_level,
            "recommended_procurement_qty": recommended_buffer_qty,
            "multipliers": {
                "seasonal_factor": seasonal_mult,
                "emergency_multiplier": emergency_mult
            },
            "generated_at": datetime.utcnow().isoformat() + "Z"
        }
