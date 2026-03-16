import json
import re
from groq import Groq
from config.settings import settings
from models.schemas import DeepAnalysisOutput, Classification

DEEP_PROMPT = """You are an expert cybersecurity analyst performing deep phishing analysis.

Analyze the following email thoroughly for phishing indicators. Consider:
- Sender legitimacy and domain analysis
- URL safety and redirect patterns
- Language manipulation tactics (urgency, fear, authority)
- Technical header anomalies
- Social engineering techniques

Email Details:
- Sender: {sender}
- Subject: {subject}
- Body: {body}
- URLs: {urls}
- Domain Analysis: {domain_info}
- Language Signals: {language_info}

Respond with ONLY valid JSON (no markdown, no code blocks):
{{"classification": "safe" | "suspicious" | "phishing", "risk_score": 0-100, "reasons": ["reason1", "reason2"], "suspicious_urls": ["url1", "url2"], "recommended_action": "specific action to take"}}"""


class LLMDeepAnalysis:
    def __init__(self):
        self.client = Groq(api_key=settings.GROQ_API_KEY_DEEP)
        self.model = settings.DEEP_MODEL

    def analyze(self, parsed_email: dict, domain_info: dict, language_info: dict) -> DeepAnalysisOutput:
        prompt = DEEP_PROMPT.format(
            sender=parsed_email.get("sender", ""),
            subject=parsed_email.get("subject", ""),
            body=parsed_email.get("body", "")[:3000],
            urls=", ".join(parsed_email.get("urls", [])[:10]),
            domain_info=json.dumps(domain_info, default=str),
            language_info=json.dumps(language_info, default=str),
        )

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            max_tokens=800,
        )

        raw = response.choices[0].message.content.strip()
        raw = re.sub(r'^```(?:json)?\s*', '', raw)
        raw = re.sub(r'\s*```$', '', raw)

        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            return DeepAnalysisOutput(
                classification=Classification.SUSPICIOUS,
                risk_score=50,
                reasons=["Deep analysis LLM output could not be parsed"],
                suspicious_urls=parsed_email.get("urls", []),
                recommended_action="Review email manually - automated analysis was inconclusive",
            )

        classification = data.get("classification", "suspicious").lower()
        if classification not in ("safe", "suspicious", "phishing"):
            classification = "suspicious"

        return DeepAnalysisOutput(
            classification=Classification(classification),
            risk_score=min(100, max(0, int(data.get("risk_score", 50)))),
            reasons=data.get("reasons", []),
            suspicious_urls=data.get("suspicious_urls", []),
            recommended_action=data.get("recommended_action", "Review manually"),
        )
