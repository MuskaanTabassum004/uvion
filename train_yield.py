import pandas as pd
import numpy as np
import os
import joblib
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import mean_squared_error, r2_score

print("Loading Yield Data...")
df = pd.read_csv('C:/Users/muska/.gemini/antigravity/scratch/uvion/data/processed/yield_df.csv')

# Features and target
# Item is the Crop, Area is Region.
X = df[['Area', 'Item', 'average_rain_fall_mm_per_year', 'pesticides_tonnes', 'avg_temp']]
y = df['hg/ha_yield']

# Split data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Pipeline with OneHotEncoding for Categorical Data
categorical_features = ['Area', 'Item']
numerical_features = ['average_rain_fall_mm_per_year', 'pesticides_tonnes', 'avg_temp']

preprocessor = ColumnTransformer(
    transformers=[
        ('num', 'passthrough', numerical_features),
        ('cat', OneHotEncoder(handle_unknown='ignore'), categorical_features)
    ])

pipeline = Pipeline(steps=[
    ('preprocessor', preprocessor),
    ('regressor', RandomForestRegressor(n_estimators=100, random_state=42))
])

print("Training Random Forest Yield Model... (This might take a moment)")
pipeline.fit(X_train, y_train)

print("Yield Model Trained. Evaluating...")
y_pred = pipeline.predict(X_test)
r2 = r2_score(y_test, y_pred)
print(f"Yield R2 Score: {r2:.4f}")

# Save the model
models_dir = 'C:/Users/muska/.gemini/antigravity/scratch/uvion/models'
os.makedirs(models_dir, exist_ok=True)
model_path = os.path.join(models_dir, 'yield_model.pkl')
joblib.dump(pipeline, model_path)
print(f"Model saved successfully to {model_path}")
