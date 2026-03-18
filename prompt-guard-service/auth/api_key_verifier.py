VALID_KEYS = {
    # Add your API keys here or load from environment/database
}

def verify_api_key(key: str) -> bool:
    return key in VALID_KEYS
