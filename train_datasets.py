import json
import os
from pathlib import Path
import pickle

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.metrics import accuracy_score, classification_report, mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
import joblib

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import datasets, transforms

ROOT = Path(__file__).resolve().parent
DATA_ROOT = ROOT / 'data'
MODEL_ROOT = ROOT / 'models'
OUTPUT_ROOT = ROOT / 'outputs'

DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'cpu')


def ensure_dirs():
    MODEL_ROOT.mkdir(exist_ok=True)
    OUTPUT_ROOT.mkdir(exist_ok=True)


def df_model_summary(df, name):
    print(f'[{name}] rows={len(df):,} cols={df.shape[1]}')
    print(df.dtypes)
    print(df.head(3).to_dict(orient='records'))


def train_fertilizer_prediction():
    path = DATA_ROOT / 'Fertilizer Prediction.csv'
    if not path.exists():
        raise FileNotFoundError(path)
    df = pd.read_csv(path)
    df.columns = df.columns.str.strip()
    target = 'Fertilizer Name'
    features = ['Temparature', 'Humidity', 'Moisture', 'Soil Type', 'Crop Type', 'Nitrogen', 'Potassium', 'Phosphorous']
    if 'Humidity' not in df.columns:
        df.rename(columns={'Humidity ': 'Humidity'}, inplace=True)
    X = df[features]
    y = df[target]
    cat_cols = ['Soil Type', 'Crop Type']
    num_cols = ['Temparature', 'Humidity', 'Moisture', 'Nitrogen', 'Potassium', 'Phosphorous']
    pipeline = Pipeline([
        ('preproc', ColumnTransformer([
            ('num', StandardScaler(), num_cols),
            ('cat', OneHotEncoder(handle_unknown='ignore'), cat_cols),
        ])),
        ('clf', RandomForestClassifier(n_estimators=100, random_state=42))
    ])
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    pipeline.fit(X_train, y_train)
    y_pred = pipeline.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print('[Fertilizer Prediction] accuracy', acc)
    print(classification_report(y_test, y_pred, zero_division=0))
    joblib.dump(pipeline, MODEL_ROOT / 'fertilizer_prediction.pkl')
    with open(OUTPUT_ROOT / 'fertilizer_prediction_metrics.json', 'w') as f:
        json.dump({'accuracy': acc}, f, indent=2)


def train_crop_recommendation():
    path = DATA_ROOT / 'fertilizer' / 'Crop_recommendation.csv'
    if not path.exists():
        raise FileNotFoundError(path)
    df = pd.read_csv(path)
    target = 'label'
    features = ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']
    X = df[features]
    y = df[target]
    pipeline = Pipeline([
        ('scaler', StandardScaler()),
        ('clf', RandomForestClassifier(n_estimators=100, random_state=42))
    ])
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    pipeline.fit(X_train, y_train)
    y_pred = pipeline.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print('[Crop Recommendation] accuracy', acc)
    print(classification_report(y_test, y_pred, zero_division=0))
    joblib.dump(pipeline, MODEL_ROOT / 'crop_recommendation.pkl')
    with open(OUTPUT_ROOT / 'crop_recommendation_metrics.json', 'w') as f:
        json.dump({'accuracy': acc}, f, indent=2)


def train_tabular_regression(df, label_col, feature_cols, output_name, categorical=None):
    if categorical is None:
        categorical = []
    X = df[feature_cols].copy()
    y = df[label_col].copy()
    num_cols = [c for c in feature_cols if c not in categorical]
    pipeline = Pipeline([
        ('preproc', ColumnTransformer([
            ('num', StandardScaler(), num_cols),
            ('cat', OneHotEncoder(handle_unknown='ignore'), categorical),
        ])),
        ('reg', RandomForestRegressor(n_estimators=150, random_state=42, n_jobs=-1))
    ])
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    pipeline.fit(X_train, y_train)
    y_pred = pipeline.predict(X_test)
    metrics = {
        'mae': float(mean_absolute_error(y_test, y_pred)),
        'rmse': float(np.sqrt(mean_squared_error(y_test, y_pred))),
        'r2': float(r2_score(y_test, y_pred)),
    }
    print(f'[{output_name}]', metrics)
    joblib.dump(pipeline, MODEL_ROOT / f'{output_name}.pkl')
    with open(OUTPUT_ROOT / f'{output_name}_metrics.json', 'w') as f:
        json.dump(metrics, f, indent=2)


def train_yield_soil_weather():
    path = DATA_ROOT / 'yeild+soil+weather' / 'crop_yield.csv'
    df = pd.read_csv(path)
    df = df.dropna(subset=['yield'])
    df['season'] = df['season'].astype(str).str.strip()
    df['state'] = df['state'].astype(str).str.strip()
    feature_cols = ['area', 'production', 'fertilizer', 'pesticide', 'year', 'crop', 'season', 'state']
    categorical = ['crop', 'season', 'state']
    df = df[feature_cols + ['yield']].copy()
    df.rename(columns={'yield': 'target'}, inplace=True)
    train_tabular_regression(df, 'target', feature_cols, 'yield_soil_weather', categorical=categorical)


