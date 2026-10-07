import os
from pathlib import Path

# Base paths
BASE_DIR = Path(__file__).resolve().parent
DATASET_DIR = BASE_DIR / "dataset"
MODELS_DIR = BASE_DIR / "models"
MODELS_DIR.mkdir(parents=True, exist_ok=True)

MODEL_SAVE_PATH = MODELS_DIR / "waste_classifier.keras"
METADATA_SAVE_PATH = MODELS_DIR / "model_metadata.json"

# Training parameters
IMG_SIZE = (224, 224)
BATCH_SIZE = 8  # Tuned for dataset size
EPOCHS = 25
LEARNING_RATE = 1e-4
VALIDATION_SPLIT = 0.2
RANDOM_SEED = 42

# 7 target categories
CATEGORIES = [
    "medicine_strips",
    "non_recyclable",
    "other_recyclable_plastic",
    "plastic_bottles",
    "plastic_containers",
    "plastic_covers",
    "pvc_plastic_pipes"
]

# Recyclability metadata mapping
# plastic_bottles -> recyclable
# plastic_covers -> recyclable
# plastic_containers -> recyclable
# other_recyclable_plastic -> recyclable
# pvc_plastic_pipes -> recyclable
# medicine_strips -> recyclable
# non_recyclable -> not recyclable
RECYCLABLE_STATUS = {
    "plastic_bottles": True,
    "plastic_covers": True,
    "plastic_containers": True,
    "other_recyclable_plastic": True,
    "pvc_plastic_pipes": True,
    "medicine_strips": True,
    "non_recyclable": False
}
