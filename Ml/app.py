"""
FastAPI Service for EcoMind AI Waste Classification
Provides REST API endpoints for image scanning and recyclability verification.
"""

import os
import io
import json
from pathlib import Path
from typing import Optional
from fastapi import FastAPI, File, UploadFile, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

import config
from predict import predict, load_inference_artifacts

app = FastAPI(
    title="EcoMind AI Waste Classification Service",
    description="Deep Learning API for classifying waste into 7 categories and identifying recyclability.",
    version="1.0.0"
)

# Enable CORS for frontend and backend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = None
metadata = None

def get_model():
    """Lazily loads the trained model artifacts upon first request or startup."""
    global model, metadata
    if model is None:
        if config.MODEL_SAVE_PATH.exists() and config.METADATA_SAVE_PATH.exists():
            try:
                model, metadata = load_inference_artifacts()
                print("Model and metadata loaded successfully.")
            except Exception as e:
                print(f"Warning: Failed to load model: {e}")
                model = None
                metadata = None
    return model, metadata

@app.on_event("startup")
async def startup_event():
    get_model()

@app.get("/health")
def health():
    m, meta = get_model()
    return {
        "status": "online",
        "model_loaded": m is not None,
        "classes": meta.get("class_names", config.CATEGORIES) if meta else config.CATEGORIES
    }

@app.post("/predict")
async def predict_waste(file: UploadFile = File(...)):
    m, meta = get_model()
    if m is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model is not trained yet. Please run 'python train.py' first."
        )

    # Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type '{file.content_type}'. Please upload an image file."
        )

    try:
        contents = await file.read()
        image_stream = io.BytesIO(contents)
        result = predict(image_stream, model=m, metadata=meta)

        # Return exact response format requested:
        # {
        #   "category": "plastic_bottles",
        #   "recyclable": true,
        #   "confidence": 0.94
        # }
        return {
            "category": result["category"],
            "recyclable": result["recyclable"],
            "confidence": result["confidence"],
            "top_3": result["top_3"]
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction failed: {str(e)}"
        )

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    print(f"Starting EcoMind AI ML FastAPI Service on http://0.0.0.0:{port}...")
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=False)
