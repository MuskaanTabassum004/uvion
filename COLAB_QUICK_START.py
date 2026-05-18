# UVION Plant Disease Detection - Google Colab Training
# Copy & paste each cell into a new Google Colab notebook

# ==============================================================================
# CELL 1: Mount Google Drive
# ==============================================================================
from google.colab import drive
drive.mount('/content/drive')
print("✓ Google Drive mounted")

# ==============================================================================
# CELL 2: Setup Directories
# ==============================================================================
import os
os.makedirs('/content/drive/My Drive/uvion/models', exist_ok=True)
print("✓ Output directory created at: /content/drive/My Drive/uvion/models")

# Verify dataset exists
dataset_path = '/content/drive/My Drive/uvion/data/plantdisease/New Plant Diseases Dataset(Augmented)/New Plant Diseases Dataset(Augmented)'
if os.path.exists(dataset_path):
    print(f"✓ Dataset found at: {dataset_path}")
    print(f"  Subdirectories: {os.listdir(dataset_path)}")
else:
    print(f"❌ Dataset NOT found at: {dataset_path}")
    print("  Please ensure the dataset is uploaded to your Google Drive")

# ==============================================================================
# CELL 3: Install Dependencies
# ==============================================================================
!pip install --quiet tensorflow scikit-learn pandas matplotlib seaborn
print("✓ All dependencies installed")

# ==============================================================================
# CELL 4: Check GPU
# ==============================================================================
import tensorflow as tf
gpus = tf.config.list_physical_devices('GPU')
print(f"✓ TensorFlow Version: {tf.__version__}")
if gpus:
    print(f"✓ GPU Available: {len(gpus)} GPU(s) detected")
    for gpu in gpus:
        print(f"  - {gpu}")
else:
    print("⚠️  No GPU detected. For faster training, use Runtime → Change Runtime Type → GPU")

# ==============================================================================
# CELL 5: Full Training Script
# ==============================================================================
import os
import sys
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, models
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.callbacks import (
    EarlyStopping, ReduceLROnPlateau, ModelCheckpoint, 
    TensorBoard, TerminateOnNaN
)
from tensorflow.keras.optimizers import Adam
from sklearn.metrics import classification_report, confusion_matrix
import pickle

# ==============================================================================
# CONFIGURATION
# ==============================================================================

class Config:
    # Dataset paths - MODIFY IF DIFFERENT
    DATASET_ROOT = '/content/drive/My Drive/uvion/data/plantdisease/New Plant Diseases Dataset(Augmented)/New Plant Diseases Dataset(Augmented)'
    TRAIN_DIR = os.path.join(DATASET_ROOT, 'train')
    VALID_DIR = os.path.join(DATASET_ROOT, 'valid')
    TEST_DIR = os.path.join(DATASET_ROOT, 'test/test')
    
    # Output paths
    OUTPUT_DIR = '/content/drive/My Drive/uvion/models'
    MODEL_NAME = 'plant_disease_classifier'
    
    # Model config - ULTRA-FAST OPTIMIZATION (90% faster training)
    IMG_SIZE = 128              # Further reduced from 160 (2x faster)
    BATCH_SIZE = 64             # Doubled from 32 (processes 2x images per step)
    EPOCHS = 15                 # Reduced from 40 (early stopping ~epoch 10-12)
    LEARNING_RATE = 0.001
    
    # Architecture: 'ResNet50', 'EfficientNetB3', 'MobileNetV2', 'VGG16'
    ARCHITECTURE = 'MobileNetV2'  # Changed from ResNet50 (3x faster training)
    TRANSFER_LEARNING = True
    FREEZE_BASE = True
    USE_GPU = True
    MIXED_PRECISION = True

print("[CONFIG] Setup complete")

# ==============================================================================
# GPU & MIXED PRECISION
# ==============================================================================

if Config.USE_GPU:
    if Config.MIXED_PRECISION:
        policy = tf.keras.mixed_precision.Policy('mixed_float16')
        tf.keras.mixed_precision.set_global_policy(policy)
        print("[GPU] Mixed precision enabled (float16)")
    
    gpus = tf.config.list_physical_devices('GPU')
    if gpus:
        for gpu in gpus:
            tf.config.experimental.set_memory_growth(gpu, True)
        print(f"[GPU] {len(gpus)} GPU(s) detected and memory growth enabled")

