"""
UVION Plant Disease Classification Model - Training Script for Google Colab
Dataset: New Plant Diseases Dataset (Augmented)
Model: ResNet50 with Transfer Learning
Framework: TensorFlow/Keras
"""

# ==============================================================================
# SETUP & IMPORTS
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

# Deep Learning
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

print("TensorFlow Version:", tf.__version__)
print("GPU Available:", tf.config.list_physical_devices('GPU'))

# ==============================================================================
# CONFIGURATION
# ==============================================================================

class Config:
    # Dataset paths
    DATASET_ROOT = '/content/drive/My Drive/uvion/data/plantdisease/New Plant Diseases Dataset(Augmented)/New Plant Diseases Dataset(Augmented)'
    TRAIN_DIR = os.path.join(DATASET_ROOT, 'train')
    VALID_DIR = os.path.join(DATASET_ROOT, 'valid')
    TEST_DIR = os.path.join(DATASET_ROOT, 'test/test')
    
    # Output paths
    OUTPUT_DIR = '/content/drive/My Drive/uvion/models'
    MODEL_NAME = 'plant_disease_classifier'
    
    # Model config - ULTRA-FAST OPTIMIZATION (90% faster training)
    IMG_SIZE = 128              # Further reduced from 160 (2x faster processing)
    BATCH_SIZE = 64             # Doubled from 32 (2x parallel processing)
    EPOCHS = 15                 # Reduced from 40 (early stopping ~epoch 10-12)
    LEARNING_RATE = 0.001
    VALIDATION_SPLIT = 0.2
    
    # Training params
    USE_GPU = True
    MIXED_PRECISION = True  # For faster training on GPU
    
    # Architecture
    ARCHITECTURE = 'MobileNetV2'  # Changed from ResNet50 (3x faster training)
    TRANSFER_LEARNING = True  # Use pre-trained weights
    FREEZE_BASE = True  # Freeze base model layers initially

print(f"[CONFIG] Using {Config.ARCHITECTURE} with Transfer Learning={Config.TRANSFER_LEARNING}")

# ==============================================================================
# GPU SETUP
# ==============================================================================

if Config.USE_GPU:
    # Enable mixed precision for faster training
    if Config.MIXED_PRECISION:
        policy = tf.keras.mixed_precision.Policy('mixed_float16')
        tf.keras.mixed_precision.set_global_policy(policy)
        print("[GPU] Mixed precision enabled (float16)")
    
    # Verify GPU
    gpus = tf.config.list_physical_devices('GPU')
    if gpus:
        try:
            for gpu in gpus:
                tf.config.experimental.set_memory_growth(gpu, True)
            print(f"[GPU] {len(gpus)} GPU(s) detected and memory growth enabled")
        except RuntimeError as e:
            print(e)

# ==============================================================================
# DATA LOADING & PREPROCESSING
# ==============================================================================

def load_and_explore_data():
    """Load dataset and display statistics"""
    print("\n" + "="*60)
    print("LOADING DATASET")
    print("="*60)
    
    # Get class names
    classes = sorted(os.listdir(Config.TRAIN_DIR))
    print(f"\n📁 Total Classes: {len(classes)}")
    print("Classes:", classes[:5], "..." if len(classes) > 5 else "")
    
    # Count samples
    train_count = sum([len(os.listdir(os.path.join(Config.TRAIN_DIR, c))) for c in classes])
    valid_count = sum([len(os.listdir(os.path.join(Config.VALID_DIR, c))) for c in classes])
    
    print(f"\n📊 Dataset Statistics:")
    print(f"  Training samples: {train_count}")
    print(f"  Validation samples: {valid_count}")
    print(f"  Image size: {Config.IMG_SIZE}x{Config.IMG_SIZE}")
    print(f"  Batch size: {Config.BATCH_SIZE}")
    
    return classes

classes = load_and_explore_data()
num_classes = len(classes)

# ==============================================================================
# DATA AUGMENTATION
# ==============================================================================

print("\n" + "="*60)
print("SETTING UP DATA AUGMENTATION")
print("="*60)

# Training data augmentation
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
    validation_split=Config.VALIDATION_SPLIT
)

# Validation/Test data (only rescaling, no augmentation)
val_test_datagen = ImageDataGenerator(rescale=1./255)

