# EcoMind AI - Machine Learning Service (7 Categories)

This service classifies waste materials into 7 specific categories and determines their recyclability status for the EcoMind AI platform.

---

## 📁 Directory Structure

```text
Ml/
├── dataset/                        # 7-Category Dataset
│   ├── medicine_strips/            # 6 images  (Recyclable)
│   ├── non_recyclable/             # 24 images (Not Recyclable)
│   ├── other_recyclable_plastic/   # 11 images (Recyclable)
│   ├── plastic_bottles/            # 7 images  (Recyclable)
│   ├── plastic_containers/         # 17 images (Recyclable)
│   ├── plastic_covers/             # 13 images (Recyclable)
│   └── pvc_plastic_pipes/          # 8 images  (Recyclable)
├── models/                         # Saved trained weights and metadata (generated)
│   ├── waste_classifier.keras
│   └── model_metadata.json
├── config.py                       # Hyperparameters, input dimensions, categories
├── train.py                        # MobileNetV2 transfer learning training pipeline
├── predict.py                      # Standalone CLI prediction tool
├── app.py                          # FastAPI REST API service
├── requirements.txt                # Python dependencies
└── README.md                       # Documentation
```

---

## 🏷️ Category Recyclability Mapping

| Category | Recyclable Status |
| :--- | :--- |
| `plastic_bottles` | Recyclable (`true`) |
| `plastic_covers` | Recyclable (`true`) |
| `plastic_containers` | Recyclable (`true`) |
| `other_recyclable_plastic` | Recyclable (`true`) |
| `pvc_plastic_pipes` | Recyclable (`true`) |
| `medicine_strips` | Recyclable (`true`) |
| `non_recyclable` | Not Recyclable (`false`) |

---

## 🚀 Quickstart Guide

### 1. Dependencies
Dependencies are installed in the Python environment:
```bash
pip install -r requirements.txt
```

### 2. Train the Model
```bash
python Ml/train.py
```

### 3. Run Inference from CLI
```bash
python Ml/predict.py "Ml/dataset/plastic_bottles/plastic_bottle_001.png"
```

### 4. Run the FastAPI Service
```bash
python Ml/app.py
# Or with uvicorn directly:
uvicorn app:app --app-dir Ml --host 0.0.0.0 --port 8000
```

#### API Endpoints:
- **`GET /health`**: Service status and supported categories
- **`POST /predict`**: Accepts an uploaded image file (`file`), returns:
```json
{
  "category": "plastic_bottles",
  "recyclable": true,
  "confidence": 0.94,
  "top_3": [...]
}
```
