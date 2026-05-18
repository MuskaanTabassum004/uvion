# UVION AI Backend

This is the FastAPI-based decision engine for the UVION farming system. It handles growth prediction, weather intelligence, and risk analysis.

## Prerequisites
- Python 3.8+
- [OpenWeatherMap API Key](https://openweathermap.org/api)

## Setup Instructions

1. **Navigate to the backend directory**:
   ```powershell
   cd "e:\mushu projects\uvion\backend"
   ```

2. **Install dependencies**:
   It is recommended to use a virtual environment.
   ```powershell
   pip install -r requirements.txt
   ```

3. **Configure Environment Variables**:
   Create or edit the `.env` file in the `backend` directory:
   ```env
   WEATHER_API_KEY=your_openweathermap_api_key_here
   VITE_API_BASE_URL=http://localhost:8000
   ```

4. **Run the Development Server**:
   ```powershell
   uvicorn main:app --reload --port 8000
   ```

## API Documentation
Once the server is running, you can access the interactive API docs at:
- Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
- ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)

## Core Endpoints
- `POST /api/v1/growth-prediction`: Analyzes crop growth stage and stage-specific risks.
- `POST /api/v1/weather-intelligence`: Real-time weather analysis and irrigation alerts.
- `POST /api/v1/decision`: Aggregated yield and fertilizer prediction.
