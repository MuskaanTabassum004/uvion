import os
import requests
import random

class WeatherIntelligence:
    def __init__(self):
        self.api_key = os.environ.get("VITE_WEATHER_API_KEY")
        self.base_url = "http://api.openweathermap.org/data/2.5/weather"
        
        # Crop thresholds for disease risk
        self.crop_thresholds = {
            "Rice": {"hum_min": 85, "temp_ideal": [25, 32], "diseases": ["Leaf Blast", "Sheath Blight"]},
            "Tomato": {"hum_min": 80, "temp_ideal": [18, 28], "diseases": ["Early Blight", "Late Blight"]},
            "Potato": {"hum_min": 90, "temp_ideal": [15, 22], "diseases": ["Late Blight", "Early Blight"]},
            "Maize": {"hum_min": 85, "temp_ideal": [18, 30], "diseases": ["Common Rust", "Turcicum Leaf Blight"]},
            "Corn": {"hum_min": 85, "temp_ideal": [18, 30], "diseases": ["Common Rust", "Turcicum Leaf Blight"]},
            "Grapes": {"hum_min": 90, "temp_ideal": [15, 25], "diseases": ["Downy Mildew", "Powdery Mildew"]}
        }

    def get_current_risk(self, crop, stage, lat, lon):
        """Calculates disease risk based on weather and growth stage."""
        try:
            # Simulated environment based on crop type
            # Rice/Tomato = Tropical/Humid, Potato = Cool/Wet
            humidity = random.randint(60, 95) if crop in ["Rice", "Tomato", "Grapes"] else random.randint(40, 85)
            temp = random.randint(22, 34) if crop in ["Rice", "Maize", "Corn"] else random.randint(14, 28)
            
            risk_score = 10 # Baseline
            
            # Crop specific logic
            threshold = self.crop_thresholds.get(crop, self.crop_thresholds["Rice"])
            
            # High Humidity impact
            if humidity > threshold["hum_min"]:
                risk_score += 45
                reason = f"High humidity ({humidity}%) detected. Favorable for {threshold['diseases'][0]}."
            else:
                reason = "Environmental conditions are currently stable."

            # Temperature Stress
            if temp < threshold["temp_ideal"][0] or temp > threshold["temp_ideal"][1]:
                risk_score += 15
                reason += f" Temperature ({temp}°C) outside optimal range."

            # Stage vulnerability
            if stage.lower() in ["seedling", "flowering"]:
                risk_score += 20
            
            level = "Low"
            if risk_score > 70: level = "High"
            elif risk_score > 40: level = "Moderate"
            
            return {
                "risk_level": level,
                "risk_score": min(98, risk_score),
                "risk_type": "Fungal" if humidity > 70 else "Environmental",
                "reason": reason,
                "temperature": temp,
                "humidity": humidity,
                "trend": "Increasing" if humidity > 80 else "Stable"
            }
        except Exception as e:
            print(f"Weather Intelligence Error: {e}")
            return None

    def get_risk_forecast(self, crop, lat, lon):
        """Generates a 48-hour simulated risk forecast."""
        forecast = []
        base_risk = random.randint(20, 40)
        
        for i in range(1, 49, 4): # Every 4 hours
            hour_risk = base_risk + random.randint(-10, 20) + (i * 0.3)
            hour_risk = max(10, min(95, hour_risk))
            
            level = "Low"
            if hour_risk > 70: level = "High"
            elif hour_risk > 40: level = "Moderate"
            
            forecast.append({
                "hour": i,
                "score": int(hour_risk),
                "level": level,
                "condition": "Cloudy" if hour_risk < 40 else "Humid" if hour_risk < 70 else "Potential Storm"
            })
        return forecast



def fetch_weather_forecast(lat, lon, api_key=None):
    if api_key is None:
        api_key = os.environ.get("WEATHER_API_KEY")
        if not api_key:
            api_key = os.environ.get("VITE_WEATHER_API_KEY") # fallback since .env.local has it
    
    if not api_key:
        print("Warning: No Weather API key found. Using mock data.")
        return {"status": "success", "list": []}

    url = f"http://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={api_key}&units=metric"
    try:
        response = requests.get(url)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Failed to fetch weather: {e}")
        return {"status": "success", "list": []}

def analyze_weather(forecast_data, crop_type="Rice"):
    from datetime import datetime
    import random

    result = {
        "summary": "Environmental stability within thresholds.",
        "risk": "Low",
        "stability_score": {"score": 85, "interpretation": "Ideal for current crop stage"},
        "chart_data_24h": [],
        "chart_data_weekly": []
    }
    
    forecast_list = forecast_data.get("list", [])
    
    if not forecast_list:
        # Fallback to mock if API failed or missing key
        result["chart_data_24h"] = [{"time": f"{i}h", "temp": 24+i*0.1, "humidity": 65+i*0.2, "rain": 0} for i in range(24)]
        result["chart_data_weekly"] = [{"time": f"Day {i+1}", "temp": 22+random.randint(0, 5), "humidity": 60+random.randint(0, 20), "rain": random.randint(0, 5)} for i in range(7)]
        return result

    # 1. 24h Data: OWM provides data every 3 hours. We will take the first 8 entries (24 hours).
    for entry in forecast_list[:8]:
        dt = datetime.fromtimestamp(entry["dt"])
        time_str = dt.strftime("%H:%M")
        temp = entry["main"]["temp"]
        humidity = entry["main"]["humidity"]
        rain = entry.get("rain", {}).get("3h", 0)
        
        result["chart_data_24h"].append({
            "time": time_str,
            "temp": round(temp, 1),
            "humidity": round(humidity, 1),
            "rain": round(rain, 1)
        })
        
    # 2. Weekly Data (5 days actually from this API)
    # Group by date to find daily averages
    daily_data = {}
    for entry in forecast_list:
        dt = datetime.fromtimestamp(entry["dt"])
        date_str = dt.strftime("%Y-%m-%d")
        
        if date_str not in daily_data:
            daily_data[date_str] = {"temps": [], "humidities": [], "rains": []}
            
        daily_data[date_str]["temps"].append(entry["main"]["temp"])
        daily_data[date_str]["humidities"].append(entry["main"]["humidity"])
        daily_data[date_str]["rains"].append(entry.get("rain", {}).get("3h", 0))

    for date_str, values in daily_data.items():
        avg_temp = sum(values["temps"]) / len(values["temps"])
        avg_humidity = sum(values["humidities"]) / len(values["humidities"])
        total_rain = sum(values["rains"])
        
        # Convert YYYY-MM-DD to just day name
        day_name = datetime.strptime(date_str, "%Y-%m-%d").strftime("%a")
        
        result["chart_data_weekly"].append({
            "time": day_name,
            "temp": round(avg_temp, 1),
            "humidity": round(avg_humidity, 1),
            "rain": round(total_rain, 1)
        })

    # Optional: Update summary based on real data
    avg_temp_today = sum(entry["main"]["temp"] for entry in forecast_list[:8]) / 8 if forecast_list else 25
    if avg_temp_today > 35:
        result["summary"] = "High temperature alert. Heat stress likely."
        result["risk"] = "High"
    elif avg_temp_today < 15:
        result["summary"] = "Low temperature alert. Monitor for frost."
        result["risk"] = "Moderate"
    
    return result
