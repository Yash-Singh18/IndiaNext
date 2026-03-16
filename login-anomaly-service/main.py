import hashlib
import os
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel

from detection import detect_anomaly
from geo import geolocate_ip, get_public_ip, random_foreign_location
from db import store_login_event, get_previous_login, get_login_history
from alerts import send_telegram_alert

app = FastAPI(title="Login Anomaly Detection Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class LoginRequest(BaseModel):
    email: str
    password: str
    simulate_foreign: bool = False


def _user_id(email: str) -> str:
    return hashlib.sha256(email.encode()).hexdigest()[:16]


def _real_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "0.0.0.0"


def _is_private(ip: str) -> bool:
    return ip.startswith(("127.", "10.", "172.", "192.168.", "::1", "0.0.0.0"))


@app.post("/api/login")
async def login(req: LoginRequest, request: Request):
    email = req.email.strip().lower()
    user_id = _user_id(email)

    # ── 1. Resolve location ─────────────────────────────────────────────
    if req.simulate_foreign:
        location = random_foreign_location()
        client_ip = location["ip"]
    else:
        client_ip = _real_ip(request)
        if _is_private(client_ip):
            client_ip = await get_public_ip() or client_ip
        location = await geolocate_ip(client_ip)

    # ── 2. Fetch previous login BEFORE storing the new one ──────────────
    prev = await get_previous_login(user_id)

    # ── 3. Anomaly detection ────────────────────────────────────────────
    anomaly = detect_anomaly(location, prev)

    # ── 4. Store new login event ────────────────────────────────────────
    await store_login_event({
        "user_id":    user_id,
        "email":      email,
        "ip_address": client_ip,
        "country":    location.get("country", "Unknown"),
        "city":       location.get("city", "Unknown"),
        "latitude":   location.get("lat", 0),
        "longitude":  location.get("lon", 0),
        "risk_level": anomaly["risk"],
    })

    # ── 5. Alert on HIGH risk ───────────────────────────────────────────
    if anomaly["risk"] == "HIGH":
        await send_telegram_alert(email, location, prev, anomaly)

    # ── 6. Respond ──────────────────────────────────────────────────────
    return {
        "login_status": "SUCCESS",
        "user_id":      user_id,
        "location": {
            "city":    location.get("city", "Unknown"),
            "country": location.get("country", "Unknown"),
            "lat":     location.get("lat", 0),
            "lon":     location.get("lon", 0),
            "ip":      client_ip,
        },
        "previous_login": {
            "city":      prev.get("city", "—"),
            "country":   prev.get("country", "—"),
            "lat":       prev.get("latitude", 0),
            "lon":       prev.get("longitude", 0),
            "timestamp": prev.get("timestamp", "—"),
        } if prev else None,
        "risk":              anomaly["risk"],
        "reason":            anomaly.get("reason"),
        "distance_km":       anomaly.get("distance_km"),
        "time_diff_seconds": anomaly.get("time_diff_seconds"),
        "speed_kmh":         anomaly.get("speed_kmh"),
    }


@app.get("/api/history/{email}")
async def history(email: str):
    email = email.strip().lower()
    user_id = _user_id(email)
    events = await get_login_history(user_id)
    return {"events": events}


@app.get("/health")
def health():
    return {"status": "ok", "service": "login-anomaly-detection"}


app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/")
def index():
    return FileResponse("static/index.html")
