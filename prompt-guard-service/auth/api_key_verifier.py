VALID_KEYS = {
    "ent_demo_northstar": {"name": "NorthStar Demo", "tier": "enterprise"},
    "ent_test_key_001":   {"name": "Test Enterprise", "tier": "pro"},
}

def verify_api_key(key: str) -> bool:
    return key in VALID_KEYS
