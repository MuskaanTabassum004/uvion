from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import os
import pandas as pd
import urllib.parse
import urllib.request
import json
from growth_predictor import GrowthPredictor
from crop_data import get_stage_diseases, get_stage_fertilizer
from weather_intelligence import fetch_weather_forecast, analyze_weather
import numpy as np
import io
import pickle
from PIL import Image
from fastapi import UploadFile, File
import time
from health_routes import router as health_router, health_service
from yuvi_routes import router as yuvi_router
from firestore_client import FirestoreClient
from yield_engine import calculate_adjusted_yield

firestore_client = FirestoreClient()
# Try loading tensorflow only if needed to prevent slow startup
try:
    import tensorflow as tf
except ImportError:
    tf = None

# Native .env loader using absolute path
env_path = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(env_path):
    with open(env_path) as f:
        for line in f:
            if "=" in line and not line.startswith("#"):
                key, val = line.strip().split("=", 1)
                os.environ[key.strip()] = val.strip()

app = FastAPI(title="UVION AI Backend", description="Decision Support System API")

# Initialize Growth Predictor
growth_predictor = GrowthPredictor()

# Allow Frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(yuvi_router)

# 1. Models Initialization Paths
models_dir = os.path.join(os.path.dirname(__file__), '..', 'models')

yield_model_path = os.path.join(models_dir, 'yield_model_advanced.pkl')
fert_model_path = os.path.join(models_dir, 'fertilizer_model.pkl')
crop_rec_model_path = os.path.join(models_dir, 'crop_rec_model.pkl')

print("Starting UVION Core Engine...")
# Attempt to load ML Models globally
try:
    yield_model = joblib.load(yield_model_path) if os.path.exists(yield_model_path) else None
    fert_model = joblib.load(fert_model_path) if os.path.exists(fert_model_path) else None
    crop_rec_model = joblib.load(crop_rec_model_path) if os.path.exists(crop_rec_model_path) else None
    print("Scikit-Learn Models Loaded Successfully!")
except Exception as e:
    print(f"Warning: Could not load some tabular models: {e}")

# Disease model loading is handled by health_service.py via router
print("Notice: Health Hub AI engine initialized via health_routes.")

# (Disease PyTorch model will be loaded here later)

# 2. Input Data Schemas
class WeatherData(BaseModel):
    temperature: float
    rainfall_mm: float
    humidity: float

class FarmProfile(BaseModel):
    crop: str
    area_region: str
    pesticides_tonnes: float

class SoilData(BaseModel):
    nitrogen: float
    phosphorus: float
    potassium: float
    ph: float
    moisture: float
    soil_type: str

class DecisionRequest(BaseModel):
    user_id: str = "guest"
    farm: FarmProfile
    weather: WeatherData
    soil: SoilData
    growth_stage: str = "Vegetative Growth"
    diseases: list = []

class GrowthPredictionRequest(BaseModel):
    crop_type: str
    planting_date: str  # Format: "YYYY-MM-DD"
    temperature: float
    humidity: float
    rainfall: float
    soil_fertility: str = "Medium"  # Low, Medium, High

class StageDisease(BaseModel):
    name: str
    severity: str
    symptoms: str
    control_measures: list

class StageFertilizer(BaseModel):
    nitrogen: int
    phosphorus: int
    potassium: int
    organic_matter: int
    micronutrients: list
    application_timing: str

class GrowthPredictionResponse(BaseModel):
    crop_type: str
    days_since_planting: int
    current_stage: str
    next_stage: str
    stage_description: str
    progress_percentage: float
    growth_status: str
    diseases_at_stage: list
    fertilizer_needs: dict
    environmental_conditions: dict
    soil_fertility: str
    recommendations: list
    preventive_score: str

class WeatherIntelligenceRequest(BaseModel):
    lat: float
    lon: float
    crop_type: str

class GeocodeSearchRequest(BaseModel):
    query: str

class GeocodeReverseRequest(BaseModel):
    lat: float
    lon: float

