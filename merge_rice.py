import os
import shutil
import random

source_base = r"C:\Users\muska\.gemini\antigravity\scratch\uvion\data\riceleaf disease\rice_leaf_diseases"
target_base = r"C:\Users\muska\.gemini\antigravity\scratch\uvion\data\plantdisease\New Plant Diseases Dataset(Augmented)\New Plant Diseases Dataset(Augmented)"

train_target = os.path.join(target_base, "train")
valid_target = os.path.join(target_base, "valid")

# 80% train, 20% valid
split_ratio = 0.8

print("Merging Rice Leaf Disease dataset into PlantVillage...")

# Check if target exists
if not os.path.exists(train_target):
    print("Cannot find PlantVillage train directory.")
    exit(1)

disease_folders = [f for f in os.listdir(source_base) if os.path.isdir(os.path.join(source_base, f))]

for folder in disease_folders:
    src_folder_path = os.path.join(source_base, folder)
    images = [img for img in os.listdir(src_folder_path) if img.endswith(('.jpg', '.png', '.JPG', '.PNG'))]
    
    # Shuffle images
    random.seed(42)
    random.shuffle(images)
    
    split_index = int(len(images) * split_ratio)
    train_images = images[:split_index]
    valid_images = images[split_index:]
    
    # Format the name like "Rice___Bacterial_leaf_blight"
    formatted_name = f"Rice___{folder.replace(' ', '_')}"
    
    # Create target directories
    os.makedirs(os.path.join(train_target, formatted_name), exist_ok=True)
    os.makedirs(os.path.join(valid_target, formatted_name), exist_ok=True)
    
    # Copy files
    for img in train_images:
        shutil.copy2(os.path.join(src_folder_path, img), os.path.join(train_target, formatted_name, img))
        
    for img in valid_images:
        shutil.copy2(os.path.join(src_folder_path, img), os.path.join(valid_target, formatted_name, img))
        
    print(f"Copied {len(train_images)} train and {len(valid_images)} valid images for {formatted_name}.")

print("Merge complete!")
