"""
UVION Growth Prediction Module
Determines current crop growth stage based on time, weather, and environmental conditions
"""

from dataclasses import dataclass
from typing import List, Tuple, Dict
from datetime import datetime, timedelta

@dataclass
class GrowthStage:
    name: str
    start_day: int
    end_day: int
    description: str

@dataclass
class CropProfile:
    name: str
    total_days: int
    stages: List[GrowthStage]
    optimal_temp_min: float
    optimal_temp_max: float
    optimal_humidity_min: float
    optimal_humidity_max: float
    optimal_rainfall_mm: float

# ============================================================================
# CROP GROWTH STAGES FOR ALL 5 CROPS
# ============================================================================

CROP_PROFILES: Dict[str, CropProfile] = {
    "Rice": CropProfile(
        name="Rice",
        total_days=120,
        stages=[
            GrowthStage("Germination", 0, 7, "Seed imbibition and radicle emergence"),
            GrowthStage("Seedling", 7, 21, "Root and shoot establishment"),
            GrowthStage("Tillering", 21, 45, "Shoot multiplication and tiller formation"),
            GrowthStage("Panicle Initiation", 45, 60, "Transition to reproductive phase"),
            GrowthStage("Flowering", 60, 75, "Anthesis and pollination"),
            GrowthStage("Grain Filling", 75, 100, "Grain development and ripening"),
            GrowthStage("Maturity", 100, 120, "Grain maturation and drying"),
        ],
        optimal_temp_min=20.0,
        optimal_temp_max=35.0,
        optimal_humidity_min=60.0,
        optimal_humidity_max=90.0,
        optimal_rainfall_mm=200.0,
    ),
    "Tomato": CropProfile(
        name="Tomato",
        total_days=130,
        stages=[
            GrowthStage("Germination", 0, 7, "Seed germination and emergence"),
            GrowthStage("Seedling", 7, 25, "Vegetative growth, leaf expansion"),
            GrowthStage("Vegetative Growth", 25, 50, "Stem elongation and leaf development"),
            GrowthStage("Flowering", 50, 70, "Flower bud formation and anthesis"),
            GrowthStage("Fruit Development", 70, 90, "Fruit set and early growth"),
            GrowthStage("Ripening", 90, 120, "Fruit maturation and color development"),
            GrowthStage("Harvest Ready", 120, 130, "Fruit at optimal harvest maturity"),
        ],
        optimal_temp_min=18.0,
        optimal_temp_max=30.0,
        optimal_humidity_min=50.0,
        optimal_humidity_max=80.0,
        optimal_rainfall_mm=150.0,
    ),
    "Potato": CropProfile(
        name="Potato",
        total_days=120,
        stages=[
            GrowthStage("Sprouting", 0, 15, "Seed potato sprouting and emergence"),
            GrowthStage("Vegetative Growth", 15, 40, "Leaf and stem development"),
            GrowthStage("Tuber Initiation", 30, 50, "Stolons and tuber formation begins"),
            GrowthStage("Tuber Bulking", 50, 80, "Rapid tuber enlargement"),
            GrowthStage("Maturation", 80, 100, "Tuber skin hardening"),
            GrowthStage("Harvest Ready", 100, 120, "Optimal harvest maturity"),
        ],
        optimal_temp_min=15.0,
        optimal_temp_max=25.0,
        optimal_humidity_min=70.0,
        optimal_humidity_max=85.0,
        optimal_rainfall_mm=180.0,
    ),
    "Maize": CropProfile(
        name="Maize",
        total_days=120,
        stages=[
            GrowthStage("Germination", 0, 7, "Seed germination and coleoptile emergence"),
            GrowthStage("Seedling", 7, 21, "Root and shoot growth"),
            GrowthStage("Vegetative Growth", 21, 50, "Leaf emergence and stem elongation"),
            GrowthStage("Tasseling & Silking", 50, 65, "Panicle and silk emergence"),
            GrowthStage("Grain Filling", 65, 90, "Grain development and starch accumulation"),
            GrowthStage("Maturity", 90, 110, "Physiological maturity and drying"),
            GrowthStage("Harvest Ready", 110, 120, "Grain at harvest moisture"),
        ],
        optimal_temp_min=18.0,
        optimal_temp_max=32.0,
        optimal_humidity_min=50.0,
        optimal_humidity_max=80.0,
        optimal_rainfall_mm=200.0,
    ),
    "Grapes": CropProfile(
        name="Grapes",
        total_days=365,  # Perennial, seasonal cycle
        stages=[
            GrowthStage("Dormancy", 0, 60, "Winter dormancy (Nov-Jan)"),
            GrowthStage("Bud Break", 60, 90, "Bud break and shoot emergence (Feb-Mar)"),
            GrowthStage("Shoot Growth", 90, 150, "Vigorous shoot and leaf growth (Apr-May)"),
            GrowthStage("Flowering", 150, 180, "Flower formation and bloom (Jun)"),
            GrowthStage("Fruit Set", 180, 210, "Berry set and development (Jul)"),
            GrowthStage("Berry Development", 210, 270, "Berry growth and veraison (Aug-Sep)"),
            GrowthStage("Ripening", 270, 330, "Sugar accumulation and ripening (Oct-Nov)"),
            GrowthStage("Harvest Ready", 330, 365, "Optimal harvest window (Nov-Dec)"),
        ],
        optimal_temp_min=20.0,
        optimal_temp_max=30.0,
        optimal_humidity_min=50.0,
        optimal_humidity_max=75.0,
        optimal_rainfall_mm=120.0,
    ),
}


