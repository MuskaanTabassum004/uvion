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

def create_advanced_yield_model():
    print("Loading Base Crop Recommendation Data...")
    
    # Use absolute path to the dataset
    data_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'fertilizer', 'Crop_recommendation.csv')
    df = pd.read_csv(data_path)
    
    # We will generate a synthetic yield column based on realistic base yields for these crops
    # Base yields in hg/ha (hectograms per hectare). 1 t/ha = 10,000 hg/ha
    base_yields = {
        'rice': 45000,      # 4.5 t/ha
        'maize': 60000,     # 6.0 t/ha
        'grapes': 150000,   # 15 t/ha
        'tomato': 250000,   # 25 t/ha
        'potato': 200000,   # 20 t/ha
        'apple': 180000,
        'orange': 160000,
        'papaya': 300000,
        'coconut': 80000,
        'cotton': 25000,
        'jute': 25000,
        'coffee': 15000,
        'watermelon': 280000,
        'muskmelon': 260000,
        'mango': 120000,
        'banana': 350000,
        'pomegranate': 140000,
        'lentil': 12000,
        'blackgram': 10000,
        'mungbean': 11000,
        'mothbeans': 9000,
        'pigeonpeas': 13000,
        'kidneybeans': 12000,
        'chickpea': 14000
    }
    
    # Create the synthetic yield target
    # Yield is influenced by how close the parameters are to the 'ideal' 
    # But since the dataset itself is "ideal" conditions for the label, we can add random realistic variance
    
    def generate_yield(row):
        crop = row['label'].lower()
        base = base_yields.get(crop, 30000) # Default 3 t/ha
        
        # Add random noise (+/- 15%) to simulate realistic variance across farms
        noise = np.random.uniform(0.85, 1.15)
        
        # We can also add some small correlation: e.g. higher organic N might slightly boost within noise range
        # but pure random noise around the mean is enough for the baseline model to learn the crop means and slightly adapt.
        
        return base * noise

    df['yield_hg_ha'] = df.apply(generate_yield, axis=1)
    
    # Features and Target
    X = df[['label', 'N', 'P', 'K', 'temperature', 'humidity', 'rainfall', 'ph']]
    y = df['yield_hg_ha']
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Pipeline with OneHotEncoding for Categorical Data
    categorical_features = ['label']
    numerical_features = ['N', 'P', 'K', 'temperature', 'humidity', 'rainfall', 'ph']
    
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', 'passthrough', numerical_features),
            ('cat', OneHotEncoder(handle_unknown='ignore'), categorical_features)
        ])
    
    pipeline = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('regressor', RandomForestRegressor(n_estimators=100, max_depth=15, random_state=42))
    ])
    
    print("Training Advanced Random Forest Yield Model...")
    pipeline.fit(X_train, y_train)
    
    print("Yield Model Trained. Evaluating...")
    y_pred = pipeline.predict(X_test)
    r2 = r2_score(y_test, y_pred)
    print(f"Yield R2 Score: {r2:.4f}")
    
    # Save the model
    models_dir = os.path.join(os.path.dirname(__file__), '..', 'models')
    os.makedirs(models_dir, exist_ok=True)
    model_path = os.path.join(models_dir, 'yield_model_advanced.pkl')
    joblib.dump(pipeline, model_path)
    print(f"Model saved successfully to {model_path}")

if __name__ == "__main__":
    create_advanced_yield_model()