def train_yield_prediction():
    path = DATA_ROOT / 'yeildprediction' / 'yield_df.csv'
    df = pd.read_csv(path)
    df = df.dropna(subset=['hg/ha_yield'])
    df.rename(columns={'hg/ha_yield': 'yield_target'}, inplace=True)
    df['Area'] = df['Area'].astype(str).str.strip()
    df['Item'] = df['Item'].astype(str).str.strip()
    feature_cols = ['Area', 'Item', 'Year', 'average_rain_fall_mm_per_year', 'pesticides_tonnes', 'avg_temp']
    categorical = ['Area', 'Item']
    train_tabular_regression(df, 'yield_target', feature_cols, 'yield_prediction', categorical=categorical)


def get_image_data_paths(dataset_name):
    if dataset_name == 'plantdisease':
        return DATA_ROOT / 'plantdisease' / 'New Plant Diseases Dataset(Augmented)' / 'New Plant Diseases Dataset(Augmented)'
    if dataset_name == 'riceleaf':
        return DATA_ROOT / 'riceleaf disease' / 'rice_leaf_diseases'
    raise ValueError(dataset_name)


class SimpleCNN(nn.Module):
    def __init__(self, num_classes):
        super().__init__()
        self.conv = nn.Sequential(
            nn.Conv2d(3, 32, kernel_size=3, stride=1, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2),
            nn.Conv2d(32, 64, kernel_size=3, stride=1, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2),
            nn.Conv2d(64, 128, kernel_size=3, stride=1, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2),
        )
        self.fc = nn.Sequential(
            nn.Flatten(),
            nn.Linear(128 * 16 * 16, 256),
            nn.ReLU(inplace=True),
            nn.Dropout(0.4),
            nn.Linear(256, num_classes),
        )

    def forward(self, x):
        x = self.conv(x)
        return self.fc(x)


def train_image_model(dataset_name, epochs=3, batch_size=32, image_size=128):
    data_dir = get_image_data_paths(dataset_name)
    if not data_dir.exists():
        raise FileNotFoundError(data_dir)
    transform_train = transforms.Compose([
        transforms.Resize((image_size, image_size)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(15),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])
    transform_val = transforms.Compose([
        transforms.Resize((image_size, image_size)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])
    if dataset_name == 'riceleaf':
        full_train_ds = datasets.ImageFolder(data_dir, transform=transform_train)
        num_total = len(full_train_ds)
        if num_total == 0:
            raise FileNotFoundError('No images found in ' + str(data_dir))
        n_val = max(1, int(num_total * 0.2))
        n_train = num_total - n_val
        indices = np.arange(num_total)
        np.random.seed(42)
        np.random.shuffle(indices)
        train_indices = indices[:n_train].tolist()
        val_indices = indices[n_train:].tolist()
        train_ds = torch.utils.data.Subset(full_train_ds, train_indices)
        full_val_ds = datasets.ImageFolder(data_dir, transform=transform_val)
        valid_ds = torch.utils.data.Subset(full_val_ds, val_indices)
        classes = full_train_ds.classes
    else:
        train_dir = data_dir / 'train'
        valid_dir = data_dir / 'valid'
        if not train_dir.exists() or not valid_dir.exists():
            raise FileNotFoundError('train/valid folders not found in ' + str(data_dir))
        train_ds = datasets.ImageFolder(train_dir, transform=transform_train)
        valid_ds = datasets.ImageFolder(valid_dir, transform=transform_val)
        classes = train_ds.classes
    print(f'[{dataset_name}] classes', classes)
    print(f'[{dataset_name}] train size {len(train_ds):,}, valid size {len(valid_ds):,}')
    train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True, num_workers=0)
    valid_loader = DataLoader(valid_ds, batch_size=batch_size, shuffle=False, num_workers=0)
    model = SimpleCNN(num_classes=len(classes)).to(DEVICE)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=1e-3)
    best_acc = 0.0
    for epoch in range(1, epochs + 1):
        model.train()
        train_loss = 0.0
        correct = 0
        total = 0
        for images, labels in train_loader:
            images = images.to(DEVICE)
            labels = labels.to(DEVICE)
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            train_loss += loss.item() * images.size(0)
            _, preds = outputs.max(1)
            correct += (preds == labels).sum().item()
            total += labels.size(0)
        train_acc = correct / total
        train_loss = train_loss / total
        model.eval()
        valid_loss = 0.0
        correct = 0
        total = 0
        with torch.no_grad():
            for images, labels in valid_loader:
                images = images.to(DEVICE)
                labels = labels.to(DEVICE)
                outputs = model(images)
                loss = criterion(outputs, labels)
                valid_loss += loss.item() * images.size(0)
                _, preds = outputs.max(1)
                correct += (preds == labels).sum().item()
                total += labels.size(0)
        val_acc = correct / total
        valid_loss /= total
        print(f'[{dataset_name}] epoch {epoch}/{epochs} train_loss={train_loss:.4f} train_acc={train_acc:.4f} val_loss={valid_loss:.4f} val_acc={val_acc:.4f}')
        if val_acc > best_acc:
            best_acc = val_acc
            torch.save(model.state_dict(), MODEL_ROOT / f'{dataset_name}_best.pth')
    with open(OUTPUT_ROOT / f'{dataset_name}_metrics.json', 'w') as f:
        json.dump({'best_val_acc': best_acc}, f, indent=2)


def main():
    ensure_dirs()
    print('Device:', DEVICE)
    train_fertilizer_prediction()
    train_crop_recommendation()
    train_yield_soil_weather()
    train_yield_prediction()
    train_image_model('riceleaf', epochs=4, batch_size=16, image_size=128)
    train_image_model('plantdisease', epochs=2, batch_size=16, image_size=128)


if __name__ == '__main__':
    main()
