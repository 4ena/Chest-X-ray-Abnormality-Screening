import os
import torch

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
MODEL_DIR = os.path.join(BASE_DIR, "models")
OUTPUT_DIR = os.path.join(BASE_DIR, "outputs")

IMAGE_SIZE = 224
BATCH_SIZE = 8
NUM_EPOCHS = 5
LEARNING_RATE = 1e-4
NUM_CLASSES = 5
CLASS_NAMES = [
    "Atelectasis",
    "Cardiomegaly",
    "Consolidation",
    "Edema",
    "Pleural Effusion",
]


#GPU else CPU
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