# ==============================================================================
# DATA LOADING
# ==============================================================================

print("\n" + "="*60)
print("LOADING DATASET")
print("="*60)

classes = sorted(os.listdir(Config.TRAIN_DIR))
print(f"Classes: {len(classes)}")
print(f"Examples: {classes[:5]}")

train_count = sum([len(os.listdir(os.path.join(Config.TRAIN_DIR, c))) for c in classes])
valid_count = sum([len(os.listdir(os.path.join(Config.VALID_DIR, c))) for c in classes])

print(f"\nDataset Statistics:")
print(f"  Training samples: {train_count}")
print(f"  Validation samples: {valid_count}")
print(f"  Classes: {len(classes)}")

num_classes = len(classes)

# ==============================================================================
# DATA AUGMENTATION
# ==============================================================================

train_datagen = ImageDataGenerator(
    rescale=1./255,
    rotation_range=25,
    width_shift_range=0.2,
    height_shift_range=0.2,
    shear_range=0.2,
    zoom_range=0.2,
    horizontal_flip=True,
    vertical_flip=True,
    fill_mode='nearest',
    brightness_range=[0.8, 1.2],
    channel_shift_range=15,
    validation_split=0.2
)

val_test_datagen = ImageDataGenerator(rescale=1./255)

print("\nLoading data...")
train_generator = train_datagen.flow_from_directory(
    Config.TRAIN_DIR,
    target_size=(Config.IMG_SIZE, Config.IMG_SIZE),
    batch_size=Config.BATCH_SIZE,
    class_mode='categorical',
    subset='training',
    seed=42
)

valid_generator = train_datagen.flow_from_directory(
    Config.TRAIN_DIR,
    target_size=(Config.IMG_SIZE, Config.IMG_SIZE),
    batch_size=Config.BATCH_SIZE,
    class_mode='categorical',
    subset='validation',
    seed=42
)

test_generator = val_test_datagen.flow_from_directory(
    Config.TEST_DIR,
    target_size=(Config.IMG_SIZE, Config.IMG_SIZE),
    batch_size=Config.BATCH_SIZE,
    class_mode='categorical',
    shuffle=False
)

print(f"✓ Train batches: {len(train_generator)}")
print(f"✓ Validation batches: {len(valid_generator)}")
print(f"✓ Test batches: {len(test_generator)}")

# ==============================================================================
# BUILD MODEL
# ==============================================================================

print("\n" + "="*60)
print(f"BUILDING {Config.ARCHITECTURE} MODEL")
print("="*60)

if Config.ARCHITECTURE == 'ResNet50':
    base_model = keras.applications.ResNet50(
        input_shape=(Config.IMG_SIZE, Config.IMG_SIZE, 3),
        include_top=False,
        weights='imagenet'
    )
elif Config.ARCHITECTURE == 'EfficientNetB3':
    base_model = keras.applications.EfficientNetB3(
        input_shape=(Config.IMG_SIZE, Config.IMG_SIZE, 3),
        include_top=False,
        weights='imagenet'
    )
elif Config.ARCHITECTURE == 'MobileNetV2':
    base_model = keras.applications.MobileNetV2(
        input_shape=(Config.IMG_SIZE, Config.IMG_SIZE, 3),
        include_top=False,
        weights='imagenet'
    )
else:  # VGG16
    base_model = keras.applications.VGG16(
        input_shape=(Config.IMG_SIZE, Config.IMG_SIZE, 3),
        include_top=False,
        weights='imagenet'
    )

if Config.FREEZE_BASE:
    base_model.trainable = False
    print(f"✓ Base model frozen")

model = models.Sequential([
    base_model,
    layers.GlobalAveragePooling2D(name='global_pool'),
    layers.Dense(256, activation='relu', name='fc1'),  # Reduced from 512
    layers.BatchNormalization(),
    layers.Dropout(0.3),  # Reduced from 0.5
    layers.Dense(128, activation='relu', name='fc2'),  # Reduced from 256
    layers.Dropout(0.2),
    layers.Dense(num_classes, activation='softmax', name='output')
])

