import os
import pandas as pd
import numpy as np
import tensorflow as tf
import pickle
import io
from PIL import Image

class HealthService:
    def __init__(self):
        self.models_dir = os.path.join(os.path.dirname(__file__), '..', 'models', 'plant_disease_model (1)')
        self.model_path = os.path.join(self.models_dir, 'plant_disease_classifier.h5')
        self.classes_path = os.path.join(self.models_dir, 'class_names.pkl')
        
        # Load Model
        try:
            self.model = tf.keras.models.load_model(self.model_path)
            with open(self.classes_path, 'rb') as f:
                self.class_names = pickle.load(f)
            print(f"[OK] Disease model loaded successfully")
        except Exception as e:
            print(f"[ERROR] Disease model failed to load: {e}")
            self.model = None
            self.class_names = []
            
        # Load Datasets
        try:
            base_dir = os.path.join(os.path.dirname(__file__), '..')
            self.ai_dataset = pd.read_csv(os.path.join(base_dir, 'UVION_FINAL_AI_DATASET.csv'))
            self.full_dataset = pd.read_csv(os.path.join(base_dir, 'uvion_full_disease_dataset.csv'))
            print(f"[OK] Datasets loaded successfully")
        except Exception as e:
            print(f"[ERROR] Datasets failed to load: {e}")
            self.ai_dataset = pd.DataFrame()
            self.full_dataset = pd.DataFrame()


        
    def _parse_label(self, label):
        """
        Parses model labels like 'Corn_(maize)___Common_rust_' 
        into (Crop, DiseaseName)
        """
        if '___' not in label:
            return "Unknown", label
        
        parts = label.split('___')
        crop = parts[0].replace('_', ' ').replace('(', '').replace(')', '').strip()
        disease = parts[1].replace('_', ' ').strip()
        
        # Handle specific mappings
        if 'maize' in crop.lower(): crop = "Corn (Maize)"
        if disease.endswith('.'): disease = disease[:-1]
        
        return crop, disease

    def predict(self, image_bytes, crop_stage="Vegetative"):
        if self.model is None:
            return [{
                "disease": "System Calibration Required",
                "crop": "Generic",
                "confidence": 0.0,
                "symptoms": "AI model is currently offline.",
                "causes": "Initialization error.",
                "management": "Contact support.",
                "treatment_plan": ["Check model files"],
                "fertilizers": [],
                "affected_area": "System",
                "severity": "None",
                "ai_reasoning": "Model failed to load at startup.",
                "weather_treatment": "N/A"
            }]

        # Preprocess
        img = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        img = img.resize((128, 128))
        img_array = np.array(img) / 255.0
        img_array = np.expand_dims(img_array, axis=0)
        
        # Inference
        preds = self.model.predict(img_array, verbose=0)[0]
        
        # Get all predictions and parse them first
        all_results = []
        for i, conf in enumerate(preds):
            label = self.class_names[i]
            crop, disease = self._parse_label(label)
            all_results.append({
                "index": i,
                "confidence": float(conf),
                "crop": crop,
                "disease": disease,
                "label": label
            })

        # Filter for only supported crops (The 5 requested)
        supported_crops = ["Corn (Maize)", "Grape", "Potato", "Rice", "Tomato"]
        filtered_results = [r for r in all_results if r["crop"] in supported_crops]
        
        # Sort by confidence and take top 3
        filtered_results = sorted(filtered_results, key=lambda x: x["confidence"], reverse=True)[:3]
        
        results = []
        if not filtered_results:
            # Fallback if no supported crops are in the top predictions
            return [{
                "disease": "Unsupported Variety",
                "crop": "Unrecognized",
                "confidence": 0.0,
                "symptoms": "This variety is not currently in the UVION neural archives.",
                "causes": "Unsupported crop type detected.",
                "management": "Please scan one of the supported crops: Corn, Grape, Potato, Rice, or Tomato.",
                "treatment_plan": ["Switch to a supported crop"],
                "fertilizers": [],
                "affected_area": "N/A",
                "severity": "N/A",
                "ai_reasoning": "Model detected a crop outside of the authorized 5-crop list.",
                "weather_treatment": "N/A"
            }]

        for res in filtered_results:
            crop = res["crop"]
            disease = res["disease"]
            conf = res["confidence"]
            
            # ROBUST MATCHING LOGIC
            search_crop = crop.lower().split(' ')[0] 
            search_disease = disease.lower().replace('disease', '').strip()
            
            print(f"[DEBUG] Searching for: Crop='{search_crop}', Disease='{search_disease}'")

            # 1. Search in Full Dataset
            full_match = self.full_dataset[
                (self.full_dataset['Crop'].str.lower().str.strip().str.contains(search_crop, na=False)) & 
                (self.full_dataset['Disease Name'].apply(lambda d: any(word in search_disease for word in str(d).lower().split()) or any(word in str(d).lower() for word in search_disease.split())))
            ]
            print(f"[DEBUG] Full Dataset Match: Found {len(full_match)} rows")
            
            # 2. Search in AI Dataset
            ai_match = self.ai_dataset[
                (self.ai_dataset['Crop'].str.lower().str.strip().str.contains(search_crop, na=False)) & 
                (self.ai_dataset['Disease Name'].apply(lambda d: any(word in search_disease for word in str(d).lower().split()) or any(word in str(d).lower() for word in search_disease.split())))
            ]
            print(f"[DEBUG] AI Dataset Match: Found {len(ai_match)} rows")



            
            # Special case for "Healthy"
            if "healthy" in search_disease:
                full_match = self.full_dataset[self.full_dataset['Disease Name'].str.lower().str.contains("healthy", na=False)]
                ai_match = self.ai_dataset[self.ai_dataset['Disease Name'].str.lower().str.contains("healthy", na=False)]

            
            # Pathogen Wiki Fallback (Ensures proper data if CSV matching fails)
            pathogen_wiki = {
                "Common rust": {
                    "symptoms": "Small, cinnamon-brown, powdery pustules on both upper and lower leaf surfaces. Leaves may yellow and dry out.",
                    "causes": "Fungus Puccinia sorghi, favored by cool, moist weather (16-23°C) and high humidity.",
                    "treatment_plan": ["Apply fungicides containing chlorothalonil or mancozeb.", "Plant resistant hybrids.", "Remove infected crop debris after harvest."],
                    "fertilizers": ["Potassium-rich fertilizer", "Seaweed extract"]
                },
                "Early blight": {
                    "symptoms": "Target-like dark spots with concentric rings on older leaves. Lower leaves may drop prematurely.",
                    "causes": "Fungus Alternaria solani, thrives in warm, humid conditions with frequent rainfall.",
                    "treatment_plan": ["Use copper-based fungicides.", "Increase plant spacing for better airflow.", "Avoid overhead irrigation."],
                    "fertilizers": ["Calcium nitrate", "Balanced NPK 10-10-10"]
                },
                "Late blight": {
                    "symptoms": "Dark, water-soaked patches on leaves that quickly turn brown and papery. White fungal growth may appear under leaves.",
                    "causes": "Oomycete Phytophthora infestans, extremely aggressive in cool, wet weather.",
                    "treatment_plan": ["Immediate application of systemic fungicides.", "Destroy infected plants immediately.", "Ensure strict field sanitation."],
                    "fertilizers": ["Phosphorus boost", "Organic mulch"]
                },
                "Healthy": {
                    "symptoms": "Vibrant green foliage, no visible lesions or discolorations. Strong stem structure.",
                    "causes": "Optimal nutrition, proper irrigation, and effective preventive management.",
                    "treatment_plan": ["Continue routine monitoring.", "Maintain balanced fertilization.", "Ensure proper hydration."],
                    "fertilizers": ["Organic compost", "Standard NPK"]
                }
            }

            # Start with robust defaults from wiki or generic
            wiki_entry = pathogen_wiki.get(disease, {})
            info = {
                "disease": disease,
                "crop": crop,
                "confidence": conf,
                "symptoms": wiki_entry.get("symptoms", "Detailed symptoms analysis pending neural verification."),
                "causes": wiki_entry.get("causes", "Pathogen activity triggered by environmental stress factors."),
                "management": "General integrated pest management recommended.",
                "treatment_plan": wiki_entry.get("treatment_plan", ["Monitor crop closely for 48 hours.", "Ensure proper ventilation.", "Avoid excessive leaf wetness."]),
                "fertilizers": wiki_entry.get("fertilizers", []),
                "affected_area": "Leaves",
                "severity": "Moderate",
                "ai_reasoning": "Detected based on visual patterns consistent with known pathogen signatures.",
                "weather_treatment": "Monitor humidity levels and ensure proper soil drainage."
            }


            
            if not full_match.empty:
                row = full_match.iloc[0]
                info["symptoms"] = row.get("Symptoms", info["symptoms"])
                info["causes"] = row.get("Causes", info["causes"])
                info["management"] = row.get("Management", info["management"])
                info["affected_area"] = row.get("Affected Area", info["affected_area"])
                info["severity"] = row.get("Severity", info["severity"])
                
                # Treatment Plan (Up to 3 steps)
                tp = str(row.get("Treatment Plan", ""))
                if tp:
                    steps = [s.strip() for s in tp.split('\n') if s.strip()][:3]
                    info["treatment_plan"] = steps
                
                # Fertilizers (Disease-specific)
                ferts = str(row.get("Recommended Fertilizers", ""))
                if ferts:
                    info["fertilizers"] = [f.strip() for f in ferts.split(';') if f.strip()]

            if not ai_match.empty:
                ai_row = ai_match.iloc[0]
                info["ai_reasoning"] = ai_row.get("AI Reasoning", info["ai_reasoning"])
                
                # Stage-based treatment (Parse the Stage Impact column)
                # Example format: Seedling: Low; Vegetative: Moderate...
                stage_impact = str(ai_row.get("Stage Impact", ""))
                info["stage_impact"] = stage_impact
                
                # Weather-based Treatment
                info["weather_treatment"] = ai_row.get("Treatment Plan (Weather-Based)", "")
                
                # Add Stage-based Fertilizer if available
                sf = str(ai_row.get("Stage-Based Fertilizer", ""))
                if sf:
                    # Parse: Vegetative: Vermicompost; Flowering: Bone meal...
                    stages = {s.split(':')[0].strip(): s.split(':')[1].strip() for s in sf.split(';') if ':' in s}
                    if crop_stage in stages:
                        info["stage_fertilizer"] = stages[crop_stage]

            results.append(info)
            
        return results

    def get_stage_info(self, crop, stage):
        """Fetches stage-based fertilizer from AI dataset."""
        # Normalize crop name
        if 'maize' in crop.lower() or 'corn' in crop.lower(): crop = "Corn (Maize)"
        
        match = self.ai_dataset[self.ai_dataset['Crop'].str.contains(crop, case=False, na=False)]
        if not match.empty:
            sf = str(match.iloc[0].get("Stage-Based Fertilizer", ""))
            if sf:
                stages = {s.split(':')[0].strip(): s.split(':')[1].strip() for s in sf.split(';') if ':' in s}
                return stages.get(stage, "General NPK")
        return "General NPK"

