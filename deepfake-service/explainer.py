"""
Groq LLM (Llama 3.3 70B) explanation engine.

Takes raw detection scores and produces human-readable indicators,
a risk level, and a narrative explanation.
"""
import json
import logging

from groq import Groq

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """\
You are a deepfake forensics expert. Given detection scores, return a JSON
object with forensic indicators, a risk assessment, and a plain-language
explanation.  Respond ONLY with valid JSON — no markdown fences."""

USER_TEMPLATE = """\
Deepfake analysis results
=========================
Media type : {media_type}
FakeScore  : {fake_score} / 100
Labels     : {label_scores}
{extra}

Based on the score and media type, generate forensic indicators.
Consider these categories (mark detected true/false as appropriate):
  - Facial warping / geometric inconsistencies
  - GAN artifact patterns (checkerboard, spectral peaks)
  - Unnatural skin texture or lighting
  - Eye / teeth / hair boundary artifacts
  - Voice spectral anomalies (audio / video)
  - Lip-sync mismatch (video with audio)

Return exactly this JSON shape:
{{
  "indicators": [
    {{"label": "string", "detected": true, "detail": "string"}}
  ],
  "explanation": "2-3 sentence summary for a non-technical user",
  "risk_level": "LOW | MEDIUM | HIGH | CRITICAL"
}}"""


class LLMExplainer:
    def __init__(self, api_key: str, model: str = "llama-3.3-70b-versatile"):
        self.client = Groq(api_key=api_key)
        self.model = model
        logger.info("LLMExplainer ready  model=%s", model)

    def explain(
        self,
        media_type: str,
        fake_score: float,
        label_scores: dict,
        extra: str = "",
    ) -> dict:
        prompt = USER_TEMPLATE.format(
            media_type=media_type,
            fake_score=fake_score,
            label_scores=json.dumps(label_scores),
            extra=("\n" + extra) if extra else "",
        )

        resp = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,
            max_tokens=1024,
            response_format={"type": "json_object"},
        )

        try:
            return json.loads(resp.choices[0].message.content)
        except json.JSONDecodeError:
            logger.error("LLM returned invalid JSON: %s", resp.choices[0].message.content)
            return {
                "indicators": [],
                "explanation": "Analysis complete but explanation generation failed.",
                "risk_level": self._fallback_risk(fake_score),
            }

    @staticmethod
    def _fallback_risk(score: float) -> str:
        if score < 25:
            return "LOW"
        if score < 50:
            return "MEDIUM"
        if score < 75:
            return "HIGH"
        return "CRITICAL"