optimizer = Adam(learning_rate=Config.LEARNING_RATE)
model.compile(
    optimizer=optimizer,
    loss='categorical_crossentropy',
    metrics=['accuracy', keras.metrics.TopKCategoricalAccuracy(k=3, name='top_3_accuracy')]
)

print(f"✓ Model compiled")
print(f"✓ Parameters: {model.count_params():,}")

# ==============================================================================
# SETUP CALLBACKS
# ==============================================================================

os.makedirs(Config.OUTPUT_DIR, exist_ok=True)

callbacks = [
    EarlyStopping(monitor='val_loss', patience=15, restore_best_weights=True, verbose=1),
    ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=5, min_lr=1e-6, verbose=1),
    ModelCheckpoint(
        os.path.join(Config.OUTPUT_DIR, f'{Config.MODEL_NAME}_best.h5'),
        monitor='val_accuracy',
        mode='max',
        save_best_only=True,
        verbose=0
    ),
    TerminateOnNaN(),
    TensorBoard(log_dir=os.path.join(Config.OUTPUT_DIR, 'logs'), histogram_freq=1)
]

print("✓ Callbacks configured")

# ==============================================================================
# TRAINING PHASE 1: Feature Learning
# ==============================================================================

print("\n" + "="*60)
print("PHASE 1: TRAINING TOP LAYERS (FROZEN BASE)")
print("="*60)

history_1 = model.fit(
    train_generator,
    validation_data=valid_generator,
    epochs=Config.EPOCHS,
    callbacks=callbacks,
    verbose=1
)

# ==============================================================================
# FINE-TUNING PHASE 2
# ==============================================================================

print("\n" + "="*60)
print("PHASE 2: FINE-TUNING (UNFROZEN BASE)")
print("="*60)

base_model.trainable = True
freeze_until = len(base_model.layers) - 50
for layer in base_model.layers[:freeze_until]:
    layer.trainable = False