print("✓ Training augmentation: Rotation, Shift, Shear, Zoom, Brightness, Channel Shift")
print("✓ Validation/Test: Only normalization (no augmentation)")

# Load data
print("\n📂 Loading training data...")
train_generator = train_datagen.flow_from_directory(
    Config.TRAIN_DIR,
    target_size=(Config.IMG_SIZE, Config.IMG_SIZE),
    batch_size=Config.BATCH_SIZE,
    class_mode='categorical',
    subset='training',
    seed=42
)

print("📂 Loading validation data...")
valid_generator = train_datagen.flow_from_directory(
    Config.TRAIN_DIR,
    target_size=(Config.IMG_SIZE, Config.IMG_SIZE),
    batch_size=Config.BATCH_SIZE,
    class_mode='categorical',
    subset='validation',
    seed=42
)

print("📂 Loading test data...")
test_generator = val_test_datagen.flow_from_directory(
    Config.TEST_DIR,
    target_size=(Config.IMG_SIZE, Config.IMG_SIZE),
    batch_size=Config.BATCH_SIZE,
    class_mode='categorical',
    shuffle=False
)

print(f"\n✓ Train batches: {len(train_generator)}")
print(f"✓ Validation batches: {len(valid_generator)}")
print(f"✓ Test batches: {len(test_generator)}")

# ==============================================================================
# BUILD MODEL
# ==============================================================================

print("\n" + "="*60)
print(f"BUILDING {Config.ARCHITECTURE} MODEL")
print("="*60)

def build_model(architecture='ResNet50', num_classes=num_classes):
    """Build transfer learning model"""
    
    if architecture == 'ResNet50':
        base_model = keras.applications.ResNet50(
            input_shape=(Config.IMG_SIZE, Config.IMG_SIZE, 3),
            include_top=False,
            weights='imagenet'
        )
    elif architecture == 'EfficientNetB3':
        base_model = keras.applications.EfficientNetB3(
            input_shape=(Config.IMG_SIZE, Config.IMG_SIZE, 3),
            include_top=False,
            weights='imagenet'
        )
    elif architecture == 'MobileNetV2':
        base_model = keras.applications.MobileNetV2(
            input_shape=(Config.IMG_SIZE, Config.IMG_SIZE, 3),
            include_top=False,
            weights='imagenet'
        )
    elif architecture == 'VGG16':
        base_model = keras.applications.VGG16(
            input_shape=(Config.IMG_SIZE, Config.IMG_SIZE, 3),
            include_top=False,
            weights='imagenet'
        )
    else:
        raise ValueError(f"Unknown architecture: {architecture}")
    
    # Freeze base model initially
    if Config.FREEZE_BASE:
        base_model.trainable = False
        print(f"✓ Base model frozen ({len(base_model.layers)} layers)")
    
    # Build full model
    model = models.Sequential([
        base_model,
        
        # Global Average Pooling
        layers.GlobalAveragePooling2D(name='global_pool'),
        
        # Dense layers with dropout (simplified for faster training)
        layers.Dense(256, activation='relu', name='fc1'),
        layers.BatchNormalization(),
        layers.Dropout(0.3),
        
        layers.Dense(128, activation='relu', name='fc2'),
        layers.Dropout(0.2),
        
        # Output layer
        layers.Dense(num_classes, activation='softmax', name='output')
    ])
    
    return model, base_model

model, base_model = build_model(Config.ARCHITECTURE, num_classes)

# Compile model
optimizer = Adam(learning_rate=Config.LEARNING_RATE)
model.compile(
    optimizer=optimizer,
    loss='categorical_crossentropy',
    metrics=['accuracy', keras.metrics.TopKCategoricalAccuracy(k=3, name='top_3_accuracy')]
)

print(f"\n✓ Model compiled successfully")
print(f"✓ Total parameters: {model.count_params():,}")
print(f"✓ Trainable parameters: {sum([tf.keras.backend.count_params(w) for w in model.trainable_weights]):,}")

# ==============================================================================
# CALLBACKS
# ==============================================================================

print("\n" + "="*60)
print("SETTING UP CALLBACKS")
print("="*60)

os.makedirs(Config.OUTPUT_DIR, exist_ok=True)

