# Plant Disease Classification Model - Google Colab Training Guide

## 📋 Overview

This guide walks you through training a **ResNet50-based CNN model** to detect plant diseases using your dataset. The model uses **transfer learning** for faster training and better accuracy.

**Key Features:**

- ✅ Transfer Learning (ResNet50 pre-trained on ImageNet)
- ✅ Data Augmentation (rotation, zoom, brightness adjustments)
- ✅ Early Stopping & Learning Rate Scheduling
- ✅ Multi-format output (SavedModel, H5, TFLite)
- ✅ Comprehensive evaluation metrics
- ✅ GPU acceleration (T4/P100 in Colab)

---

## 🚀 Quick Start (Copy-Paste in Colab)

### Step 1: Mount Google Drive

```python
from google.colab import drive
drive.mount('/content/drive')
```

### Step 2: Create Directory Structure

```python
import os
os.makedirs('/content/drive/My Drive/uvion/data', exist_ok=True)
os.makedirs('/content/drive/My Drive/uvion/models', exist_ok=True)
```

### Step 3: Upload Dataset or Copy from Existing Location

**Option A: If dataset is already in Drive:**
The script will look for:

```
/content/drive/My Drive/uvion/data/plantdisease/New Plant Diseases Dataset(Augmented)/
├── train/
├── valid/
└── test/test/
```

**Option B: Upload dataset using:**

```python
from google.colab import files
files.upload()  # Then unzip to /content/drive/My Drive/uvion/data/
```

### Step 4: Install Dependencies (if needed)

```bash
!pip install tensorflow scikit-learn pandas matplotlib seaborn
```

### Step 5: Download & Run Training Script

**Option A: Download from your machine**

```python
from google.colab import files
files.upload()  # Upload train_disease_colab.py
```

**Option B: Copy from GitHub or paste code directly**

### Step 6: Run Training

```python
%run train_disease_colab.py
```

---

## ⚙️ Configuration Options

Edit the `Config` class in the script to customize:

```python
class Config:
    # Dataset paths - UPDATE IF DIFFERENT
    DATASET_ROOT = '/content/drive/My Drive/uvion/data/plantdisease/New Plant Diseases Dataset(Augmented)/New Plant Diseases Dataset(Augmented)'

    # Model hyperparameters
    IMG_SIZE = 224          # Image resolution
    BATCH_SIZE = 32         # Batch size (increase for better GPU utilization)
    EPOCHS = 100            # Max epochs (early stopping will stop earlier)
    LEARNING_RATE = 0.001   # Initial learning rate

    # Architecture options
    ARCHITECTURE = 'ResNet50'  # Options: 'ResNet50', 'EfficientNetB3', 'MobileNetV2', 'VGG16'
    TRANSFER_LEARNING = True   # Use pre-trained weights
```

### Recommended Configurations

**Fast Training (2-3 hours):**

```python
BATCH_SIZE = 32
EPOCHS = 50
ARCHITECTURE = 'MobileNetV2'  # Lighter model
```

**Balanced (3-5 hours):**

```python
BATCH_SIZE = 32
EPOCHS = 100
ARCHITECTURE = 'ResNet50'  # Default - good balance
```

**Maximum Accuracy (5-7 hours):**

```python
BATCH_SIZE = 16
EPOCHS = 150
ARCHITECTURE = 'EfficientNetB3'  # More powerful
```

---

## 📊 What the Script Does

### 1. **Data Loading & Exploration**

- Counts dataset statistics
- Displays class names and sample counts
- Validates directory structure

### 2. **Data Augmentation**

- Training: Rotation, zoom, brightness, shifts, flips
- Validation/Test: Only normalization (no augmentation)
- Prevents overfitting and improves generalization

### 3. **Model Building**

- Loads pre-trained base model (ResNet50)
- Adds custom top layers: Dense(512) → Dense(256) → Dense(128) → Output
- Includes Batch Normalization and Dropout for regularization

### 4. **Training Phase 1: Feature Learning**

- Freezes base model weights
- Trains only top layers (2-3 epochs typically)
- Fast convergence on your specific domain

### 5. **Fine-Tuning Phase 2: Domain Adaptation**

- Unfreezes base model (last 50 layers)
- Trains with lower learning rate
- Adapts pre-trained features to your data

### 6. **Evaluation**

- Tests on validation set
- Generates confusion matrix
- Reports per-class accuracy
- Creates visualization plots

### 7. **Model Saving**

- **SavedModel** (.pb) - TensorFlow native, recommended for serving
- **H5** - Keras format, compatible with most frameworks
- **TFLite** - Mobile/lightweight deployment
- **Class Names & History** - For reference and post-processing

