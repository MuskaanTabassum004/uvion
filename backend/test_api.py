import requests

url = "http://127.0.0.1:8000/api/v1/growth-prediction"
data = {
  "crop_type": "Rice",
  "planting_date": "2024-05-01",
  "temperature": 28,
  "humidity": 75,
  "rainfall": 100,
  "soil_fertility": "Medium"
}

try:
    response = requests.post(url, json=data)
    print("Status:", response.status_code)
    print("Response:", response.json())
except Exception as e:
    print("Error:", str(e))
