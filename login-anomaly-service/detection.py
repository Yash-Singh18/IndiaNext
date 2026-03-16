import math
from datetime import datetime, timezone

SPEED_THRESHOLD_KMH = 900  # faster than any commercial aircraft


def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance in km between two (lat, lon) pairs."""
    R = 6371  # Earth's mean radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    )
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def detect_anomaly(current_location: dict, previous_login: dict | None) -> dict:
    """Compare *current_location* against *previous_login* and return a risk verdict."""
    if not previous_login:
        return {"risk": "LOW", "reason": "First login for this account — no baseline yet"}

    lat1 = float(previous_login.get("latitude") or 0)
    lon1 = float(previous_login.get("longitude") or 0)
    lat2 = float(current_location.get("lat") or 0)
    lon2 = float(current_location.get("lon") or 0)

    distance_km = haversine(lat1, lon1, lat2, lon2)

    # Time delta
    ts_raw = previous_login.get("timestamp", "")
    try:
        prev_time = datetime.fromisoformat(ts_raw.replace("Z", "+00:00"))
    except Exception:
        prev_time = datetime.now(timezone.utc)
    now = datetime.now(timezone.utc)
    time_diff = max((now - prev_time).total_seconds(), 1)  # avoid div-by-zero

    speed_kmh = (distance_km / time_diff) * 3600

    result = {
        "distance_km": round(distance_km, 1),
        "time_diff_seconds": round(time_diff, 1),
        "speed_kmh": round(speed_kmh, 1),
    }

    if distance_km < 50:
        result["risk"] = "LOW"
        result["reason"] = "Same region — no anomaly"
    elif speed_kmh > SPEED_THRESHOLD_KMH:
        result["risk"] = "HIGH"
        result["reason"] = (
            f"Impossible travel — {round(distance_km):,} km in {round(time_diff)}s "
            f"({round(speed_kmh):,} km/h, max plausible {SPEED_THRESHOLD_KMH} km/h)"
        )
    elif speed_kmh > 500:
        result["risk"] = "MEDIUM"
        result["reason"] = f"Elevated travel speed — {round(speed_kmh):,} km/h"
    else:
        result["risk"] = "LOW"
        result["reason"] = "Travel speed within normal range"

    return result
