# 🌾 UVION Plant Disease Model - Health Hub Integration Guide

**Model Location:** `models/plant_disease_model (1)/`  
**Status:** ✅ Trained and Ready for Health Module Integration  
**Purpose:** Disease detection for UVION Health Hub

---

## 📁 Model Files Overview

```
models/plant_disease_model (1)/
├── 📄 plant_disease_classifier.h5          # Primary Keras model (H5 format)
├── 📄 plant_disease_classifier.keras       # Alternative Keras format
├── 📄 plant_disease_classifier_best.h5     # Best weights from training
├── 📄 class_names.pkl                      # Disease class mappings (30+ classes)
├── 📄 phase1_best_weights.weights.h5       # Phase 1 fine-tuning weights
├── 📄 phase2_best_weights.weights.h5       # Phase 2 fine-tuning weights
├── 📄 training_metrics.png                 # Training visualization
├── 📁 logs/                                # Training logs
│   ├── phase1/                            # Phase 1 training logs
│   ├── phase2/                            # Phase 2 fine-tuning logs
│   ├── train/                             # Training event files
│   └── validation/                        # Validation event files
└── 📄 README.md                           # Model documentation
```

---

## 🔗 Connection to UVION Health Hub

### 1. Health Module Integration Point

**Disease Detection Tab** in Health Module:

- User uploads crop image
- Image sent to backend API
- Backend loads this model for inference
- Model returns disease prediction
- Results displayed in Health Hub UI

**Flow:**

```
Health Hub UI → DiseaseDetection.tsx → healthService.detectDisease()
    ↓
Backend API → /api/v1/health/detect-disease → ML Model Inference
    ↓
Model loads from: models/plant_disease_model (1)/plant_disease_classifier.h5
    ↓
Returns: {disease, confidence, severity, affectedArea, urgency, factors}
    ↓
Health Hub displays results + treatment recommendations
```

### 2. Backend Integration Requirements

**Model Loading in FastAPI:**

```python
# In backend/health_service.py or main.py

import tensorflow as tf
import pickle
from pathlib import Path

MODEL_PATH = Path(__file__).parent.parent / "models" / "plant_disease_model (1)" / "plant_disease_classifier.h5"
CLASS_NAMES_PATH = Path(__file__).parent.parent / "models" / "plant_disease_model (1)" / "class_names.pkl"

# Load on startup
model = tf.keras.models.load_model(str(MODEL_PATH))
with open(CLASS_NAMES_PATH, 'rb') as f:
    class_names = pickle.load(f)

print(f"✓ Disease model loaded: {len(class_names)} classes")
```

**Inference Function:**

```python
def predict_disease(image_array):
    """Predict disease from preprocessed image array"""
    predictions = model.predict(image_array, verbose=0)
    class_idx = tf.argmax(predictions[0]).numpy()
    confidence = float(tf.reduce_max(predictions[0]).numpy())

    return {
        'disease': class_names[class_idx],
        'confidence': confidence,
        'all_predictions': {
            class_names[i]: float(predictions[0][i])
            for i in range(len(class_names))
        }
    }
```

### 3. API Endpoint Integration

**Health Module Endpoint:**

```python
# In backend/health_routes.py

@app.post("/api/v1/health/detect-disease")
async def detect_disease(file: UploadFile = File(...), cropId: str = None):
    # 1. Receive and preprocess image
    contents = await file.read()
    image = Image.open(io.BytesIO(contents)).convert('RGB')
    image = image.resize((128, 128))
    image_array = np.array(image) / 255.0
    image_array = np.expand_dims(image_array, axis=0)

    # 2. Run model inference
    result = predict_disease(image_array)

    # 3. Determine severity and urgency
    severity = get_severity(result['disease'], result['confidence'])
    urgency = get_urgency(result['disease'])

    # 4. Save to Firestore (health_records collection)
    record_data = {
        'cropId': cropId,
        'disease': result['disease'],
        'confidence': result['confidence'],
        'severity': severity,
        'urgency': urgency,
        'timestamp': firestore.SERVER_TIMESTAMP
    }
    db.collection('health_records').add(record_data)

    # 5. Return to Health Hub
    return {
        'scanId': f'scan_{int(time.time())}',
        'disease': result['disease'],
        'confidence': result['confidence'],
        'severity': severity,
        'urgency': urgency,
        'factors': get_disease_factors(result['disease']),
        'timeframe': get_action_timeframe(result['disease'])
    }
```

---

## 🎯 Model Specifications

| Specification       | Value                           |
| ------------------- | ------------------------------- |
| **Architecture**    | MobileNetV2 + Transfer Learning |
| **Input Shape**     | 128×128×3 RGB                   |
| **Output Classes**  | 30+ disease types               |
| **Training Method** | 2-phase fine-tuning             |
| **Framework**       | TensorFlow/Keras                |
| **File Format**     | H5 (Keras)                      |
| **Inference Time**  | ~100-200ms per image            |
| **Accuracy**        | ~84% on validation set          |

---