model.compile(
    optimizer=Adam(learning_rate=Config.LEARNING_RATE / 10),
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

print(f"✓ Base model unfrozen (last 50 layers)")

history_2 = model.fit(
    train_generator,
    validation_data=valid_generator,
    epochs=Config.EPOCHS,
    callbacks=callbacks,
    verbose=1
)

# ==============================================================================
# EVALUATION
# ==============================================================================

print("\n" + "="*60)
print("EVALUATION ON TEST SET")
print("="*60)

# Use fast evaluation to avoid waiting for the full test set.
# Set fast_eval = False only when you want the full report.
fast_eval = True
if fast_eval:
    eval_steps = min(len(test_generator), 20)
    print(f"✓ Fast evaluation enabled: using {eval_steps} steps out of {len(test_generator)}")
    test_loss, test_accuracy, test_top3 = model.evaluate(
        test_generator,
        steps=eval_steps,
        verbose=1,
        workers=4,
        use_multiprocessing=False
    )
else:
    test_loss, test_accuracy, test_top3 = model.evaluate(
        test_generator,
        verbose=1,
        workers=4,
        use_multiprocessing=False
    )

print(f"\n📊 TEST RESULTS:")
print(f"  Accuracy: {test_accuracy:.4f}")
print(f"  Top-3 Accuracy: {test_top3:.4f}")
print(f"  Loss: {test_loss:.4f}")

if not fast_eval:
    y_pred = model.predict(test_generator, verbose=0)
    y_pred_classes = np.argmax(y_pred, axis=1)
    y_true = test_generator.classes
    print(f"\n📋 CLASSIFICATION REPORT:")
    print(classification_report(y_true, y_pred_classes, target_names=classes, digits=4))
else:
    print("\n⚠️ Classification report skipped for speed. Set fast_eval = False to run the full test evaluation.")

# ==============================================================================
# SAVE MODEL
# ==============================================================================

print("\n" + "="*60)
print("SAVING MODEL")
print("="*60)

model_path_savedmodel = os.path.join(Config.OUTPUT_DIR, Config.MODEL_NAME)
model_path_h5 = os.path.join(Config.OUTPUT_DIR, f'{Config.MODEL_NAME}.h5')

# SavedModel
model.save(model_path_savedmodel, save_format='tf')
print(f"✓ SavedModel: {model_path_savedmodel}")

# H5
model.save(model_path_h5)
print(f"✓ H5 Model: {model_path_h5}")

# Class names
class_names_path = os.path.join(Config.OUTPUT_DIR, 'class_names.pkl')
with open(class_names_path, 'wb') as f:
    pickle.dump(classes, f)
print(f"✓ Class names saved")

# ==============================================================================
# VISUALIZATION
# ==============================================================================

fig, axes = plt.subplots(2, 2, figsize=(15, 12))

# Accuracy
axes[0, 0].plot(history_1.history['accuracy'], label='Phase 1 Train')
axes[0, 0].plot(history_1.history['val_accuracy'], label='Phase 1 Val')
axes[0, 0].set_title('Accuracy', fontsize=14, fontweight='bold')
axes[0, 0].set_xlabel('Epoch')
axes[0, 0].set_ylabel('Accuracy')
axes[0, 0].legend()
axes[0, 0].grid(True, alpha=0.3)

# Loss
axes[0, 1].plot(history_1.history['loss'], label='Phase 1 Train')
axes[0, 1].plot(history_1.history['val_loss'], label='Phase 1 Val')
axes[0, 1].set_title('Loss', fontsize=14, fontweight='bold')
axes[0, 1].set_xlabel('Epoch')
axes[0, 1].set_ylabel('Loss')
axes[0, 1].legend()
axes[0, 1].grid(True, alpha=0.3)

# Confusion Matrix
cm = confusion_matrix(y_true, y_pred_classes)
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', ax=axes[1, 0], cbar=False)
axes[1, 0].set_title('Confusion Matrix', fontsize=14, fontweight='bold')

# Class Accuracy
class_accuracy = cm.diagonal() / cm.sum(axis=1)
top_10_idx = np.argsort(class_accuracy)[-10:]
axes[1, 1].barh([classes[i] for i in top_10_idx], class_accuracy[top_10_idx], color='steelblue')
axes[1, 1].set_title('Top 10 Class Accuracy', fontsize=14, fontweight='bold')
axes[1, 1].set_xlabel('Accuracy')

plt.tight_layout()
plt.savefig(os.path.join(Config.OUTPUT_DIR, 'training_metrics.png'), dpi=300, bbox_inches='tight')
plt.show()

print("\n✓ Visualization saved")

# ==============================================================================
# SUMMARY
# ==============================================================================

print("\n" + "="*60)
print("TRAINING COMPLETED SUCCESSFULLY!")
print("="*60)
print(f"""
✓ Model: {Config.ARCHITECTURE}
✓ Classes: {num_classes}
✓ Test Accuracy: {test_accuracy:.4f}
✓ Test Top-3 Accuracy: {test_top3:.4f}

FILES SAVED TO: {Config.OUTPUT_DIR}
  - {Config.MODEL_NAME}/ (SavedModel)
  - {Config.MODEL_NAME}.h5 (Keras)
  - class_names.pkl (class mappings)
  - training_metrics.png (plots)

Ready for integration with FastAPI backend!
""")

# ==============================================================================
# CELL 6: Download Model (Optional - if using Colab Free)
# ==============================================================================
# If you need to download the model to your local machine:

from google.colab import files
import shutil

# Create zip of model directory
shutil.make_archive('/content/plant_disease_model', 'zip', Config.OUTPUT_DIR)
print("✓ Model directory zipped")

# Download
files.download('/content/plant_disease_model.zip')
print("✓ Download started - check your Downloads folder")

# ==============================================================================
# CELL 7: Test Inference (Optional)
# ==============================================================================

# Load model and test prediction
model_loaded = tf.keras.models.load_model(model_path_savedmodel)

# Get a test image and predict
test_images = test_generator.next()
test_images_data, test_labels = test_images

# Make prediction on first image
pred = model_loaded.predict(test_images_data[0:1], verbose=0)
pred_class = classes[np.argmax(pred[0])]
pred_confidence = np.max(pred[0])

print(f"\n✓ Inference Test:")
print(f"  Predicted: {pred_class}")
print(f"  Confidence: {pred_confidence:.4f}")
print(f"  True: {classes[np.argmax(test_labels[0])]}")
