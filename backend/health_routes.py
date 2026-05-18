from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from typing import List, Optional
from health_service import HealthService
from weather_intelligence import WeatherIntelligence
import time
import uuid

router = APIRouter(prefix="/api/v1/health", tags=["Health Hub"])
health_service = HealthService()
weather_intel = WeatherIntelligence()

@router.post("/detect-disease")
async def detect_disease(
    file: UploadFile = File(...), 
    crop_stage: str = "Vegetative",
    uid: Optional[str] = Query(None)
):
    try:
        contents = await file.read()
        results = health_service.predict(contents, crop_stage=crop_stage)
        
        if not results:
            raise HTTPException(status_code=404, detail="No disease patterns recognized.")
            
        # The primary prediction is the first one
        primary = results[0]
        
        # Format Top-3 for the UI
        top3 = [
            {"disease": r["disease"], "confidence": r["confidence"]} 
            for r in results
        ]
        
        # Generate a Scan ID and metadata
        scan_id = str(uuid.uuid4())
        
        return {
            "status": "success",
            "data": {
                "scan_id": scan_id,
                "disease": primary["disease"],
                "crop": primary["crop"],
                "confidence": primary["confidence"],
                "top3": top3,
                "symptoms": primary["symptoms"],
                "causes": primary["causes"],
                "management": primary["management"],
                "affected_area": primary["affected_area"],
                "severity": primary["severity"],
                "urgency": "High" if primary["confidence"] > 0.8 else "Medium",
                "treatment_plans": primary["treatment_plan"],
                "weather_treatment": primary["weather_treatment"],
                "stage_fertilizer": primary.get("stage_fertilizer"),
                "disease_fertilizers": primary["fertilizers"],
                "ai_reasoning": primary["ai_reasoning"],
                "timestamp": time.time()
            }
        }
        
        return response_data
    except Exception as e:
        print(f"Health API Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/records")
async def get_records(uid: str = Query(...)):
    # Handled by frontend now
    return {"status": "success", "data": []}

@router.get("/risk")
async def get_risk(
    crop: str, 
    stage: str = Query("Vegetative"), 
    lat: float = Query(0.0), 
    lon: float = Query(0.0)
):
    risk = weather_intel.get_current_risk(crop, stage, lat, lon)
    if not risk:
        raise HTTPException(status_code=500, detail="Risk calculation failed")
        
    # Include 48-hour forecast
    forecast = weather_intel.get_risk_forecast(crop, lat, lon)
    risk["forecast"] = forecast
    
    return {"status": "success", "data": risk}



@router.get("/overview")
async def get_overview(
    uid: str, 
    crop: str, 
    lat: float = 0.0, 
    lon: float = 0.0,
    actions_done: int = 0
):
    # Calculate environmental risk
    risk = weather_intel.get_current_risk(crop, "Vegetative", lat, lon)
    
    # Base calculation (Base 100 - Risk penalty)
    risk_penalty = (risk["risk_score"] / 2)
    
    # Calculate Base Score
    base_score = 95 - risk_penalty
    
    # Apply Intervention Bonus (Actions performed by user)
    # Each action improves health by 5 points (capped at +20)
    action_bonus = min(20, actions_done * 5)
    
    # Final health score calculation
    health_score = int(base_score + action_bonus)
    health_score = max(5, min(100, health_score)) # Clamp between 5 and 100
    
    active_alerts = 0
    if risk["risk_level"] == "High": active_alerts = 3
    elif risk["risk_level"] == "Moderate": active_alerts = 1
    
    return {
        "status": "success",
        "data": {
            "health_score": health_score,
            "active_alerts": active_alerts,
            "risk_summary": risk["reason"],
            "latest_scan": "Neural Sync Active",
            "status_label": "Healthy" if health_score > 80 else "At Risk" if health_score > 60 else "Critical",
            "action_impact": action_bonus
        }
    }



@router.post("/actions")
async def save_action(uid: str = Query(...), action: dict = None):
    # Handled by frontend now
    return {"status": "success", "data": {"action_id": "fe_handled"}}


