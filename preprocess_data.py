import pandas as pd
import os

processed_dir = 'C:/Users/muska/.gemini/antigravity/scratch/uvion/data/processed'
os.makedirs(processed_dir, exist_ok=True)

# Standardization mapping
crop_map = {
    'apple': 'apple',
    'rice': 'rice',
    'rice, paddy': 'rice',
    'maize': 'maize',
    'potato': 'potato',
    'potatoes': 'potato',
    'sweet potato': 'potato',
    'sweet potatoes': 'potato',
    'tomato': 'tomato'
}

def clean_and_save(input_path, output_name, crop_col):
    if not os.path.exists(input_path):
        print(f"File not found: {input_path}")
        return
        
    df = pd.read_csv(input_path)
    # create a lowercase version of the column for mapping
    df['std_crop'] = df[crop_col].astype(str).str.lower().str.strip()
    
    # Map synonyms
    df['std_crop'] = df['std_crop'].map(lambda x: crop_map.get(x, None))
    
    # Filter out None (crops we don't want)
    df_filtered = df.dropna(subset=['std_crop']).copy()
    
    # Replace the original column with our standardized names (optional, or just add std_crop)
    df_filtered[crop_col] = df_filtered['std_crop']
    df_filtered.drop(columns=['std_crop'], inplace=True)
    
    out_path = os.path.join(processed_dir, output_name)
    df_filtered.to_csv(out_path, index=False)
    print(f"Saved {out_path} with {len(df_filtered)} rows. Crops: {df_filtered[crop_col].unique().tolist()}")

files = {
    'Crop_recommendation.csv': ('C:/Users/muska/.gemini/antigravity/scratch/uvion/data/fertilizer/Crop_recommendation.csv', 'label'),
    'Fertilizer_Prediction.csv': ('C:/Users/muska/.gemini/antigravity/scratch/uvion/data/Fertilizer Prediction.csv', 'Crop Type'),
    'crop_yield.csv': ('C:/Users/muska/.gemini/antigravity/scratch/uvion/data/yeild+soil+weather/crop_yield.csv', 'crop'),
    'yield_df.csv': ('C:/Users/muska/.gemini/antigravity/scratch/uvion/data/yeildprediction/yield_df.csv', 'Item')
}

for out_name, (in_path, col) in files.items():
    clean_and_save(in_path, out_name, col)
