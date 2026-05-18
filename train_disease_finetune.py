import os
from pathlib import Path
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, models
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau, ModelCheckpoint, TensorBoard
from tensorflow.keras.optimizers import Adam
import pickle


def set_gpu_policy(use_gpu=True, mixed_precision=True):
    if not use_gpu:
        print("[INFO] GPU disabled, running on CPU")
        return

    gpus = tf.config.list_physical_devices('GPU')
    if not gpus:
        print("[INFO] No GPU detected, running on CPU")
        return

    try:
        for gpu in gpus:
            tf.config.experimental.set_memory_growth(gpu, True)
        print(f"[INFO] {len(gpus)} GPU(s) detected and memory growth enabled")

        if mixed_precision:
            policy = tf.keras.mixed_precision.Policy('mixed_float16')
            tf.keras.mixed_precision.set_global_policy(policy)
            print("[INFO] Mixed precision enabled")
    except RuntimeError as e:
        print(f"[WARN] GPU memory growth not set: {e}")


class Config:
    DATASET_ROOT = Path('data/plantdisease/New Plant Diseases Dataset(Augmented)/New Plant Diseases Dataset(Augmented)')
    TRAIN_DIR = DATASET_ROOT / 'train'
    VALID_DIR = DATASET_ROOT / 'valid'
    TEST_DIR = DATASET_ROOT / 'test/test'

    OUTPUT_DIR = Path('models/plant_disease_model')
    MODEL_NAME = 'plant_disease_classifier'

    IMG_SIZE = 128
    BATCH_SIZE = 64
    PHASE1_EPOCHS = 8
    PHASE2_EPOCHS = 6
    FREEZE_BASE = True
    FINE_TUNE_AT = 100

    INITIAL_LR = 1e-3
    FINE_TUNE_LR = 1e-4
    VALIDATION_SPLIT = 0.0
    USE_GPU = True
    MIXED_PRECISION = True


def create_generators(config: Config):
    train_datagen = ImageDataGenerator(
        rescale=1.0/255.0,
        rotation_range=20,
        width_shift_range=0.15,
        height_shift_range=0.15,
        shear_range=0.15,
        zoom_range=0.15,
        horizontal_flip=True,
        vertical_flip=True,
        fill_mode='nearest'
    )

    validation_datagen = ImageDataGenerator(rescale=1.0/255.0)

    train_generator = train_datagen.flow_from_directory(
        directory=str(config.TRAIN_DIR),
        target_size=(config.IMG_SIZE, config.IMG_SIZE),
        batch_size=config.BATCH_SIZE,
        class_mode='categorical',
        shuffle=True,
        seed=42
    )

    valid_generator = validation_datagen.flow_from_directory(
        directory=str(config.VALID_DIR),
        target_size=(config.IMG_SIZE, config.IMG_SIZE),
        batch_size=config.BATCH_SIZE,
        class_mode='categorical',
        shuffle=False,
        seed=42
    )

    return train_generator, valid_generator


def build_model(config: Config, num_classes: int):
    base_model = keras.applications.MobileNetV2(
        input_shape=(config.IMG_SIZE, config.IMG_SIZE, 3),
        include_top=False,
        weights='imagenet'
    )
    base_model.trainable = not config.FREEZE_BASE

    inputs = keras.Input(shape=(config.IMG_SIZE, config.IMG_SIZE, 3))
    x = base_model(inputs, training=False)
    x = layers.GlobalAveragePooling2D()(x)
    x = layers.Dropout(0.3)(x)
    x = layers.Dense(256, activation='relu')(x)
    x = layers.BatchNormalization()(x)
    x = layers.Dropout(0.2)(x)
    outputs = layers.Dense(num_classes, activation='softmax', dtype='float32')(x)

    model = keras.Model(inputs, outputs, name=config.MODEL_NAME)
    return model, base_model


def compile_model(model, lr):
    optimizer = Adam(learning_rate=lr)
    model.compile(
        optimizer=optimizer,
        loss='categorical_crossentropy',
        metrics=['accuracy', keras.metrics.TopKCategoricalAccuracy(k=3, name='top_3_accuracy')]
    )


def fine_tune_model(base_model, fine_tune_at: int):
    base_model.trainable = True
    for layer in base_model.layers[:fine_tune_at]:
        layer.trainable = False
    for layer in base_model.layers[fine_tune_at:]:
        layer.trainable = True
    print(f"[INFO] Unfroze base model from layer {fine_tune_at} / {len(base_model.layers)}")


def create_callbacks(output_dir: Path, stage_name: str):
    output_dir.mkdir(parents=True, exist_ok=True)
    checkpoint_path = output_dir / f'{stage_name}_best_weights.h5'
    log_dir = output_dir / 'logs' / stage_name

    return [
        ModelCheckpoint(
            filepath=str(checkpoint_path),
            monitor='val_loss',
            save_best_only=True,
            save_weights_only=True,
            verbose=1
        ),
        EarlyStopping(
            monitor='val_loss',
            patience=4,
            restore_best_weights=True,
            verbose=1
        ),
        ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.5,
            patience=2,
            verbose=1,
            min_lr=1e-6
        ),
        TensorBoard(log_dir=str(log_dir), histogram_freq=0)
    ]


def save_artifacts(model, classes, config: Config):
    config.OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    h5_path = config.OUTPUT_DIR / f'{config.MODEL_NAME}.h5'
    model_path = config.OUTPUT_DIR / 'savedmodel'
    class_path = config.OUTPUT_DIR / 'class_names.pkl'

    print(f"[INFO] Saving model to {h5_path}")
    model.save(str(h5_path), include_optimizer=False)

    print(f"[INFO] Saving SavedModel to {model_path}")
    model.save(str(model_path), save_format='tf')

    with open(class_path, 'wb') as f:
        pickle.dump(classes, f)
    print(f"[INFO] Saved class names to {class_path}")


def main():
    config = Config()
    set_gpu_policy(config.USE_GPU, config.MIXED_PRECISION)

    if not config.TRAIN_DIR.exists() or not config.VALID_DIR.exists():
        raise FileNotFoundError(
            f"Training or validation directory not found.\n"
            f"TRAIN_DIR={config.TRAIN_DIR}\nVALID_DIR={config.VALID_DIR}"
        )

    train_generator, valid_generator = create_generators(config)
    num_classes = train_generator.num_classes
    class_names = list(train_generator.class_indices.keys())
    print(f"[INFO] Found {num_classes} classes")

    model, base_model = build_model(config, num_classes)
    compile_model(model, config.INITIAL_LR)
    model.summary()

    stage1_callbacks = create_callbacks(config.OUTPUT_DIR, 'phase1')
    print(f"[INFO] Starting Phase 1 training: frozen base model for {config.PHASE1_EPOCHS} epochs")
    model.fit(
        train_generator,
        epochs=config.PHASE1_EPOCHS,
        validation_data=valid_generator,
        callbacks=stage1_callbacks,
        workers=4,
        use_multiprocessing=False
    )

    print("[INFO] Phase 1 complete. Starting fine-tuning stage.")
    fine_tune_model(base_model, config.FINE_TUNE_AT)
    compile_model(model, config.FINE_TUNE_LR)

    stage2_callbacks = create_callbacks(config.OUTPUT_DIR, 'phase2')
    model.fit(
        train_generator,
        epochs=config.PHASE2_EPOCHS,
        validation_data=valid_generator,
        callbacks=stage2_callbacks,
        workers=4,
        use_multiprocessing=False
    )

    save_artifacts(model, class_names, config)
    print('[INFO] Training complete.')


if __name__ == '__main__':
    main()
