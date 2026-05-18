import pandas as pd
import os
import joblib
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score

print("Loading Processed Crop Recommendation Data...")
df = pd.read_csv('C:/Users/muska/.gemini/antigravity/scratch/uvion/data/processed/Crop_recommendation.csv')

# Features: N, P, K, temperature, humidity, ph, rainfall
# Target: label (Crop Name)
X = df.drop(columns=['label'])
y = df['label']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

classifier = RandomForestClassifier(n_estimators=100, random_state=42)
classifier.fit(X_train, y_train)

y_pred = classifier.predict(X_test)
acc = accuracy_score(y_test, y_pred)
print(f"Crop Recommendation Accuracy: {acc*100:.2f}%")

models_dir = 'C:/Users/muska/.gemini/antigravity/scratch/uvion/models'
os.makedirs(models_dir, exist_ok=True)
model_path = os.path.join(models_dir, 'crop_rec_model.pkl')
joblib.dump(classifier, model_path)
print(f"Model saved successfully to {model_path}")
