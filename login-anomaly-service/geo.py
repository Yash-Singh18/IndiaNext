import random
import httpx

# Pre-baked foreign locations for the "Simulate Suspicious Login" feature.
# Each one is far enough from India to guarantee impossible-travel detection.
FOREIGN_LOCATIONS = [
    {"city": "Moscow",    "country": "Russia",    "lat": 55.7558,  "lon": 37.6173,  "ip": "95.161.221.1"},
    {"city": "Beijing",   "country": "China",     "lat": 39.9042,  "lon": 116.4074, "ip": "123.125.114.144"},
    {"city": "São Paulo", "country": "Brazil",    "lat": -23.5505, "lon": -46.6333, "ip": "200.160.2.3"},
    {"city": "Lagos",     "country": "Nigeria",   "lat": 6.5244,   "lon": 3.3792,   "ip": "41.190.2.1"},
    {"city": "Sydney",    "country": "Australia",  "lat": -33.8688, "lon": 151.2093, "ip": "203.2.218.1"},
    {"city": "Tokyo",     "country": "Japan",     "lat": 35.6762,  "lon": 139.6503, "ip": "210.171.226.40"},
]


async def get_public_ip() -> str | None:
    """Resolve the container / machine's public IP (for Docker or LAN clients)."""
    try:
        async with httpx.AsyncClient(timeout=5) as c:
            r = await c.get("https://api.ipify.org?format=json")
            return r.json().get("ip")
    except Exception:
        return None


async def geolocate_ip(ip: str) -> dict:
    """Call ip-api.com (free, no key needed, 45 req/min)."""
    try:
        async with httpx.AsyncClient(timeout=5) as c:
            r = await c.get(f"http://ip-api.com/json/{ip}?fields=status,country,city,lat,lon,query")
            data = r.json()
            if data.get("status") == "success":
                return data
    except Exception:
        pass
    return {"country": "Unknown", "city": "Unknown", "lat": 0, "lon": 0}


def random_foreign_location() -> dict:
    return random.choice(FOREIGN_LOCATIONS)