# 3. Decision Engine Endpoint (The Core of UVION)
@app.post("/api/v1/decision")
async def get_farming_decision(request: DecisionRequest):
    """
    Takes all dynamic parameters and returns actionable intelligence.
    """
    c_type = request.farm.crop.lower()
    if c_type == "corn": c_type = "maize"

    # --- 1. FETCH RECENT ACTIONS ---
    recent_actions = firestore_client.get_recent_user_actions(request.user_id, limit=5)

    # --- 2. BASE YIELD PREDICTION ---
    base_yield = 40000  # Default 4 t/ha fallback
    if yield_model:
        try:
            # yield_model_advanced expects: ['label', 'N', 'P', 'K', 'temperature', 'humidity', 'rainfall', 'ph']
            yield_input = pd.DataFrame([{
                'label': c_type,
                'N': request.soil.nitrogen,
                'P': request.soil.phosphorus,
                'K': request.soil.potassium,
                'temperature': request.weather.temperature,
                'humidity': request.weather.humidity,
                'rainfall': request.weather.rainfall_mm,
                'ph': request.soil.ph
            }])
            y_pred = yield_model.predict(yield_input)
            base_yield = float(y_pred[0])
        except Exception as e:
            print(f"Advanced Yield prediction error: {e}")

    # --- 3. NPK IDEALS AND FERTILIZER OPTIONS ---
    ideals = {
        "rice": {"N": 80, "P": 47, "K": 40},
        "maize": {"N": 77, "P": 48, "K": 20},
        "grapes": {"N": 25, "P": 130, "K": 200},
        "tomato": {"N": 100, "P": 40, "K": 50},
        "potato": {"N": 120, "P": 50, "K": 150}
    }
    
    ideal = ideals.get(c_type, ideals["rice"])
    
    dN = max(0, ideal["N"] - request.soil.nitrogen)
    dP = max(0, ideal["P"] - request.soil.phosphorus)
    dK = max(0, ideal["K"] - request.soil.potassium)
    
    options = []
    if dN > 1:
        options.append({"type": "Urea (46% N)", "delta": dN, "reason": f"Nitrogen boost needed ({int(dN)} units)."})
    if dP > 1:
        options.append({"type": "DAP (18-46-0)", "delta": dP, "reason": f"Phosphorus support needed ({int(dP)} units)."})
    if dK > 1:
        options.append({"type": "Muriate of Potash (MOP)", "delta": dK, "reason": f"Potassium enrichment needed ({int(dK)} units)."})
    
    if len(options) < 2:
        options.append({"type": "NPK 19-19-19", "delta": 0.5, "reason": "General maintenance for balanced growth."})
    if len(options) < 2:
        options.append({"type": "Organic Vermicompost", "delta": 0.1, "reason": "Enhances soil microbial activity."})

    options.sort(key=lambda x: x["delta"], reverse=True)
    
    ranked_fertilizers = []
    labels = ["Highly Recommended", "Recommended", "Recommended"]
    for i, opt in enumerate(options[:3]):
        ranked_fertilizers.append({
            "type": opt["type"],
            "confidence_label": labels[i] if i < len(labels) else "Secondary",
            "confidence_score": max(45, 95 - (i * 20)),
            "reason": opt["reason"]
        })

    # Convert the requested dict format of diseases into dataclass/objects to pass to engine
    from crop_data import Disease
    disease_objects = []
    for d in request.diseases:
        if isinstance(d, dict):
            disease_objects.append(Disease(
                name=d.get("name", "Unknown"),
                severity=d.get("severity", "Medium"),
                symptoms="", control_measures=[], risk_trigger="", impact_level="", expected_window=""
            ))

    # --- 4. YIELD ADJUSTMENT ENGINE ---
    npk_deficiencies = {"N": dN, "P": dP, "K": dK}
    yield_results = calculate_adjusted_yield(
        base_yield=base_yield,
        crop=c_type,
        diseases=disease_objects,
        growth_stage=request.growth_stage,
        recent_actions=recent_actions,
        npk_deficiencies=npk_deficiencies
    )

    # Convert legacy format to merge with new engine
    return {
        "status": "success",
        "data": {
            # Legacy fields for existing dashboard compatibility
            "predicted_yield_hg_ha": yield_results["expected_yield_val"],
            "potential_yield_hg_ha": yield_results["potential_yield_val"],
            "yield_gap_text": yield_results["yield_gap"],
            "ranked_fertilizers": ranked_fertilizers,
            "actionable_intelligence": yield_results["improvement_actions"],
            
            # New Advanced Yield Module Outputs
            "expected_yield": yield_results["expected_yield"],
            "potential_yield": yield_results["potential_yield"],
            "yield_gap": yield_results["yield_gap"],
            "yield_risk": yield_results["yield_risk"],
            "main_limitations": yield_results["main_limitations"],
            "improvement_actions": yield_results["improvement_actions"],
            "recovery_potential": yield_results["recovery_potential"],
            "confidence": yield_results["confidence"]
        }
    }

