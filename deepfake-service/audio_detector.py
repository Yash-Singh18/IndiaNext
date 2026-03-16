"""
Audio deepfake detection via HuggingFace Inference API.

Model: harshit345/xlsr-wav2vec-speech-deepfake-detection
Returns fake probability and per-label scores.
"""
import logging
import time

import requests

logger = logging.getLogger(__name__)

HF_API_URL = "https://api-inference.huggingface.co/models/{model_id}"


class AudioDetectionError(RuntimeError):
    """Raised when the upstream audio model cannot be used."""


class DeepfakeAudioDetector:
    def __init__(self, model_id: str, hf_token: str):
        self.url = HF_API_URL.format(model_id=model_id)
        self.headers = {"Authorization": f"Bearer {hf_token}"}
        self.model_id = model_id
        logger.info("AudioDetector ready  model=%s", model_id)

    def detect(self, audio_path: str) -> dict:
        with open(audio_path, "rb") as f:
            data = f.read()

        # HF Inference API cold-start retry
        for attempt in range(3):
            try:
                resp = requests.post(
                    self.url, headers=self.headers, data=data, timeout=120
                )
            except requests.RequestException as exc:
                raise AudioDetectionError(
                    "Audio analysis is temporarily unavailable."
                ) from exc

            if resp.status_code == 503:
                wait = min(resp.json().get("estimated_time", 20), 30)
                logger.info(
                    "Audio model loading, waiting %.0fs (attempt %d/3)",
                    wait,
                    attempt + 1,
                )
                time.sleep(wait)
                continue

            if resp.status_code == 410:
                raise AudioDetectionError(
                    "Audio analysis is currently unavailable because the upstream "
                    "model endpoint is gone."
                )

            try:
                resp.raise_for_status()
            except requests.HTTPError as exc:
                raise AudioDetectionError(
                    f"Audio analysis failed with upstream status {resp.status_code}."
                ) from exc
            break
        else:
            raise AudioDetectionError(
                "Audio analysis is temporarily unavailable after multiple retries."
            )

        results = resp.json()

        # Parse label scores — handle common label conventions:
        #   bonafide/spoof (ASVspoof), real/fake, 0/1
        fake_prob = 0.0
        label_scores = {}

        for item in results:
            label = item["label"]
            score = item["score"]
            label_scores[label] = round(score * 100, 2)

            ll = label.lower()
            if any(k in ll for k in ("fake", "spoof", "deepfake", "synthetic")):
                fake_prob = max(fake_prob, score)
            elif any(k in ll for k in ("bonafide", "real", "genuine", "original")):
                fake_prob = max(fake_prob, 1.0 - score)

        return {
            "fake_probability": fake_prob,
            "fake_score": round(fake_prob * 100, 2),
            "label_scores": label_scores,
        }