## 🔄 Health Hub Data Flow

### Input Processing

1. **Image Upload:** User selects crop image in Health Hub
2. **Preprocessing:** Resize to 128×128, normalize to 0-1
3. **Model Inference:** Run through disease classifier
4. **Post-processing:** Map predictions to disease names, calculate severity

### Output Integration

1. **Disease Result:** Primary disease + confidence score
2. **Severity Assessment:** Mild/Moderate/Severe based on confidence
3. **Urgency Level:** High/Medium/Low based on disease type
4. **Treatment Trigger:** Automatic treatment plan generation
5. **Health Score Update:** Recalculate overall crop health
6. **History Logging:** Save to scan history for trends

### Real-time Updates

- **Health Overview:** Updates score when new scan added
- **Scan History:** New entry appears in timeline
- **Risk Monitoring:** Disease detection affects risk assessment
- **Treatment Plans:** New plan created if disease detected
- **Action Tracker:** User can log treatment actions

---

## 🛠️ Backend Setup Steps

### 1. Model Loading

```python
# Add to backend startup
MODEL_DIR = Path(__file__).parent.parent / "models" / "plant_disease_model (1)"
disease_model = tf.keras.models.load_model(str(MODEL_DIR / "plant_disease_classifier.h5"))
with open(MODEL_DIR / "class_names.pkl", 'rb') as f:
    disease_classes = pickle.load(f)
```

### 2. Health Service Functions

```python
# In backend/health_service.py
def detect_plant_disease(image_array):
    predictions = disease_model.predict(image_array, verbose=0)
    class_idx = np.argmax(predictions[0])
    confidence = float(np.max(predictions[0]))

    return {
        'disease': disease_classes[class_idx],
        'confidence': confidence,
        'severity': 'Severe' if confidence > 0.85 else 'Moderate' if confidence > 0.7 else 'Mild',
        'urgency': 'High' if confidence > 0.8 else 'Medium'
    }
```

### 3. API Route

```python
# In backend/health_routes.py
@app.post("/api/v1/health/detect-disease")
async def detect_disease_endpoint(file: UploadFile, cropId: str = None):
    # Process image and run detection
    result = detect_plant_disease(processed_image)

    # Save to database
    save_health_record(cropId, result)

    # Return to frontend
    return result
```

---

## 📊 Health Hub UI Integration

### Disease Detection Component

```typescript
// frontend/src/components/health/DiseaseDetection.tsx
const DiseaseDetection = () => {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);

  const handleUpload = async () => {
    const formData = new FormData();
    formData.append('file', image);

    const response = await healthService.detectDisease(formData);
    setResult(response);

    // Update health overview
    healthStore.updateHealthScore();
  };

  return (
    <div>
      <input type="file" onChange={(e) => setImage(e.target.files[0])} />
      <button onClick={handleUpload}>Analyze</button>
      {result && (
        <div>
          <h3>Disease: {result.disease}</h3>
          <p>Confidence: {result.confidence.toFixed(2)}</p>
          <p>Severity: {result.severity}</p>
          <p>Urgency: {result.urgency}</p>
        </div>
      )}
    </div>
  );
};
```

### Health Overview Updates

```typescript
// frontend/src/store/healthStore.ts
const healthStore = {
  // ... existing state

  updateHealthScore: async () => {
    const overview = await healthService.getHealthOverview();
    setHealthScore(overview.healthScore);
    setActiveIssues(overview.activeIssues);
  },
};
```

---

## 🔄 Integration Checklist

- [ ] Model files copied to backend accessible location
- [ ] Backend startup loads disease model and classes
- [ ] Health service has disease detection function
- [ ] API endpoint `/api/v1/health/detect-disease` implemented
- [ ] Frontend service calls backend endpoint
- [ ] DiseaseDetection component handles upload and display
- [ ] Health store updates after detection
- [ ] Firestore saves health records
- [ ] Scan history shows new detections
- [ ] Treatment plans generated automatically

---

## 🚀 Production Deployment

### Model Optimization

- **SavedModel Format:** Convert H5 to SavedModel for better serving
- **GPU Support:** Enable if available in production
- **Batch Processing:** Support multiple images if needed

### Monitoring

- **Inference Time:** Track prediction latency
- **Accuracy Drift:** Monitor model performance over time
- **Error Rates:** Log failed predictions

### Scaling

- **Model Caching:** Load model once, reuse across requests
- **Async Processing:** Queue heavy inference tasks
- **Fallback Logic:** Handle model loading failures

---

## 📞 Support & Maintenance

**Model Updates:**

- Retrain periodically with new disease data
- Update class_names.pkl if new diseases added
- Test inference after model updates

**Performance Monitoring:**

- Track average inference time
- Monitor memory usage during predictions
- Log prediction confidence distributions

**Error Handling:**

- Graceful fallback if model fails to load
- User-friendly error messages for failed uploads
- Retry logic for transient failures

---

**Integration Status:** Ready for Health Hub connection
**Next Step:** Implement backend endpoint and test end-to-end flow