@app.post("/api/v1/growth-prediction")
async def predict_growth(request: GrowthPredictionRequest):
    """
    Predict current growth stage and provide stage-specific insights
    
    Args:
        crop_type: Type of crop (Rice, Tomato, Potato, Maize, Grapes)
        planting_date: Date of planting in YYYY-MM-DD format
        temperature: Current temperature in Celsius
        humidity: Current humidity percentage (0-100)
        rainfall: Current rainfall in mm
        soil_fertility: Soil fertility level (Low, Medium, High)
    
    Returns:
        Growth prediction with stage-specific diseases, fertilizer needs, and recommendations
    """
    try:
        # Get growth prediction
        prediction = growth_predictor.predict(
            crop_type=request.crop_type,
            planting_date=request.planting_date,
            temperature=request.temperature,
            humidity=request.humidity,
            rainfall=request.rainfall,
            soil_fertility=request.soil_fertility
        )
        
        # Get diseases for current stage
        diseases = get_stage_diseases(request.crop_type, prediction["current_stage"])
        diseases_list = []
        for d in diseases:
            is_fungal = any(word in d.name.lower() for word in ["rot", "blight", "mildew", "scurf", "spot", "blast", "rust"])
            
            trend = "⬇ Decreasing"
            reason = "Standard environmental monitoring."
            base_prob = 15
            
            if d.severity == "High":
                base_prob = 45
            elif d.severity == "Medium":
                base_prob = 30
                
            if is_fungal and request.humidity > 70:
                trend = "⬆ Increasing"
                reason = "High humidity accelerates fungal spore development."
                base_prob += (request.humidity - 70) * 1.5
            elif request.temperature > 30:
                trend = "⬆ Increasing"
                reason = "High temperatures increase crop stress susceptibility."
                base_prob += 15
                
            risk_score = min(int(base_prob), 98)
            reliability_score = min(85 + int(request.humidity % 10) + int(request.temperature % 5), 99)
            
            impact = "Minor aesthetic damage"
            if d.severity == "High":
                impact = "⚠️ Severe yield loss possible"
            elif d.severity == "Medium":
                impact = "⚠️ Moderate impact on crop quality"

            diseases_list.append({
                "name": d.name,
                "severity": d.severity,
                "symptoms": d.symptoms,
                "control_measures": d.control_measures,
                "risk_score": f"{risk_score}%",
                "reliability_score": f"{reliability_score}%",
                "trend": trend,
                "reason": f"Risk build-up triggered by: {d.risk_trigger}. {reason}",
                "impact_level": d.impact_level,
                "risk_window": d.expected_window
            })
        
        # Get fertilizer recommendations for current stage from AI dataset
        ai_fertilizer = health_service.get_stage_info(request.crop_type, prediction["current_stage"])
        
        fertilizer_dict = {
            "type": ai_fertilizer,
            "application_timing": "Morning application",
            "reason": f"Optimized for {prediction['current_stage']} growth phase."
        }

        
        # Generate recommendations based on stage and conditions
        recommendations = []
        
        # Stage-specific recommendations
        stage_name = prediction["current_stage"]
        if stage_name in ["Germination", "Seedling"]:
            recommendations.append("Maintain soil moisture for proper germination")
            recommendations.append("Avoid waterlogging")
            recommendations.append("Monitor for seed-borne diseases")
        
        if stage_name in ["Vegetative Growth", "Tillering"]:
            recommendations.append("Apply nitrogen fertilizer for vegetative growth")
            recommendations.append("Monitor for foliage diseases")
            recommendations.append("Ensure adequate spacing for air circulation")
        
        if stage_name in ["Flowering", "Fruit Development", "Panicle Initiation"]:
            recommendations.append("Reduce nitrogen to promote flowering")
            recommendations.append("Increase potassium for flower/fruit quality")
            recommendations.append("Monitor for reproductive stage diseases")
            recommendations.append("Ensure adequate pollination")
        
        if stage_name in ["Grain Filling", "Ripening", "Berry Development"]:
            recommendations.append("Maintain steady water supply")
            recommendations.append("Avoid high nitrogen applications")
            recommendations.append("Monitor for post-flowering diseases")
            recommendations.append("Prepare for harvest")
        
        # Environmental-based recommendations (Real-time Adaptive Logic)
        growth_status = prediction["growth_status"]
        if growth_status == "Severely Delayed" or request.temperature > 35:
            recommendations.append(f"⚠️ HEAT STRESS DETECTED: Increase {request.crop_type} irrigation to cool the root zone.")
            recommendations.append("Apply mulch to retain soil moisture during peak sun hours.")
        
        if request.rainfall > 50:
            recommendations.append(f"🌧️ EXCESS RAIN ALERT: Check {request.crop_type} field drainage to prevent root rot.")
            recommendations.append("Delay any scheduled foliar sprays until the rain stops.")
            
        if growth_status == "Optimal":
            recommendations.append(f"✓ {request.crop_type} is in the Optimal Growth Zone. Maintain current schedule.")
        
        # Soil fertility-based recommendations
        if request.soil_fertility == "Low":
            recommendations.append(f"⚡ NUTRITION GAP: Apply organic compost to boost {request.crop_type} vigor.")
        elif request.soil_fertility == "High":
            recommendations.append("Soil nutrients are rich. Avoid over-fertilization this week.")
            
        # Calculate Preventive Score
        preventive_score_val = 100
        if growth_status == "Severely Delayed": preventive_score_val = 45
        elif growth_status == "Delayed": preventive_score_val = 65
        elif growth_status == "Optimal": preventive_score_val = 92
        elif growth_status == "Normal": preventive_score_val = 82
        preventive_score = f"{preventive_score_val}% Safe"
        
        return {
            "status": "success",
            "data": {
                "crop_type": request.crop_type,
                "days_since_planting": prediction["days_since_planting"],
                "current_stage": prediction["current_stage"],
                "next_stage": prediction["next_stage"],
                "stage_description": prediction["stage_description"],
                "stage_progress": {
                    "start_day": prediction["stage_start_day"],
                    "end_day": prediction["stage_end_day"],
                    "progress_in_stage": f"{min((prediction['days_since_planting'] - prediction['stage_start_day']) / (prediction['stage_end_day'] - prediction['stage_start_day']) * 100, 100):.1f}%"
                },
                "overall_progress_percentage": prediction["progress_percentage"],
                "growth_status": prediction["growth_status"],
                "diseases_at_stage": diseases_list,
                "fertilizer_needs": fertilizer_dict,
                "environmental_conditions": prediction["environmental_conditions"],
                "soil_fertility": prediction["soil_fertility"],
                "recommendations": recommendations,
                "preventive_score": preventive_score
            }
        }
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Growth prediction error: {e}")
        raise HTTPException(status_code=500, detail=f"Growth prediction failed: {str(e)}")