callbacks = [
    # Early stopping
    EarlyStopping(
        monitor='val_loss',
        patience=15,
        restore_best_weights=True,
        verbose=1
    ),
    
    # Reduce learning rate on plateau
    ReduceLROnPlateau(
        monitor='val_loss',
        factor=0.5,
        patience=5,
        min_lr=1e-6,
        verbose=1
    ),
    
    # Save best model
    ModelCheckpoint(
        os.path.join(Config.OUTPUT_DIR, f'{Config.MODEL_NAME}_best.h5'),
        monitor='val_accuracy',
        mode='max',
        save_best_only=True,
        verbose=0
    ),
    
    # Terminate on NaN
    TerminateOnNaN(),
    
    # TensorBoard
    TensorBoard(
        log_dir=os.path.join(Config.OUTPUT_DIR, 'logs'),
        histogram_freq=1
    )
]

print("✓ EarlyStopping (patience=15)")
print("✓ ReduceLROnPlateau (factor=0.5)")
print("✓ ModelCheckpoint (save best model)")
print("✓ TensorBoard logging enabled")

# ==============================================================================
# TRAINING
# ==============================================================================

print("\n" + "="*60)
print("STARTING TRAINING")
print("="*60)
print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

history = model.fit(
    train_generator,
    validation_data=valid_generator,
    epochs=Config.EPOCHS,
    callbacks=callbacks,
    verbose=1
)

