import re
import base64

# (pattern, category, score)
INJECTION_PATTERNS = [
    (r"ignore\s+(all\s+|previous\s+|prior\s+|your\s+|the\s+|system\s+)?instructions?",    "Instruction Override",   88),
    (r"disregard\s+(all\s+|previous\s+|prior\s+|your\s+)?instructions?",                   "Instruction Override",   88),
    (r"reveal\s+(the\s+|your\s+|all\s+)?system\s+prompt",                                  "System Prompt Extraction", 92),
    (r"show\s+(me\s+|us\s+)?(the\s+|your\s+|hidden\s+|secret\s+)?(system\s+)?prompt",      "System Prompt Extraction", 85),
    (r"what\s+(is|are)\s+(your\s+)?(system\s+prompt|instructions|rules|guidelines)",        "System Prompt Extraction", 80),
    (r"act\s+as\s+(a\s+|an\s+|the\s+)?developer",                                          "Role Impersonation",     78),
    (r"you\s+are\s+now\s+(in\s+)?(developer|admin|god|jailbreak|dan)\s+mode",               "Jailbreak",              95),
    (r"bypass\s+(all\s+|your\s+|the\s+|these\s+|security\s+|safety\s+|content\s+)?restrictions?", "Restriction Bypass", 82),
    (r"forget\s+(everything|all|your|previous|prior)\s+(you\s+know|instructions?|training|rules)", "Training Override", 85),
    (r"your\s+(new\s+|real\s+|true\s+)?instructions?\s+(are|is|will\s+be)",                 "Instruction Injection",  88),
    (r"(print|output|display|tell\s+me|give\s+me|reveal)\s+(the\s+|your\s+|all\s+)?password", "Data Exfiltration",   82),
    (r"pretend\s+(you\s+are|you'?re|to\s+be)\s+(an?\s+)?(evil|unrestricted|unfiltered|uncensored)", "Jailbreak",      92),
    (r"jailbreak",                                                                           "Jailbreak",              96),
    (r"\bdan\s+mode\b|do\s+anything\s+now",                                                 "Jailbreak",              95),
    (r"hypothetically\s+(speaking\s*)?,?\s+(if\s+you|you\s+could|imagine)",                 "Hypothetical Bypass",    62),
    (r"(encode|decode)\s+(in\s+)?base64",                                                   "Obfuscation Attempt",    68),
    (r"override\s+(your\s+)?(safety|content|ethical)\s+(filters?|guidelines?|rules?|policy)", "Safety Override",      90),
    (r"(you\s+must|you\s+will|you\s+should)\s+(now\s+)?(act|behave|respond|pretend|roleplay)", "Role Override",      72),
    (r"new\s+persona|switch\s+persona|change\s+your\s+(role|persona|identity)",             "Role Override",          72),
]


def _try_decode_base64(text: str) -> str:
    """Decode any base64-like blobs found in the text."""
    pattern = re.compile(r'[A-Za-z0-9+/]{20,}={0,2}')
    def replace(m):
        try:
            decoded = base64.b64decode(m.group()).decode("utf-8", errors="ignore")
            if decoded.isprintable():
                return decoded
        except Exception:
            pass
        return m.group()
    return pattern.sub(replace, text)


def preprocess(prompt: str) -> str:
    prompt = re.sub(r'\s+', ' ', prompt).strip()
    prompt = _try_decode_base64(prompt)
    return prompt


def heuristic_scan(prompt: str) -> dict:
    # Token length bomb
    if len(prompt) > 6000:
        return {"score": 58, "category": "Token Bomb", "reason": "Unusually long prompt — possible token injection"}

    cleaned = preprocess(prompt).lower()

    best_score = 0
    best_category = None
    best_reason = None

    for pattern, category, score in INJECTION_PATTERNS:
        if re.search(pattern, cleaned):
            if score > best_score:
                best_score = score
                best_category = category
                best_reason = f"{category} pattern detected"

    return {"score": best_score, "category": best_category, "reason": best_reason}
