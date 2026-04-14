import requests
import json

token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJoZWxsbyIsImV4cCI6MTc3NjEzOTgxNn0.PR-jAeUAUew_1sR8oEL3euF8x1O_DHXxdm0mLseyGUo"
url = "http://localhost:8000/api/invitations"
headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {token}"
}
data = {
    "email": "shashujasmine2012@gmail.com",
    "content": "Test from python script"
}

try:
    response = requests.post(url, headers=headers, json=data)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")