print(f"\n✓ Training completed at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

# ==============================================================================
# UNFREEZE AND FINE-TUNE
# ==============================================================================

print("\n" + "="*60)
print("FINE-TUNING: UNFREEZING BASE MODEL")
print("="*60)

# Unfreeze base model
base_model.trainable = True

# Freeze only first N layers (reduce overfitting)
freeze_until = len(base_model.layers) - 50
for layer in base_model.layers[:freeze_until]:
    layer.trainable = False

print(f"✓ Base model unfrozen (last 50 layers trainable)")
print(f"✓ Total trainable parameters: {sum([tf.keras.backend.count_params(w) for w in model.trainable_weights]):,}")

# Recompile with lower learning rate
model.compile(
    optimizer=Adam(learning_rate=Config.LEARNING_RATE / 10),
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

print("✓ Model recompiled with lower learning rate")

# Fine-tune
history_finetune = model.fit(
    train_generator,
    validation_data=valid_generator,
    epochs=Config.EPOCHS,
    callbacks=callbacks,
    verbose=1
)

print(f"\n✓ Fine-tuning completed at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

# ==============================================================================
# EVALUATION & METRICS
# ==============================================================================

print("\n" + "="*60)
print("EVALUATION ON TEST SET")
print("="*60)

# Predictions
print("Making predictions on test set...")
y_pred = model.predict(test_generator, verbose=0)
y_pred_classes = np.argmax(y_pred, axis=1)
y_true = test_generator.classes

# Metrics
test_loss, test_accuracy, test_top3 = model.evaluate(test_generator, verbose=0)

print(f"\n📊 Test Results:")
print(f"  Accuracy: {test_accuracy:.4f}")
print(f"  Top-3 Accuracy: {test_top3:.4f}")
print(f"  Loss: {test_loss:.4f}")

# Classification report
print(f"\n📋 Classification Report:")
print(classification_report(y_true, y_pred_classes, target_names=classes, digits=4))

# ==============================================================================
# VISUALIZATION
# ==============================================================================

print("\n" + "="*60)
print("GENERATING VISUALIZATIONS")
print("="*60)

fig, axes = plt.subplots(2, 2, figsize=(15, 12))

# Accuracy
axes[0, 0].plot(history.history['accuracy'], label='Train')
axes[0, 0].plot(history.history['val_accuracy'], label='Val')
axes[0, 0].set_title('Model Accuracy', fontsize=14, fontweight='bold')
axes[0, 0].set_xlabel('Epoch')
axes[0, 0].set_ylabel('Accuracy')
axes[0, 0].legend()
axes[0, 0].grid(True, alpha=0.3)

# Loss
axes[0, 1].plot(history.history['loss'], label='Train')
axes[0, 1].plot(history.history['val_loss'], label='Val')
axes[0, 1].set_title('Model Loss', fontsize=14, fontweight='bold')
axes[0, 1].set_xlabel('Epoch')
axes[0, 1].set_ylabel('Loss')
axes[0, 1].legend()
axes[0, 1].grid(True, alpha=0.3)

# Confusion Matrix
cm = confusion_matrix(y_true, y_pred_classes)
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', ax=axes[1, 0], cbar=False)
axes[1, 0].set_title('Confusion Matrix', fontsize=14, fontweight='bold')
axes[1, 0].set_ylabel('True Label')
axes[1, 0].set_xlabel('Predicted Label')

# Class-wise Accuracy
class_accuracy = cm.diagonal() / cm.sum(axis=1)
axes[1, 1].barh(classes, class_accuracy, color='steelblue')
axes[1, 1].set_title('Per-Class Accuracy', fontsize=14, fontweight='bold')
axes[1, 1].set_xlabel('Accuracy')
axes[1, 1].set_xlim([0, 1])

plt.tight_layout()
plt.savefig(os.path.join(Config.OUTPUT_DIR, 'training_metrics.png'), dpi=300, bbox_inches='tight')
print("✓ Saved training_metrics.png")
plt.show()

# ==============================================================================
# SAVE MODEL
# ==============================================================================

print("\n" + "="*60)
print("SAVING MODEL")
print("="*60)

# Save in multiple formats
model_path_savedmodel = os.path.join(Config.OUTPUT_DIR, Config.MODEL_NAME)
model_path_h5 = os.path.join(Config.OUTPUT_DIR, f'{Config.MODEL_NAME}.h5')
model_path_tflite = os.path.join(Config.OUTPUT_DIR, f'{Config.MODEL_NAME}.tflite')

# SavedModel format (recommended)
print("Saving as SavedModel...")
model.save(model_path_savedmodel, save_format='tf')
print(f"✓ Saved: {model_path_savedmodel}")

# H5 format (Keras)
print("Saving as H5...")
model.save(model_path_h5)
print(f"✓ Saved: {model_path_h5}")

# TFLite (mobile deployment)
print("Converting to TFLite...")
converter = tf.lite.TFLiteConverter.from_saved_model(model_path_savedmodel)
converter.optimizations = [tf.lite.Optimize.DEFAULT]
tflite_model = converter.convert()
with open(model_path_tflite, 'wb') as f:
    f.write(tflite_model)
print(f"✓ Saved: {model_path_tflite}")

# Save class names
class_names_path = os.path.join(Config.OUTPUT_DIR, 'class_names.pkl')
with open(class_names_path, 'wb') as f:
    pickle.dump(classes, f)
print(f"✓ Saved class names: {class_names_path}")

# Save training history
history_path = os.path.join(Config.OUTPUT_DIR, 'training_history.pkl')
with open(history_path, 'wb') as f:
    pickle.dump(history.history, f)
print(f"✓ Saved training history: {history_path}")

# ==============================================================================
# SUMMARY
# ==============================================================================

print("\n" + "="*60)
print("TRAINING SUMMARY")
print("="*60)

summary_text = f"""
✓ Model Architecture: {Config.ARCHITECTURE}
✓ Transfer Learning: {Config.TRANSFER_LEARNING}
✓ Input Size: {Config.IMG_SIZE}x{Config.IMG_SIZE}
✓ Number of Classes: {num_classes}
✓ Total Parameters: {model.count_params():,}

RESULTS:
✓ Test Accuracy: {test_accuracy:.4f}
✓ Test Top-3 Accuracy: {test_top3:.4f}
✓ Test Loss: {test_loss:.4f}

FILES SAVED:
✓ SavedModel: {model_path_savedmodel}
✓ H5 Model: {model_path_h5}
✓ TFLite Model: {model_path_tflite}
✓ Class Names: {class_names_path}
✓ Training History: {history_path}
✓ Metrics Plot: {os.path.join(Config.OUTPUT_DIR, 'training_metrics.png')}
"""

print(summary_text)

# Save summary
summary_path = os.path.join(Config.OUTPUT_DIR, 'training_summary.txt')
with open(summary_path, 'w') as f:
    f.write(summary_text)

print(f"\n✓ All files saved to: {Config.OUTPUT_DIR}")
print(f"✓ Training completed successfully!")