---

## 📈 Understanding the Outputs

### Training Metrics (`training_metrics.png`)

- **Accuracy Plot**: Shows training vs validation accuracy
- **Loss Plot**: Shows training vs validation loss
- **Confusion Matrix**: True vs predicted classes
- **Per-Class Accuracy**: Class-wise performance

### Console Output

```
Test Accuracy: 0.9234     ← How often predictions are correct
Top-3 Accuracy: 0.9876   ← Correct answer in top 3 predictions
Loss: 0.2145              ← Lower is better
```

---

## 🔧 Troubleshooting

### Issue: Out of Memory (OOM)

**Solution:** Reduce batch size

```python
BATCH_SIZE = 16  # Instead of 32
```

### Issue: Training is slow

**Solution:** Enable GPU acceleration

```python
# In Colab: Runtime → Change Runtime Type → GPU (T4 or P100)
# Script automatically detects and uses available GPU
```

### Issue: Dataset not found

**Solution:** Verify path exists

```python
import os
os.path.exists('/content/drive/My Drive/uvion/data/plantdisease/')  # Should return True
os.listdir('/content/drive/My Drive/uvion/data/plantdisease/')      # Should show folders
```

### Issue: Low accuracy

**Try:**

1. Increase EPOCHS (let it train longer)
2. Use more powerful architecture (EfficientNetB3)
3. Reduce BATCH_SIZE (better gradient estimates)
4. Add more data augmentation

---

## 📤 Using the Trained Model

### In Your Backend (FastAPI)

```python
import tensorflow as tf
import pickle
import numpy as np
from PIL import Image

# Load model
model = tf.keras.models.load_model('/path/to/plant_disease_classifier')

# Load class names
with open('/path/to/class_names.pkl', 'rb') as f:
    classes = pickle.load(f)

# Prediction function
def predict_disease(image_path):
    # Load and preprocess image
    img = Image.open(image_path).convert('RGB')
    img = img.resize((224, 224))
    img_array = np.array(img) / 255.0
    img_array = np.expand_dims(img_array, axis=0)

    # Predict
    predictions = model.predict(img_array)
    class_idx = np.argmax(predictions[0])
    confidence = predictions[0][class_idx]

    return {
        'disease': classes[class_idx],
        'confidence': float(confidence),
        'all_predictions': {
            classes[i]: float(predictions[0][i])
            for i in range(len(classes))
        }
    }
```

### Convert SavedModel to H5 (if needed)

```python
import tensorflow as tf

# Load SavedModel
model = tf.keras.models.load_model('/path/to/plant_disease_classifier')

# Save as H5
model.save('/path/to/model.h5')
```

---

## 🎯 Expected Results

With the **default configuration** on your plant disease dataset:

| Metric         | Expected    |
| -------------- | ----------- |
| Test Accuracy  | 85-95%      |
| Top-3 Accuracy | 95-99%      |
| Training Time  | 3-5 hours   |
| Model Size     | ~100-200 MB |

---

## 📝 Hyperparameter Tuning Tips

| Parameter     | Effect                                | Recommendations |
| ------------- | ------------------------------------- | --------------- |
| BATCH_SIZE    | Higher = faster but needs more memory | 16, 32, 64      |
| LEARNING_RATE | Higher = faster but unstable          | 0.0001 to 0.01  |
| EPOCHS        | More epochs = better but slower       | 50-200          |
| IMG_SIZE      | Larger = more details but slower      | 224-512         |
| Dropout       | Higher = less overfitting             | 0.2-0.5         |

---

## 🔄 Retraining Your Model

To retrain with new data or different hyperparameters:

1. Update dataset paths in `Config`
2. Modify hyperparameters as needed
3. Run the script again
4. Old model is backed up with timestamp

---

## ❓ FAQ

**Q: Can I use a custom architecture?**
A: Yes! Edit the `build_model()` function or modify the Config.ARCHITECTURE.

**Q: How do I add a new class/disease?**
A: Just add a new folder in `train/` and `valid/` directories. Script auto-detects classes.

**Q: Can I train on CPU?**
A: Yes, but it will be very slow (10x+ slower than GPU).

**Q: How often should I retrain?**
A: Every 100-200 new images or when accuracy drops.

**Q: Can I use this on mobile?**
A: Yes! Use the TFLite model (.tflite file) for mobile deployment.

---

## 📞 Support

For issues:

1. Check the **Troubleshooting** section above
2. Verify dataset structure matches expected format
3. Check GPU availability: `!nvidia-smi` in Colab
4. Review console output for specific error messages

---

Generated: 2024
Part of UVION - AI-Powered Autonomous Farming System
