def make_decision(score: int) -> dict:
    if score >= 70:
        return {
            "status": "SUSPICIOUS",
            "action": "BLOCK",
            "reason": "High-risk prompt blocked by policy engine",
        }
    if score >= 30:
        return {
            "status": "SUSPICIOUS",
            "action": "FLAG",
            "reason": "Potentially suspicious prompt flagged for review",
        }
    return {
        "status": "SAFE",
        "action": "ALLOW",
        "reason": None,
    }
