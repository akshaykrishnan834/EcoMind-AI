"""
Waste Classification Inference Script (7 Categories)
Loads trained MobileNetV2 model and predicts waste category with recyclability status.
"""

import sys
import json
import argparse
from pathlib import Path
from PIL import Image
import numpy as np
import tensorflow as tf

import config

def load_inference_artifacts():
    if not config.MODEL_SAVE_PATH.exists():
        raise FileNotFoundError(
            f"Trained model not found at {config.MODEL_SAVE_PATH}. Please run 'python train.py' first."
        )
    if not config.METADATA_SAVE_PATH.exists():
        raise FileNotFoundError(
            f"Model metadata not found at {config.METADATA_SAVE_PATH}. Please run 'python train.py' first."
        )

    model = tf.keras.models.load_model(str(config.MODEL_SAVE_PATH))
    with open(config.METADATA_SAVE_PATH, "r") as f:
        metadata = json.load(f)

    return model, metadata

def preprocess_image(image_input):
    """Loads and preprocesses an image ensuring 3-channel RGB format and target size."""
    if isinstance(image_input, (str, Path)):
        img = Image.open(image_input)
    else:
        img = Image.open(image_input)

    # Convert to RGB (handles RGBA 4-channel PNGs and grayscale)
    if img.mode != "RGB":
        img = img.convert("RGB")

    img = img.resize(config.IMG_SIZE)
    img_array = np.array(img, dtype=np.float32)
    img_batch = np.expand_dims(img_array, axis=0)
    return img_batch

def predict(image_input, model=None, metadata=None):
    """
    Runs prediction on an image file or stream.
    Returns:
      category (str)
      recyclable (bool)
      confidence (float)
      top_3 (list)
    """
    if model is None or metadata is None:
        model, metadata = load_inference_artifacts()

    class_names = metadata["class_names"]
    recyclable_map = metadata.get("recyclable_status", config.RECYCLABLE_STATUS)

    processed = preprocess_image(image_input)
    predictions = model.predict(processed, verbose=0)[0]

    top_idx = int(np.argmax(predictions))
    top_class = class_names[top_idx]
    confidence = float(predictions[top_idx])
    is_recyclable = bool(recyclable_map.get(top_class, False))

    # Top 3 predictions
    top_indices = np.argsort(predictions)[::-1][:min(3, len(class_names))]
    top_3 = [
        {
            "category": class_names[i],
            "probability": round(float(predictions[i]), 4),
            "recyclable": bool(recyclable_map.get(class_names[i], False))
        }
        for i in top_indices
    ]

    result = {
        "category": top_class,
        "recyclable": is_recyclable,
        "confidence": round(confidence, 4),
        "top_3": top_3
    }
    return result

def main():
    parser = argparse.ArgumentParser(description="Predict waste category and recyclability from image")
    parser.add_argument("image_path", help="Path to the image file to classify")
    args = parser.parse_args()

    try:
        res = predict(args.image_path)
        print("\n================ PREDICTION RESULT ================")
        print(f"Predicted Category : {res['category']}")
        print(f"Confidence         : {res['confidence'] * 100:.2f}%")
        print(f"Recyclable Status  : {'RECYCLABLE' if res['recyclable'] else 'NOT RECYCLABLE'}")
        print("\nTop Predictions:")
        for rank, item in enumerate(res['top_3'], 1):
            print(f"  {rank}. {item['category']:<25} {item['probability'] * 100:6.2f}% (Recyclable: {item['recyclable']})")
        print("===================================================\n")
    except Exception as e:
        print(f"Error during prediction: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