class GrowthPredictor:
    """
    Rule-based growth prediction engine for all crops
    """

    def __init__(self):
        self.crop_profiles = CROP_PROFILES

    def calculate_days_since_planting(self, planting_date: str) -> int:
        """
        Calculate days elapsed since planting
        
        Args:
            planting_date: Date string in format "YYYY-MM-DD"
            
        Returns:
            Number of days since planting
        """
        planting = datetime.strptime(planting_date, "%Y-%m-%d")
        current = datetime.now()
        return (current - planting).days

    def get_growth_stage(self, crop_type: str, days: int) -> Tuple[GrowthStage, str]:
        """
        Map days to specific growth stage for a crop
        
        Args:
            crop_type: Name of the crop
            days: Days since planting
            
        Returns:
            Tuple containing GrowthStage object and next stage name string
        """
        if crop_type not in self.crop_profiles:
            raise ValueError(f"Crop '{crop_type}' not supported")

        profile = self.crop_profiles[crop_type]
        
        # Handle grapes specially (seasonal/calendar-based)
        if crop_type == "Grapes":
            current_date = datetime.now()
            month = current_date.month
            day_of_year = current_date.timetuple().tm_yday
            
            # Map to day_of_year (1-365)
            if month >= 11:  # Nov-Dec
                days = 330 + (day_of_year - 305)
            else:
                days = day_of_year
        
        # Find matching stage
        stages = profile.stages
        for i, stage in enumerate(stages):
            if stage.start_day <= days < stage.end_day:
                next_stage_name = stages[i + 1].name if i < len(stages) - 1 else "Completed"
                return stage, next_stage_name

        # If beyond all stages, return last stage
        return profile.stages[-1], "Completed"

    def calculate_progress_percentage(self, crop_type: str, days: int) -> float:
        """
        Calculate overall crop growth progress (0-100%)
        
        Args:
            crop_type: Name of the crop
            days: Days since planting
            
        Returns:
            Progress percentage (0-100)
        """
        if crop_type not in self.crop_profiles:
            raise ValueError(f"Crop '{crop_type}' not supported")

        profile = self.crop_profiles[crop_type]
        progress = min((days / profile.total_days) * 100, 100)
        return round(progress, 2)

    def calculate_growth_status(
        self,
        crop_type: str,
        temperature: float,
        humidity: float,
        rainfall: float,
    ) -> str:
        """
        Determine if growth is Normal, Delayed, or Accelerated based on conditions
        
        Args:
            crop_type: Name of the crop
            temperature: Current temperature in Celsius
            humidity: Current humidity percentage (0-100)
            rainfall: Current rainfall in mm
            
        Returns:
            Growth status: "Optimal", "Delayed", or "Accelerated"
        """
        if crop_type not in self.crop_profiles:
            raise ValueError(f"Crop '{crop_type}' not supported")

        profile = self.crop_profiles[crop_type]
        
        # Calculate environmental score (0-100)
        temp_score = self._get_factor_score(
            temperature,
            profile.optimal_temp_min,
            profile.optimal_temp_max,
            optimal_value=(profile.optimal_temp_min + profile.optimal_temp_max) / 2
        )
        
        humidity_score = self._get_factor_score(
            humidity,
            profile.optimal_humidity_min,
            profile.optimal_humidity_max,
            optimal_value=(profile.optimal_humidity_min + profile.optimal_humidity_max) / 2
        )
        
        rainfall_score = self._get_factor_score(
            rainfall,
            profile.optimal_rainfall_mm * 0.7,
            profile.optimal_rainfall_mm * 1.3,
            optimal_value=profile.optimal_rainfall_mm
        )
        
        # Average score
        avg_score = (temp_score + humidity_score + rainfall_score) / 3
        
        if avg_score >= 85:
            return "Optimal"
        elif avg_score >= 70:
            return "Normal"
        elif avg_score >= 50:
            return "Delayed"
        else:
            return "Severely Delayed"

    @staticmethod
    def _get_factor_score(
        current_value: float,
        min_range: float,
        max_range: float,
        optimal_value: float,
    ) -> float:
        """
        Calculate score for an environmental factor (0-100)
        """
        if current_value < min_range or current_value > max_range:
            return 0
        
        # Calculate distance from optimal
        if current_value == optimal_value:
            return 100
        elif current_value < optimal_value:
            return 100 * (current_value - min_range) / (optimal_value - min_range)
        else:
            return 100 * (max_range - current_value) / (max_range - optimal_value)

    def predict(
        self,
        crop_type: str,
        planting_date: str,
        temperature: float,
        humidity: float,
        rainfall: float,
        soil_fertility: str = "Medium",
    ) -> dict:
        """
        Complete growth prediction with all insights
        
        Args:
            crop_type: Name of the crop
            planting_date: Planting date in "YYYY-MM-DD" format
            temperature: Current temperature in Celsius
            humidity: Current humidity percentage
            rainfall: Current rainfall in mm
            soil_fertility: Soil fertility level (Low/Medium/High)
            
        Returns:
            Dictionary with growth prediction and recommendations
        """
        # Calculate days
        days = self.calculate_days_since_planting(planting_date)
        
        # Get current stage
        stage, next_stage = self.get_growth_stage(crop_type, days)
        
        # Calculate progress
        progress = self.calculate_progress_percentage(crop_type, days)
        
        # Get growth status
        status = self.calculate_growth_status(crop_type, temperature, humidity, rainfall)
        
        return {
            "crop_type": crop_type,
            "days_since_planting": days,
            "current_stage": stage.name,
            "next_stage": next_stage,
            "stage_description": stage.description,
            "stage_start_day": stage.start_day,
            "stage_end_day": stage.end_day,
            "progress_percentage": progress,
            "growth_status": status,
            "environmental_conditions": {
                "temperature": temperature,
                "humidity": humidity,
                "rainfall": rainfall,
            },
            "soil_fertility": soil_fertility,
        }
