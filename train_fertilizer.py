import pandas as pd
import numpy as np
import os
import joblib
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import accuracy_score

print("Loading Full Fertilizer Data...")
df = pd.read_csv('C:/Users/muska/.gemini/antigravity/scratch/uvion/data/Fertilizer Prediction.csv')

# Features: Temperature, Humidity, Moisture, Soil Type, Crop Type, Nitrogen, Potassium, Phosphorous
# Target: Fertilizer Name
X = df.drop(columns=['Fertilizer Name'])
y = df['Fertilizer Name']

# Clean column names (e.g. 'Humidity ' -> 'Humidity')
X.columns = X.columns.str.strip()

categorical_features = ['Soil Type', 'Crop Type']
numerical_features = ['Temparature', 'Humidity', 'Moisture', 'Nitrogen', 'Potassium', 'Phosphorous']

# Split data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

preprocessor = ColumnTransformer(
    transformers=[
        ('num', StandardScaler(), numerical_features),
        ('cat', OneHotEncoder(handle_unknown='ignore'), categorical_features)
    ])

pipeline = Pipeline(steps=[
    ('preprocessor', preprocessor),
    ('classifier', RandomForestClassifier(n_estimators=100, random_state=42))
])

print("Training Random Forest Fertilizer Model...")
pipeline.fit(X_train, y_train)

print("Fertilizer Model Trained. Evaluating...")
y_pred = pipeline.predict(X_test)
acc = accuracy_score(y_test, y_pred)
print(f"Fertilizer Accuracy: {acc*100:.2f}%")

# Save the model
models_dir = 'C:/Users/muska/.gemini/antigravity/scratch/uvion/models'
os.makedirs(models_dir, exist_ok=True)
model_path = os.path.join(models_dir, 'fertilizer_model.pkl')
joblib.dump(pipeline, model_path)
print(f"Model saved successfully to {model_path}")
