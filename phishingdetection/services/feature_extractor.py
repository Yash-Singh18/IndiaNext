import re
from typing import Dict, List
from Levenshtein import distance as levenshtein_distance

KNOWN_BRANDS = [
    "paypal.com", "google.com", "microsoft.com", "apple.com", "amazon.com",
    "facebook.com", "instagram.com", "twitter.com", "netflix.com", "linkedin.com",
    "dropbox.com", "chase.com", "wellsfargo.com", "bankofamerica.com", "citibank.com",
    "americanexpress.com", "dhl.com", "fedex.com", "ups.com", "usps.com",
    "walmart.com", "ebay.com", "yahoo.com", "outlook.com", "icloud.com",
    "adobe.com", "spotify.com", "steam.com", "epic.com", "roblox.com",
]

SUSPICIOUS_TLDS = [
    ".xyz", ".top", ".club", ".work", ".click", ".link", ".info", ".buzz",
    ".icu", ".tk", ".ml", ".ga", ".cf", ".gq", ".pw", ".cc",
]

URGENCY_KEYWORDS = [
    "urgent", "immediately", "act now", "limited time", "expires", "suspended",
    "verify your account", "confirm your identity", "update your payment",
    "unusual activity", "unauthorized", "security alert", "account locked",
    "password reset", "click here", "log in now", "within 24 hours",
    "failure to", "will be closed", "will be suspended", "action required",
]

FINANCIAL_KEYWORDS = [
    "wire transfer", "bank account", "credit card", "social security",
    "routing number", "account number", "pin number", "tax refund",
    "invoice", "payment", "billing", "cryptocurrency", "bitcoin", "wallet",
]

CREDENTIAL_KEYWORDS = [
    "password", "username", "login", "credentials", "ssn", "social security",
    "date of birth", "mother's maiden name", "security question",
]


class FeatureExtractor:
    @staticmethod
    def analyze_domain(domain: str) -> Dict:
        if not domain:
            return {"is_typosquatting": False, "similar_to": None, "similarity_score": 0.0, "tld_suspicious": False}

        best_match = None
        best_score = 0.0
        domain_base = domain.split(".")[0] if "." in domain else domain

        for brand in KNOWN_BRANDS:
            brand_base = brand.split(".")[0]
            if domain == brand:
                return {"is_typosquatting": False, "similar_to": brand, "similarity_score": 1.0, "tld_suspicious": False}

            dist = levenshtein_distance(domain_base, brand_base)
            max_len = max(len(domain_base), len(brand_base))
            if max_len == 0:
                continue
            similarity = 1 - (dist / max_len)

            if similarity > best_score and similarity >= 0.6:
                best_score = similarity
                best_match = brand

        tld_suspicious = any(domain.endswith(tld) for tld in SUSPICIOUS_TLDS)
        is_typosquatting = best_match is not None and best_score >= 0.7 and domain != best_match

        return {
            "is_typosquatting": is_typosquatting,
            "similar_to": best_match,
            "similarity_score": round(best_score, 3),
            "tld_suspicious": tld_suspicious,
        }

    @staticmethod
    def analyze_language(text: str) -> Dict:
        text_lower = text.lower()

        urgency_hits = [kw for kw in URGENCY_KEYWORDS if kw in text_lower]
        financial_hits = [kw for kw in FINANCIAL_KEYWORDS if kw in text_lower]
        credential_hits = [kw for kw in CREDENTIAL_KEYWORDS if kw in text_lower]

        total_hits = len(urgency_hits) + len(financial_hits) + len(credential_hits)
        language_score = min(100, total_hits * 15)

        return {
            "urgency_keywords": urgency_hits,
            "financial_keywords": financial_hits,
            "credential_keywords": credential_hits,
            "language_score": language_score,
        }

    @staticmethod
    def analyze_urls(urls: List[str]) -> List[Dict]:
        results = []
        for url in urls:
            domain = FeatureExtractor._url_to_domain(url)
            analysis = FeatureExtractor.analyze_domain(domain)
            analysis["url"] = url
            analysis["domain"] = domain
            results.append(analysis)
        return results

    @staticmethod
    def _url_to_domain(url: str) -> str:
        match = re.search(r'https?://([^/\s:?#]+)', url)
        return match.group(1).lower() if match else ""
