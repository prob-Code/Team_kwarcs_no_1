import joblib
import os
import sys

# Add ml folder to path to import label mappings
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'ml')))
try:
    from model import idx2label
except ImportError:
    # Fallback if running directly from backend
    idx2label = {0: "neutral", 1: "positive", 2: "negative"}

MODEL_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'ml', 'model.pkl'))
model = None

def load_model():
    global model
    if os.path.exists(MODEL_PATH):
        model = joblib.load(MODEL_PATH)
        print("Model loaded successfully")
    else:
        print(f"Model not found at {MODEL_PATH}. Prediction service unavailable.")

def predict_text(text: str) -> dict:
    if model is None:
        return {"label": "error", "confidence": 0.0, "message": "Model not loaded. Train the model first."}
    
    probs = model.predict_proba([text])[0]
    pred_idx = model.predict([text])[0]
    
    
    label = idx2label[pred_idx]
    confidence = probs[pred_idx]
    
    return {
        "label": label,
        "confidence": round(float(confidence), 4)
    }
