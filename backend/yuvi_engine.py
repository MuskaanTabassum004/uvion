import os
from dotenv import load_dotenv
import google.generativeai as genai
from pydantic import BaseModel
from typing import List, Optional

load_dotenv()

# Configure Gemini
api_key = os.environ.get("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)
    
# Initialize the model (using gemini-2.5-flash)
generation_config = {
    "temperature": 0.7,
    "top_p": 0.95,
    "top_k": 40,
    "max_output_tokens": 1024,
}

SYSTEM_PROMPT = """
You are YUVI, an expert AI Farm Assistant designed for the UVION platform.
You are not a generic chatbot. You are the farmer's personal, highly intelligent daily advisor.

You have TWO memories:
1. Personal Farm Context: The current state of the user's farm (crop, weather, soil, diseases, expected yield, and recent actions).
2. Agricultural Knowledge: Your vast LLM knowledge about farming, diseases, fertilizers, and agronomy.

BEHAVIOR:
- Switch naturally between these modes based on the user's input: Daily Advisor (friendly summaries), Teacher (explaining concepts clearly), Planner (suggesting weekly actions), Emergency Mode (urgent, concise advice when severe disease is detected).
- Keep your answers concise, structured, and easy to read on a mobile screen.
- NEVER give generic advice if you can give advice based on their Personal Farm Context.
- For example, if they ask about watering, check their current humidity/rainfall and crop stage before answering.
- If they ask about yield, mention the specific numbers from their context.
- Speak directly to the farmer in a supportive, professional tone.

ALWAYS use the provided 'CURRENT FARM CONTEXT' below to ground your answer.
"""

def build_farm_context_string(farm_state: dict, recent_actions: list) -> str:
    """
    Translates raw UVION JSON state into a readable context string for YUVI.
    """
    ctx = []
    
    # 1. Farm Profile
    crop = farm_state.get("crop", "Unknown Crop")
    location = farm_state.get("location", "Unknown Location")
    stage = farm_state.get("growth_stage", "Vegetative")
    ctx.append(f"Crop: {crop} | Location: {location} | Stage: {stage}")
    
    # 2. Weather
    weather = farm_state.get("weather", {})
    temp = weather.get("temperature", 25)
    hum = weather.get("humidity", 60)
    rain = weather.get("rainfall_mm", 0)
    ctx.append(f"Weather: {temp}°C, {hum}% Humidity, {rain}mm Rainfall")
    
    # 3. Soil NPK
    soil = farm_state.get("soil", {})
    n = soil.get("nitrogen", 0)
    p = soil.get("phosphorus", 0)
    k = soil.get("potassium", 0)
    ctx.append(f"Soil NPK: N:{n}, P:{p}, K:{k}")
    
    # 4. Health & Yield
    insights = farm_state.get("insights", {})
    exp_yield = insights.get("expected_yield", "Unknown")
    gap = insights.get("yield_gap", "Unknown")
    limitations = ", ".join(insights.get("main_limitations", ["None"]))
    ctx.append(f"Yield Engine: Expected {exp_yield} (Gap: {gap}). Limitations: {limitations}")
    
    # 5. Recent Actions
    if recent_actions:
        actions_str = ", ".join([a.get("action", "") for a in recent_actions if a.get("completed")])
        ctx.append(f"Recent User Actions: {actions_str}")
    else:
        ctx.append("Recent User Actions: None logged.")

    return "\n".join(ctx)

class ChatMessage(BaseModel):
    role: str # "user" or "model"
    content: str

def generate_yuvi_response(user_message: str, chat_history: List[dict], farm_state: dict, recent_actions: list) -> str:
    """
    Calls the Gemini API with the full context and history.
    """
    if not api_key:
        return "I am currently offline. Please configure my GEMINI_API_KEY."

    try:
        model = genai.GenerativeModel(
            model_name="gemini-2.5-flash",
            generation_config=generation_config,
            system_instruction=SYSTEM_PROMPT
        )
        
        # Build Context
        context_str = build_farm_context_string(farm_state, recent_actions)
        
        # We append the hidden context to the user's latest message to ensure the model sees the freshest state
        augmented_user_message = f"""
--- CURRENT FARM CONTEXT ---
{context_str}
----------------------------
User Query: {user_message}
"""
        # Convert history to Gemini format
        formatted_history = []
        for msg in chat_history:
            role = "user" if msg["role"] == "user" else "model"
            formatted_history.append({"role": role, "parts": [msg["content"]]})
            
        chat = model.start_chat(history=formatted_history)
        response = chat.send_message(augmented_user_message)
        
        return response.text
        
    except Exception as e:
        print(f"YUVI Engine Error: {e}")
        return f"I ran into an issue connecting to my knowledge base. Please try again. ({str(e)})"
