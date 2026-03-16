from models.schemas import (
    TriageOutput, DeepAnalysisOutput, URLReport,
    ThreatBreakdown, Classification,
)
from typing import List, Dict, Optional

WEIGHT_LLM = 0.40
WEIGHT_URL = 0.25
WEIGHT_DOMAIN = 0.20
WEIGHT_LANGUAGE = 0.15


class ThreatScorer:
    @staticmethod
    def compute(
        triage: TriageOutput,
        deep_analysis: Optional[DeepAnalysisOutput],
        url_reports: List[URLReport],
        domain_analyses: List[Dict],
        language_info: Dict,
    ) -> ThreatBreakdown:
        # LLM score (0-100)
        if deep_analysis:
            llm_score = float(deep_analysis.risk_score)
        else:
            classification_map = {
                Classification.SAFE: 0.0,
                Classification.SUSPICIOUS: 50.0,
                Classification.PHISHING: 85.0,
            }
            llm_score = classification_map.get(triage.classification, 50.0) * triage.confidence

        # URL score (0-100)
        url_score = 0.0
        if url_reports:
            malicious_count = sum(1 for r in url_reports if r.is_malicious)
            homoglyph_count = sum(1 for r in url_reports if r.is_homoglyph)
            redirect_count = sum(1 for r in url_reports if len(r.redirect_chain) > 2)
            url_signals = malicious_count * 35 + homoglyph_count * 25 + redirect_count * 15
            url_score = min(100.0, url_signals)

        # Domain score (0-100)
        domain_score = 0.0
        if domain_analyses:
            typosquat_count = sum(1 for d in domain_analyses if d.get("is_typosquatting"))
            suspicious_tld_count = sum(1 for d in domain_analyses if d.get("tld_suspicious"))
            domain_score = min(100.0, typosquat_count * 40 + suspicious_tld_count * 25)

        # Language score (0-100)
        language_score = float(language_info.get("language_score", 0))

        # Weighted final score
        final_score = (
            llm_score * WEIGHT_LLM
            + url_score * WEIGHT_URL
            + domain_score * WEIGHT_DOMAIN
            + language_score * WEIGHT_LANGUAGE
        )

        return ThreatBreakdown(
            llm_score=round(llm_score, 1),
            url_score=round(url_score, 1),
            domain_score=round(domain_score, 1),
            language_score=round(language_score, 1),
            final_score=round(min(100, max(0, final_score)), 1),
        )

    @staticmethod
    def classify_score(score: float) -> Classification:
        if score < 30:
            return Classification.SAFE
        elif score < 60:
            return Classification.SUSPICIOUS
        else:
            return Classification.PHISHING
