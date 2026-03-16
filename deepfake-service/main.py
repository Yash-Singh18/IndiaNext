"""
NorthStar Deepfake Detection Service — FastAPI entry point.

Endpoints
  POST /api/deepfake/detect   file upload → full analysis
  GET  /api/deepfake/health   readiness check
"""
import io
import os
import base64
import logging
import tempfile
from contextlib import asynccontextmanager

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image

from config import settings
from image_detector import DeepfakeImageDetector
from audio_detector import DeepfakeAudioDetector
from video_processor import VideoProcessor
from explainer import LLMExplainer

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(name)-22s  %(levelname)-5s  %(message)s",
)
logger = logging.getLogger(__name__)

IMAGE_EXTS = {"jpg", "jpeg", "png", "webp", "bmp"}
VIDEO_EXTS = {"mp4", "avi", "mov", "mkv", "webm"}
AUDIO_EXTS = {"wav", "mp3", "ogg", "flac", "m4a"}

# ── globals initialised at startup ───────────────────────────────────
image_detector: DeepfakeImageDetector | None = None
audio_detector: DeepfakeAudioDetector | None = None
video_processor: VideoProcessor | None = None
explainer: LLMExplainer | None = None


@asynccontextmanager
async def lifespan(_app: FastAPI):
    global image_detector, audio_detector, video_processor, explainer

    image_detector = DeepfakeImageDetector(settings.IMAGE_MODEL_ID)
    audio_detector = DeepfakeAudioDetector(
        settings.AUDIO_MODEL_ID, settings.HF_API_TOKEN
    )
    video_processor = VideoProcessor(image_detector, audio_detector)
    explainer = LLMExplainer(settings.GROQ_API_KEY, settings.GROQ_MODEL)

    logger.info("All detectors initialised — service ready")
    yield
    logger.info("Shutting down deepfake service")


app = FastAPI(title="NorthStar Deepfake Detection", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── helpers ──────────────────────────────────────────────────────────

def _media_type(filename: str) -> str:
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext in IMAGE_EXTS:
        return "image"
    if ext in VIDEO_EXTS:
        return "video"
    if ext in AUDIO_EXTS:
        return "audio"
    raise HTTPException(status_code=400, detail=f"Unsupported file type: .{ext}")


def _fallback_risk(score: float) -> str:
    if score < 25:
        return "LOW"
    if score < 50:
        return "MEDIUM"
    if score < 75:
        return "HIGH"
    return "CRITICAL"


def _image_to_b64(image: Image.Image) -> str:
    buf = io.BytesIO()
    image.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode()


# ── routes ───────────────────────────────────────────────────────────

@app.get("/api/deepfake/health")
async def health():
    return {"status": "ok", "model": settings.IMAGE_MODEL_ID}


@app.post("/api/deepfake/detect")
async def detect(file: UploadFile = File(...)):
    media = _media_type(file.filename)
    content = await file.read()

    # Persist upload to a temp file (video/audio processing needs a path)
    suffix = f".{file.filename.rsplit('.', 1)[-1]}"
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    tmp.write(content)
    tmp.close()

    try:
        result: dict = {}
        extra_ctx = ""

        # ── IMAGE ────────────────────────────────────────────────────
        if media == "image":
            img = Image.open(io.BytesIO(content)).convert("RGB")
            det = image_detector.detect(img)
            heatmap_b64 = image_detector.heatmap(img)

            result = {
                "media_type": "image",
                "fake_score": det["fake_score"],
                "label_scores": det["label_scores"],
                "heatmap": heatmap_b64,
                "original_image": _image_to_b64(img),
            }

        # ── VIDEO ────────────────────────────────────────────────────
        elif media == "video":
            vr = video_processor.analyze(tmp.name)

            extra_ctx = (
                f"- Frame scores: {vr['frame_scores']}\n"
                f"- Most suspicious frame #{vr['top_frame_index']+1} "
                f"(score {vr['top_frame_score']})"
            )
            if vr["audio_result"]:
                extra_ctx += (
                    f"\n- Audio FakeScore: {vr['audio_result']['fake_score']}"
                )

            result = {
                "media_type": "video",
                "fake_score": vr["fake_score"],
                "frame_scores": vr["frame_scores"],
                "top_frame_index": vr["top_frame_index"],
                "top_frame_score": vr["top_frame_score"],
                "heatmap": vr["heatmap"],
                "top_frame": vr["top_frame"],
                "audio_result": vr["audio_result"],
                "label_scores": {},
            }

        # ── AUDIO ────────────────────────────────────────────────────
        elif media == "audio":
            det = audio_detector.detect(tmp.name)
            result = {
                "media_type": "audio",
                "fake_score": det["fake_score"],
                "label_scores": det["label_scores"],
                "heatmap": None,
            }

        # ── LLM explanation ──────────────────────────────────────────
        try:
            expl = explainer.explain(
                media_type=result["media_type"],
                fake_score=result["fake_score"],
                label_scores=result.get("label_scores", {}),
                extra=extra_ctx,
            )
            result["indicators"] = expl.get("indicators", [])
            result["explanation"] = expl.get("explanation", "")
            result["risk_level"] = expl.get("risk_level", "UNKNOWN")
        except Exception as exc:
            logger.error("LLM explanation failed: %s", exc)
            result["indicators"] = []
            result["explanation"] = "Analysis complete."
            result["risk_level"] = _fallback_risk(result["fake_score"])

        return result

    finally:
        os.unlink(tmp.name)
