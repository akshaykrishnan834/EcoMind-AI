"""
Waste Classification Model Training Script (7 Categories)
Uses Transfer Learning (MobileNetV2) with data augmentation, class balancing, and checkpointing.
"""

import os
import sys
import json
from datetime import datetime
from collections import Counter
import numpy as np

import tensorflow as tf
from tensorflow.keras import layers, models
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint, ReduceLROnPlateau

import config

def compute_class_weights(dataset, num_classes):
    """Computes balanced class weights from a tf.data dataset to handle imbalanced categories."""
    labels = []
    for _, y in dataset:
        labels.extend(y.numpy().tolist())
    
    counts = Counter(labels)
    total_samples = len(labels)
    class_weights = {}
    for class_idx in range(num_classes):
        count = counts.get(class_idx, 1)
        class_weights[class_idx] = total_samples / (num_classes * count)
    return class_weights

def build_model(num_classes=7, input_shape=(224, 224, 3)):
    """Builds a transfer learning model based on MobileNetV2 with data augmentation."""
    data_augmentation = tf.keras.Sequential([
        layers.RandomFlip("horizontal"),
        layers.RandomRotation(0.2),
        layers.RandomZoom(0.15),
        layers.RandomTranslation(0.1, 0.1),
        layers.RandomContrast(0.1),
    ], name="data_augmentation")

    inputs = layers.Input(shape=input_shape)
    x = data_augmentation(inputs)
    x = tf.keras.applications.mobilenet_v2.preprocess_input(x)

    # Pretrained MobileNetV2 backbone (frozen initially)
    base_model = tf.keras.applications.MobileNetV2(
        input_shape=input_shape,
        include_top=False,
        weights="imagenet"
    )
    base_model.trainable = False

    x = base_model(x, training=False)
    x = layers.GlobalAveragePooling2D()(x)
    x = layers.Dropout(0.3)(x)
    x = layers.Dense(128, activation="relu")(x)
    x = layers.BatchNormalization()(x)
    x = layers.Dropout(0.2)(x)
    outputs = layers.Dense(num_classes, activation="softmax", name="predictions")(x)

    model = models.Model(inputs=inputs, outputs=outputs, name="EcoMind_WasteClassifier_MobileNetV2")
    return model, base_model

def train():
    print(f"Loading dataset from: {config.DATASET_DIR}")
    if not os.path.exists(config.DATASET_DIR):
        raise FileNotFoundError(f"Dataset directory not found: {config.DATASET_DIR}")

    # Load dataset with color_mode='rgb' to handle RGBA PNGs
    train_ds, val_ds = tf.keras.utils.image_dataset_from_directory(
        directory=str(config.DATASET_DIR),
        color_mode="rgb",
        image_size=config.IMG_SIZE,
        batch_size=config.BATCH_SIZE,
        validation_split=config.VALIDATION_SPLIT,
        subset="both",
        seed=config.RANDOM_SEED,
        shuffle=True
    )

    class_names = train_ds.class_names
    num_classes = len(class_names)
    print(f"\nDiscovered {num_classes} classes: {class_names}")

    if num_classes != 7:
        print(f"WARNING: Expected 7 classes, but found {num_classes}. Classes: {class_names}")

    # Compute class weights for imbalance mitigation
    class_weights = compute_class_weights(train_ds, num_classes)
    print("\nCalculated Class Weights for training:")
    for idx, name in enumerate(class_names):
        print(f"  [{idx}] {name}: weight = {class_weights.get(idx, 1.0):.2f}")

    # Optimize datasets for execution performance
    autotune = tf.data.AUTOTUNE
    train_dataset = train_ds.cache().prefetch(buffer_size=autotune)
    val_dataset = val_ds.cache().prefetch(buffer_size=autotune)

    # Build model
    model, base_model = build_model(num_classes=num_classes)
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=config.LEARNING_RATE),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"]
    )
    model.summary()

    # Training callbacks
    callbacks = [
        EarlyStopping(
            monitor="val_loss",
            patience=7,
            restore_best_weights=True,
            verbose=1
        ),
        ReduceLROnPlateau(
            monitor="val_loss",
            factor=0.5,
            patience=3,
            min_lr=1e-6,
            verbose=1
        ),
        ModelCheckpoint(
            filepath=str(config.MODEL_SAVE_PATH),
            monitor="val_loss",
            save_best_only=True,
            verbose=1
        )
    ]

    print("\n--- Phase 1: Training Classification Head ---")
    history = model.fit(
        train_dataset,
        validation_data=val_dataset,
        epochs=config.EPOCHS,
        class_weight=class_weights,
        callbacks=callbacks
    )

    # Fine-tuning: Unfreeze top layers of base model
    print("\n--- Phase 2: Fine-Tuning Top MobileNetV2 Layers ---")
    base_model.trainable = True
    # Freeze all layers except the last 30 layers
    for layer in base_model.layers[:-30]:
        layer.trainable = False

    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=config.LEARNING_RATE / 5),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"]
    )

    fine_tune_epochs = 15
    total_epochs = len(history.history["loss"]) + fine_tune_epochs

    model.fit(
        train_dataset,
        validation_data=val_dataset,
        initial_epoch=len(history.history["loss"]),
        epochs=total_epochs,
        class_weight=class_weights,
        callbacks=callbacks
    )

    # Save final model if not already saved by checkpoint
    model.save(str(config.MODEL_SAVE_PATH))
    print(f"\nModel saved successfully to: {config.MODEL_SAVE_PATH}")

    # Save metadata for prediction/serving
    metadata = {
        "class_names": class_names,
        "recyclable_status": {
            cls: config.RECYCLABLE_STATUS.get(cls, False) for cls in class_names
        },
        "input_shape": list(config.IMG_SIZE) + [3],
        "trained_at": datetime.utcnow().isoformat() + "Z",
        "num_classes": num_classes
    }
    with open(config.METADATA_SAVE_PATH, "w") as f:
        json.dump(metadata, f, indent=2)
    print(f"Metadata saved successfully to: {config.METADATA_SAVE_PATH}")

if __name__ == "__main__":
    train()
