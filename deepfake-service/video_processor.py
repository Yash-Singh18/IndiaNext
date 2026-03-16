"""
Video processing: extract frames via OpenCV, extract audio via ffmpeg,
run per-frame deepfake detection, generate Grad-CAM for top suspicious frame.
"""
import io
import os
import base64
import logging
import subprocess
import tempfile

import cv2
import numpy as np
from PIL import Image

logger = logging.getLogger(__name__)


class VideoProcessor:
    def __init__(self, image_detector, audio_detector, max_frames: int = 10):
        self.image_det = image_detector
        self.audio_det = audio_detector
        self.max_frames = max_frames

    def extract_frames(self, video_path: str) -> list[Image.Image]:
        cap = cv2.VideoCapture(video_path)
        total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        if total <= 0:
            cap.release()
            raise ValueError("Could not read video frames")

        n = min(self.max_frames, total)
        indices = np.linspace(0, total - 1, n, dtype=int)

        frames = []
        for idx in indices:
            cap.set(cv2.CAP_PROP_POS_FRAMES, int(idx))
            ok, bgr = cap.read()
            if ok:
                frames.append(Image.fromarray(cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)))

        cap.release()
        logger.info("Extracted %d frames from %s", len(frames), video_path)
        return frames

    def extract_audio(self, video_path: str) -> str | None:
        """Extract audio track to a temp WAV; returns path or None."""
        tmp = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
        tmp.close()
        try:
            subprocess.run(
                [
                    "ffmpeg", "-y", "-i", video_path,
                    "-vn", "-acodec", "pcm_s16le", "-ar", "16000", "-ac", "1",
                    tmp.name,
                ],
                capture_output=True,
                check=True,
                timeout=60,
            )
            if os.path.getsize(tmp.name) > 0:
                return tmp.name
        except Exception as exc:
            logger.warning("Audio extraction failed: %s", exc)

        os.unlink(tmp.name)
        return None

    def analyze(self, video_path: str) -> dict:
        frames = self.extract_frames(video_path)
        if not frames:
            raise ValueError("No frames could be extracted")

        # ── Per-frame deepfake detection ─────────────────────────────
        frame_results = [self.image_det.detect(f) for f in frames]
        frame_scores = [r["fake_score"] for r in frame_results]
        avg_score = round(sum(frame_scores) / len(frame_scores), 2)

        # ── Grad-CAM for the SINGLE most suspicious frame ────────────
        top_idx = int(np.argmax(frame_scores))
        heatmap_b64 = self.image_det.heatmap(frames[top_idx])

        buf = io.BytesIO()
        frames[top_idx].save(buf, format="PNG")
        top_frame_b64 = base64.b64encode(buf.getvalue()).decode()

        # ── Audio track analysis (if present) ────────────────────────
        audio_result = None
        audio_path = self.extract_audio(video_path)
        if audio_path:
            try:
                audio_result = self.audio_det.detect(audio_path)
            finally:
                os.unlink(audio_path)

        return {
            "fake_score": avg_score,
            "frame_scores": frame_scores,
            "top_frame_index": top_idx,
            "top_frame_score": frame_scores[top_idx],
            "heatmap": heatmap_b64,
            "top_frame": top_frame_b64,
            "audio_result": audio_result,
        }
