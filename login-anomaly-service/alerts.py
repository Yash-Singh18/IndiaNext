import os
import httpx

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "")


async def send_telegram_alert(
    email: str, location: dict, prev_login: dict | None, anomaly: dict
) -> None:
    """Fire a Telegram message when impossible travel is detected.

    If TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID aren't set the alert is just
    printed to stdout so the demo still works without a bot.
    """
    prev_city = prev_login.get("city", "?") if prev_login else "?"
    prev_country = prev_login.get("country", "?") if prev_login else "?"

    summary = (
        f"🚨 *Impossible Travel Alert*\n\n"
        f"*User:* `{email}`\n"
        f"*Previous:* {prev_city}, {prev_country}\n"
        f"*Current:*  {location.get('city', '?')}, {location.get('country', '?')}\n"
        f"*Distance:* {anomaly.get('distance_km', 0):,} km\n"
        f"*Speed:*    {anomaly.get('speed_kmh', 0):,} km/h\n"
        f"*Verdict:*  {anomaly.get('reason', '—')}"
    )

    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        print(f"[alert] (telegram not configured) {summary}")
        return

    try:
        async with httpx.AsyncClient(timeout=10) as c:
            await c.post(
                f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage",
                json={
                    "chat_id": TELEGRAM_CHAT_ID,
                    "text": summary,
                    "parse_mode": "Markdown",
                },
            )
    except Exception as e:
        print(f"[alert] telegram send failed: {e}")
