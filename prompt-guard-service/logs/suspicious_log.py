from datetime import datetime, timezone
from typing import List

_log: List[dict] = []
MAX_LOG = 200


def log_entry(prompt: str, score: int, category: str, action: str):
    _log.insert(0, {
        "prompt":    prompt[:300],   # truncate for storage
        "score":     score,
        "category":  category,
        "action":    action,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })
    if len(_log) > MAX_LOG:
        _log.pop()


def get_logs() -> List[dict]:
    return _log
