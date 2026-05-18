# Colab GPU Fine-Tuning Instructions

Use this guide in Google Colab for immediate GPU fine-tuning of the plant disease model.

---

## Step 0: Create a new Colab notebook

1. Open [Google Colab](https://colab.research.google.com/).
2. Select `File → New notebook`.
3. Change runtime type to GPU:
   - `Runtime → Change runtime type`
   - Set `Hardware accelerator` to `GPU`
   - Save

---

## Step 1: Mount Google Drive

```python
from google.colab import drive
drive.mount('/content/drive')
print('✓ Google Drive mounted')
```

---

## Step 2: Prepare output directory and dataset path

```python
import os

OUTPUT_DIR = '/content/drive/My Drive/uvion/models'
DATASET_ROOT = '/content/drive/My Drive/uvion/data/plantdisease/New Plant Diseases Dataset(Augmented)/New Plant Diseases Dataset(Augmented)'

os.makedirs(OUTPUT_DIR, exist_ok=True)
print('✓ Output directory:', OUTPUT_DIR)
print('✓ Dataset root:', DATASET_ROOT)
print('Contents:', os.listdir(DATASET_ROOT))
```

---

## Step 3: Install dependencies

```python
!pip install --quiet tensorflow scikit-learn pandas matplotlib seaborn
print('✓ Dependencies installed')
```

---

## Step 4: Confirm GPU availability

```python
import tensorflow as tf
gpus = tf.config.list_physical_devices('GPU')
print('TensorFlow', tf.__version__)
print('GPUs detected:', len(gpus))
for gpu in gpus:
    print(' -', gpu)
```

If no GPU is shown, go back to `Runtime → Change runtime type` and select `GPU`.

---

## Step 5: Run the fine-tuning training script

Copy the following full cell into Colab and execute it.

```python
import os
import warnings
from datetime import datetime

import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, models
from tensorflow.keras.callbacks import (
    EarlyStopping, ReduceLROnPlateau, ModelCheckpoint, TensorBoard, TerminateOnNaN
)
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from sklearn.metrics import classification_report, confusion_matrix
import pickle

warnings.filterwarnings('ignore')

# -------------------------------
# Configuration
# -------------------------------
DATASET_ROOT = '/content/drive/My Drive/uvion/data/plantdisease/New Plant Diseases Dataset(Augmented)/New Plant Diseases Dataset(Augmented)'
TRAIN_DIR = os.path.join(DATASET_ROOT, 'train')
VALID_DIR = os.path.join(DATASET_ROOT, 'valid')
TEST_DIR = os.path.join(DATASET_ROOT, 'test/test')
OUTPUT_DIR = '/content/drive/My Drive/uvion/models'
MODEL_NAME = 'plant_disease_classifier'
IMG_SIZE = 128
BATCH_SIZE = 64
PHASE1_EPOCHS = 8
PHASE2_EPOCHS = 6
INITIAL_LR = 1e-3
FINE_TUNE_LR = 1e-4
FINE_TUNE_AT = 100

os.makedirs(OUTPUT_DIR, exist_ok=True)

# -------------------------------
# GPU and mixed precision
# -------------------------------

gpus = tf.config.list_physical_devices('GPU')
if gpus:
    for gpu in gpus:
        tf.config.experimental.set_memory_growth(gpu, True)
    tf.keras.mixed_precision.set_global_policy('mixed_float16')
    print('✓ GPU detected and mixed precision enabled')
else:
    print('⚠️ No GPU detected. Training will run on CPU.')

# -------------------------------
# Data generators
# -------------------------------
train_datagen = ImageDataGenerator(
    rescale=1.0 / 255.0,
    rotation_range=20,
    width_shift_range=0.15,
    height_shift_range=0.15,
    shear_range=0.15,
    zoom_range=0.15,
    horizontal_flip=True,
    vertical_flip=True,
    fill_mode='nearest'
)
val_datagen = ImageDataGenerator(rescale=1.0 / 255.0)

train_generator = train_datagen.flow_from_directory(
    TRAIN_DIR,
    target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    shuffle=True,
    seed=42
)
valid_generator = val_datagen.flow_from_directory(
    VALID_DIR,
    target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    shuffle=False,
    seed=42
)
test_generator = val_datagen.flow_from_directory(
    TEST_DIR,
    target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    shuffle=False
)

class_names = sorted(os.listdir(TRAIN_DIR))
num_classes = len(class_names)
print(f'✓ Found {num_classes} classes')

# -------------------------------
# Build model
# -------------------------------
base_model = keras.applications.MobileNetV2(
    input_shape=(IMG_SIZE, IMG_SIZE, 3),
    include_top=False,
    weights='imagenet'
)
base_model.trainable = False

inputs = keras.Input(shape=(IMG_SIZE, IMG_SIZE, 3))
x = base_model(inputs, training=False)
x = layers.GlobalAveragePooling2D()(x)
x = layers.Dropout(0.3)(x)
x = layers.Dense(256, activation='relu')(x)
x = layers.BatchNormalization()(x)
x = layers.Dropout(0.2)(x)
outputs = layers.Dense(num_classes, activation='softmax', dtype='float32')(x)
model = keras.Model(inputs, outputs)

model.compile(
    optimizer=Adam(learning_rate=INITIAL_LR),
    loss='categorical_crossentropy',
    metrics=['accuracy', keras.metrics.TopKCategoricalAccuracy(k=3, name='top_3_accuracy')]
)
print('✓ Model built and compiled')
model.summary()

# -------------------------------
# Callbacks
# -------------------------------
callbacks = [
    EarlyStopping(monitor='val_loss', patience=4, restore_best_weights=True, verbose=1),
    ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=2, min_lr=1e-6, verbose=1),
    ModelCheckpoint(
        os.path.join(OUTPUT_DIR, 'phase1_best_weights.h5'),
        monitor='val_loss',
        save_best_only=True,
        save_weights_only=True,
        verbose=1
    ),
    TensorBoard(log_dir=os.path.join(OUTPUT_DIR, 'logs', 'phase1'))
]

# -------------------------------
# Phase 1: Train top layers
# -------------------------------
print('=== PHASE 1: Training top layers (base frozen) ===')
history_1 = model.fit(
    train_generator,
    validation_data=valid_generator,
    epochs=PHASE1_EPOCHS,
    callbacks=callbacks,
    workers=4,
    use_multiprocessing=False
)

# -------------------------------
# Phase 2: Fine-tune last layers of the backbone
# -------------------------------
print('=== PHASE 2: Fine-tuning top backbone layers ===')
base_model.trainable = True
for layer in base_model.layers[:FINE_TUNE_AT]:
    layer.trainable = False
for layer in base_model.layers[FINE_TUNE_AT:]:
    layer.trainable = True
print(f'✓ Unfrozen backbone from layer {FINE_TUNE_AT}')

model.compile(
    optimizer=Adam(learning_rate=FINE_TUNE_LR),
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

callbacks = [
    EarlyStopping(monitor='val_loss', patience=4, restore_best_weights=True, verbose=1),
    ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=2, min_lr=1e-6, verbose=1),
    ModelCheckpoint(
        os.path.join(OUTPUT_DIR, 'phase2_best_weights.h5'),
        monitor='val_loss',
        save_best_only=True,
        save_weights_only=True,
        verbose=1
    ),
    TensorBoard(log_dir=os.path.join(OUTPUT_DIR, 'logs', 'phase2'))
]

history_2 = model.fit(
    train_generator,
    validation_data=valid_generator,
    epochs=PHASE2_EPOCHS,
    callbacks=callbacks,
    workers=4,
    use_multiprocessing=False
)

# -------------------------------
# Evaluation
# -------------------------------
print('=== EVALUATION ===')
fast_eval = True
if fast_eval:
    eval_steps = min(len(test_generator), 20)
    print(f'✓ Fast evaluation enabled: using {eval_steps} steps out of {len(test_generator)}')
    results = model.evaluate(
        test_generator,
        steps=eval_steps,
        verbose=1,
        workers=4,
        use_multiprocessing=False
    )
else:
    results = model.evaluate(
        test_generator,
        verbose=1,
        workers=4,
        use_multiprocessing=False
    )
print(f'✓ Test results: {results}')
if not fast_eval:
    y_pred = model.predict(test_generator, verbose=0)
    y_pred_classes = np.argmax(y_pred, axis=1)
    y_true = test_generator.classes
    print(classification_report(y_true, y_pred_classes, target_names=class_names, digits=4))
else:
    print('⚠️ Classification report skipped for speed. Set fast_eval = False to run the full test evaluation.')

# -------------------------------
# Save final model and artifacts
# -------------------------------

savedmodel_path = os.path.join(OUTPUT_DIR, MODEL_NAME)
h5_path = os.path.join(OUTPUT_DIR, f'{MODEL_NAME}.h5')
class_names_path = os.path.join(OUTPUT_DIR, 'class_names.pkl')

model.save(savedmodel_path, save_format='tf')
model.save(h5_path)
with open(class_names_path, 'wb') as f:
    pickle.dump(class_names, f)

print('✓ Model saved to', savedmodel_path)
print('✓ H5 saved to', h5_path)
print('✓ Class names saved to', class_names_path)

# -------------------------------
# Optional: Save training plot
# -------------------------------
fig, axes = plt.subplots(2, 2, figsize=(15, 12))

axes[0, 0].plot(history_1.history['accuracy'], label='Phase1 Train')
axes[0, 0].plot(history_1.history['val_accuracy'], label='Phase1 Val')
axes[0, 0].set_title('Phase 1 Accuracy')
axes[0, 0].legend()

axes[0, 1].plot(history_1.history['loss'], label='Phase1 Train')
axes[0, 1].plot(history_1.history['val_loss'], label='Phase1 Val')
axes[0, 1].set_title('Phase 1 Loss')
axes[0, 1].legend()

axes[1, 0].plot(history_2.history['accuracy'], label='Phase2 Train')
axes[1, 0].plot(history_2.history['val_accuracy'], label='Phase2 Val')
axes[1, 0].set_title('Phase 2 Accuracy')
axes[1, 0].legend()

axes[1, 1].plot(history_2.history['loss'], label='Phase2 Train')
axes[1, 1].plot(history_2.history['val_loss'], label='Phase2 Val')
axes[1, 1].set_title('Phase 2 Loss')
axes[1, 1].legend()

plt.tight_layout()
plt.savefig(os.path.join(OUTPUT_DIR, 'training_metrics.png'), dpi=300)
plt.show()

print('✓ Training plot saved')
```

---

## Step 6: Download results (optional)

```python
from google.colab import files
import shutil
shutil.make_archive('/content/plant_disease_model', 'zip', OUTPUT_DIR)
files.download('/content/plant_disease_model.zip')
```

---

## Notes

- Use **Runtime → Restart runtime** if dependencies install fails.
- Keep the GPU runtime active while training.
- If GPU is missing, check `Runtime → Change runtime type → GPU`.
- The model saves to `My Drive/uvion/models` so your results persist.
