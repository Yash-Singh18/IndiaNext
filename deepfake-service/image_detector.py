"""
Deepfake image detection with torch + timm model loading and Grad-CAM heatmap.

Loading strategy:
  1. Try timm hub (clean torch model, best for Grad-CAM)
  2. Fallback to HuggingFace transformers + lightweight shim
"""
import io
import base64
import logging

import cv2
import numpy as np
import torch
import torch.nn.functional as F
import timm
import timm.data
from PIL import Image
from torchvision import transforms
from pytorch_grad_cam import GradCAM
from pytorch_grad_cam.utils.image import show_cam_on_image
from pytorch_grad_cam.utils.model_targets import ClassifierOutputTarget

logger = logging.getLogger(__name__)


class _HFModelShim(torch.nn.Module):
    """Wraps a HuggingFace transformers model so it accepts a raw tensor."""

    def __init__(self, hf_model):
        super().__init__()
        self.hf_model = hf_model

    def forward(self, x):
        return self.hf_model(pixel_values=x).logits


class DeepfakeImageDetector:
    def __init__(self, model_id: str, device: torch.device | None = None):
        self.device = device or torch.device(
            "cuda" if torch.cuda.is_available() else "cpu"
        )
        logger.info("Loading image model '%s' on %s ...", model_id, self.device)

        self.model, self.transform, self.id2label = self._load(model_id)
        self.model.to(self.device).eval()

        self.fake_idx = self._resolve_fake_index()
        target_layer = self._find_target_layer()
        self.gradcam = GradCAM(model=self.model, target_layers=[target_layer])

        logger.info(
            "ImageDetector ready  labels=%s  fake_idx=%d", self.id2label, self.fake_idx
        )

    # ── model loading ────────────────────────────────────────────────

    def _load(self, model_id: str):
        # Strategy 1: timm hub — gives a clean torch model ideal for Grad-CAM
        try:
            model = timm.create_model(f"hf_hub:{model_id}", pretrained=True)
            cfg = timm.data.resolve_data_config(model.pretrained_cfg)
            tf = timm.data.create_transform(**cfg)
            labels = self._timm_labels(model)
            logger.info("Loaded via timm")
            return model, tf, labels
        except Exception as exc:
            logger.info("timm load failed (%s), trying transformers ...", exc)

        # Strategy 2: HuggingFace transformers + shim
        from transformers import (
            AutoModelForImageClassification,
            AutoImageProcessor,
        )

        hf_model = AutoModelForImageClassification.from_pretrained(model_id)
        proc = AutoImageProcessor.from_pretrained(model_id)
        labels = {int(k): v for k, v in hf_model.config.id2label.items()}

        size = proc.size.get("shortest_edge", proc.size.get("height", 224))
        tf = transforms.Compose(
            [
                transforms.Resize((size, size)),
                transforms.ToTensor(),
                transforms.Normalize(mean=proc.image_mean, std=proc.image_std),
            ]
        )

        model = _HFModelShim(hf_model)
        logger.info("Loaded via transformers + shim")
        return model, tf, labels

    @staticmethod
    def _timm_labels(model) -> dict:
        cfg = getattr(model, "pretrained_cfg", {})
        names = cfg.get("label_names") or cfg.get("labels")
        if names:
            return {i: n for i, n in enumerate(names)}
        nc = getattr(model, "num_classes", 2)
        return {i: f"class_{i}" for i in range(nc)}

    def _resolve_fake_index(self) -> int:
        keywords = ("fake", "deepfake", "manipulated", "synthetic", "ai_generated")
        for idx, label in self.id2label.items():
            if any(k in str(label).lower() for k in keywords):
                return int(idx)
        return 1  # conventional: class 1 = fake

    def _find_target_layer(self):
        """Walk module tree and return the last Conv2d (best for CNN Grad-CAM)."""
        last_conv = None
        for _, m in self.model.named_modules():
            if isinstance(m, torch.nn.Conv2d):
                last_conv = m
        if last_conv is not None:
            return last_conv

        # ViT fallback — last LayerNorm
        last_ln = None
        for _, m in self.model.named_modules():
            if isinstance(m, torch.nn.LayerNorm):
                last_ln = m
        if last_ln is not None:
            return last_ln

        raise RuntimeError("No suitable Grad-CAM target layer found in model")

    # ── inference ────────────────────────────────────────────────────

    def detect(self, image: Image.Image) -> dict:
        tensor = self.transform(image.convert("RGB")).unsqueeze(0).to(self.device)

        with torch.no_grad():
            logits = self.model(tensor)
            probs = F.softmax(logits, dim=1)[0]

        fake_prob = probs[self.fake_idx].item()
        return {
            "fake_probability": fake_prob,
            "fake_score": round(fake_prob * 100, 2),
            "label_scores": {
                str(self.id2label[i]): round(probs[i].item() * 100, 2)
                for i in range(len(probs))
            },
        }

    def heatmap(self, image: Image.Image) -> str:
        """Grad-CAM overlay returned as a base64-encoded PNG."""
        tensor = self.transform(image.convert("RGB")).unsqueeze(0).to(self.device)

        cam_mask = self.gradcam(
            input_tensor=tensor,
            targets=[ClassifierOutputTarget(self.fake_idx)],
        )[0]  # (H_model, W_model)

        # Upscale heatmap to original image resolution for quality
        orig_np = np.array(image.convert("RGB")).astype(np.float32) / 255.0
        h, w = orig_np.shape[:2]
        cam_full = cv2.resize(cam_mask, (w, h))

        overlay = show_cam_on_image(orig_np, cam_full, use_rgb=True)

        buf = io.BytesIO()
        Image.fromarray(overlay).save(buf, format="PNG")
        return base64.b64encode(buf.getvalue()).decode()
