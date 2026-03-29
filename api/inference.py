"""
Inference module — loads model and runs predictions.

When MODEL_PATH exists → loads real MobileNetV3-Small .pth and runs inference.
When MODEL_PATH is missing → returns mock predictions (for development).

To switch from mock to real: just drop the trained .pth file into models/ directory.
"""

import os
import io
import torch
import torch.nn.functional as F
from PIL import Image
from torchvision import transforms

# Import from teammate's model code
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "models", "chestguard.pth")
MODEL_VERSION = "0.1.0-mock"
IMAGE_SIZE = 224
NUM_CLASSES = 5

# Preprocessing pipeline — matches teammate's config (224x224, ImageNet normalization)
preprocess = transforms.Compose([
    transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])

# ── Model singleton ──

_model = None
_model_loaded = False
_using_mock = True


def _load_model():
    """Load the trained model if the .pth file exists."""
    global _model, _model_loaded, _using_mock, MODEL_VERSION

    if os.path.exists(MODEL_PATH):
        try:
            # Import teammate's model architecture
            from src.model import get_model

            model = get_model()
            state_dict = torch.load(MODEL_PATH, map_location="cpu", weights_only=True)
            model.load_state_dict(state_dict)
            model.eval()

            _model = model
            _model_loaded = True
            _using_mock = False
            MODEL_VERSION = "0.1.0"
            print(f"[ChestGuard] Model loaded from {MODEL_PATH}")
        except Exception as e:
            print(f"[ChestGuard] Failed to load model: {e}")
            print("[ChestGuard] Falling back to mock predictions")
            _model_loaded = False
            _using_mock = True
    else:
        print(f"[ChestGuard] No model found at {MODEL_PATH}")
        print("[ChestGuard] Using mock predictions — drop .pth into models/ to enable real inference")
        _using_mock = True


# Load on import
_load_model()


def get_model_status() -> dict:
    return {
        "loaded": _model_loaded,
        "version": MODEL_VERSION,
        "using_mock": _using_mock,
    }


def predict_image(image_bytes: bytes) -> dict:
    """
    Run inference on an image.

    Returns:
        {
            "confidences": [float, float, float, float, float],  # one per condition
            "model_version": str,
            "using_mock": bool,
        }
    """
    if _using_mock:
        return _mock_predict()

    return _real_predict(image_bytes)


def _real_predict(image_bytes: bytes) -> dict:
    """Run real model inference."""
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    tensor = preprocess(image).unsqueeze(0)  # [1, 3, 224, 224]

    with torch.no_grad():
        logits = _model(tensor)  # [1, NUM_CLASSES]
        probs = torch.sigmoid(logits).squeeze(0).tolist()  # [NUM_CLASSES]

    return {
        "confidences": probs,
        "model_version": MODEL_VERSION,
        "using_mock": False,
    }


def _mock_predict() -> dict:
    """Return mock predictions for development when no model is available."""
    import random
    return {
        "confidences": [
            round(random.uniform(0.05, 0.55), 4),  # Atelectasis
            round(random.uniform(0.10, 0.80), 4),  # Cardiomegaly
            round(random.uniform(0.05, 0.40), 4),  # Consolidation
            round(random.uniform(0.15, 0.90), 4),  # Edema
            round(random.uniform(0.10, 0.75), 4),  # Pleural Effusion
        ],
        "model_version": MODEL_VERSION,
        "using_mock": True,
    }
