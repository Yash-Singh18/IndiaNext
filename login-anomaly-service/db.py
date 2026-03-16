import os
import httpx

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

_TABLE = "login_events"


def _headers() -> dict:
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }


async def store_login_event(event: dict) -> None:
    if not SUPABASE_URL:
        return
    try:
        async with httpx.AsyncClient(timeout=10) as c:
            await c.post(f"{SUPABASE_URL}/rest/v1/{_TABLE}", json=event, headers=_headers())
    except Exception as e:
        print(f"[db] store error: {e}")


async def get_previous_login(user_id: str) -> dict | None:
    """Most recent login for this user (before the one we're about to store)."""
    if not SUPABASE_URL:
        return None
    try:
        async with httpx.AsyncClient(timeout=10) as c:
            r = await c.get(
                f"{SUPABASE_URL}/rest/v1/{_TABLE}"
                f"?user_id=eq.{user_id}&order=timestamp.desc&limit=1",
                headers=_headers(),
            )
            rows = r.json() if r.status_code == 200 else []
            return rows[0] if rows else None
    except Exception as e:
        print(f"[db] fetch-previous error: {e}")
        return None


async def get_login_history(user_id: str, limit: int = 20) -> list:
    if not SUPABASE_URL:
        return []
    try:
        async with httpx.AsyncClient(timeout=10) as c:
            r = await c.get(
                f"{SUPABASE_URL}/rest/v1/{_TABLE}"
                f"?user_id=eq.{user_id}&order=timestamp.desc&limit={limit}",
                headers=_headers(),
            )
            return r.json() if r.status_code == 200 else []
    except Exception as e:
        print(f"[db] history error: {e}")
        return []