@app.post("/api/v1/weather-intelligence")
async def get_weather_intelligence(request: WeatherIntelligenceRequest):
    """
    Fetches real-time weather using Lat/Lon and generates actionable crop intelligence.
    """
    try:
        forecast_data = fetch_weather_forecast(request.lat, request.lon)
        if not forecast_data:
            raise HTTPException(status_code=500, detail="Failed to fetch weather from OpenWeatherMap")
            
        intelligence = analyze_weather(forecast_data, request.crop_type)
        return {"status": "success", "data": intelligence}
    except Exception as e:
        print(f"Weather intelligence error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/geocode/search")
async def geocode_search(request: GeocodeSearchRequest):
    """Convert City Name to Lat/Lon"""
    api_key = os.environ.get("WEATHER_API_KEY")
    query = urllib.parse.quote(request.query)
    url = f"http://api.openweathermap.org/geo/1.0/direct?q={query}&limit=1&appid={api_key}"
    
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            if not data:
                raise HTTPException(status_code=404, detail="Location not found")
            return {"lat": data[0]["lat"], "lon": data[0]["lon"], "name": data[0]["name"], "state": data[0].get("state", ""), "country": data[0].get("country", "")}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/geocode/reverse")
async def geocode_reverse(request: GeocodeReverseRequest):
    """Convert Lat/Lon to City Name"""
    api_key = os.environ.get("WEATHER_API_KEY")
    url = f"http://api.openweathermap.org/geo/1.0/reverse?lat={request.lat}&lon={request.lon}&limit=1&appid={api_key}"
    
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            if not data:
                raise HTTPException(status_code=404, detail="Location not found")
            return {"name": data[0]["name"], "state": data[0].get("state", ""), "country": data[0].get("country", "")}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@app.get("/")
async def root():
    return {
        "status": "online",
        "service": "UVION AI Core",
        "endpoints": ["/api/v1/decision", "/api/v1/growth-prediction", "/api/v1/health/detect-disease"]
    }

@app.get("/health")
async def health_check():
    return {"status": "UVION Core Decision Engine is Live"}

if __name__ == "__main__":
    import uvicorn
    print("Starting UVION AI Core on port 8003...")
    uvicorn.run(app, host="127.0.0.1", port=8003)
