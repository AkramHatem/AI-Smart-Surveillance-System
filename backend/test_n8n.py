import requests


data = {
    "incident_id": 1,
    "incident_type": "fire",
    "confidence": 0.95,
    "timestamp": "2026-06-13T20:30:00",
    "location": "Camera 1",
    "message": "Fire detected in camera 1"
}


response = requests.post(
    "http://localhost:5678/webhook-test/99d0016a-5b6d-42f9-ab87-9c6cb7bd1f00",
    json=data
)


print(response.status_code)
print(response.text)