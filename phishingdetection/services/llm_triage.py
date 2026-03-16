import json
import re
from groq import Groq
from config.settings import settings
from models.schemas import TriageOutput, Classification

TRIAGE_PROMPT = """You are a cybersecurity analyst specializing in phishing detection.

Analyze this email and classify it as one of: SAFE, SUSPICIOUS, or PHISHING.

Email Details:
- Sender: {sender}
- Subject: {subject}
- Body: {body}
- URLs found: {urls}

Respond with ONLY valid JSON (no markdown, no code blocks):
{{"classification": "safe" | "suspicious" | "phishing", "confidence": 0.0 to 1.0, "reason": "brief explanation"}}"""


class LLMTriage:
    def __init__(self):
        self.client = Groq(api_key=settings.GROQ_API_KEY_TRIAGE)
        self.model = settings.TRIAGE_MODEL

    def classify(self, parsed_email: dict) -> TriageOutput:
        prompt = TRIAGE_PROMPT.format(
            sender=parsed_email.get("sender", ""),
            subject=parsed_email.get("subject", ""),
            body=parsed_email.get("body", "")[:2000],
            urls=", ".join(parsed_email.get("urls", [])[:10]),
        )

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            max_tokens=300,
        )

        raw = response.choices[0].message.content.strip()
        raw = re.sub(r'^```(?:json)?\s*', '', raw)
        raw = re.sub(r'\s*```$', '', raw)

        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            return TriageOutput(
                classification=Classification.SUSPICIOUS,
                confidence=0.5,
                reason="LLM output could not be parsed; marking as suspicious for safety.",
            )

        classification = data.get("classification", "suspicious").lower()
        if classification not in ("safe", "suspicious", "phishing"):
            classification = "suspicious"

        return TriageOutput(
            classification=Classification(classification),
            confidence=min(1.0, max(0.0, float(data.get("confidence", 0.5)))),
            reason=data.get("reason", ""),
        )
