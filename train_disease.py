import os
import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, models, transforms
from torch.utils.data import DataLoader

print("Setting up PyTorch Plant Disease Training script...")

# 1. Setup Directories
data_dir = r"e:\mushu projects\uvion\data\plantdisease\New Plant Diseases Dataset(Augmented)\New Plant Diseases Dataset(Augmented)"
train_dir = os.path.join(data_dir, 'train')
valid_dir = os.path.join(data_dir, 'valid')

# Check if dataset exists
if not os.path.exists(train_dir):
    raise FileNotFoundError(f"Dataset not found at {train_dir}. Please ensure the images are extracted.")

# 2. Setup Device (MPS/CUDA/CPU)
device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
print(f"Training on device: {device}")

# 3. Data Augmentation and Normalization for Transfer Learning
# We resize to 224x224 as required by ResNet18
data_transforms = {
    'train': transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.RandomHorizontalFlip(),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ]),
    'valid': transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ]),
}

# 4. Load Dataset
image_datasets = {
    'train': datasets.ImageFolder(train_dir, data_transforms['train']),
    'valid': datasets.ImageFolder(valid_dir, data_transforms['valid'])
}

# Use small batch size to avoid memory errors on CPU
dataloaders = {
    'train': DataLoader(image_datasets['train'], batch_size=32, shuffle=True, num_workers=0),
    'valid': DataLoader(image_datasets['valid'], batch_size=32, shuffle=False, num_workers=0)
}

dataset_sizes = {x: len(image_datasets[x]) for x in ['train', 'valid']}
class_names = image_datasets['train'].classes
num_classes = len(class_names)

print(f"Found {num_classes} classes across {dataset_sizes['train']} training images.")

# 5. Build Model (Transfer Learning with ResNet18)
# We use ResNet18 because it's fast and highly accurate for MVP
model = models.resnet18(pretrained=True)

# Freeze lower layers to speed up training dramatically
for param in model.parameters():
    param.requires_grad = False

# Replace the last classification layer to match our number of disease classes
num_ftrs = model.fc.in_features
model.fc = nn.Linear(num_ftrs, num_classes)
model = model.to(device)

criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.fc.parameters(), lr=0.001)

# 6. Training Loop (Just 1 Epoch for MVP testing)
num_epochs = 1  # For a production model, you would set this to 5 or 10.
print(f"Starting Training for {num_epochs} Epoch(s)...")

for epoch in range(num_epochs):
    print(f'Epoch {epoch}/{num_epochs - 1}')
    print('-' * 10)

    for phase in ['train', 'valid']:
        if phase == 'train':
            model.train() 
        else:
            model.eval()   

        running_loss = 0.0
        running_corrects = 0

        # Iterate over data.
        for inputs, labels in dataloaders[phase]:
            inputs = inputs.to(device)
            labels = labels.to(device)

            optimizer.zero_grad()

            with torch.set_grad_enabled(phase == 'train'):
                outputs = model(inputs)
                _, preds = torch.max(outputs, 1)
                loss = criterion(outputs, labels)

                if phase == 'train':
                    loss.backward()
                    optimizer.step()

            # statistics
            running_loss += loss.item() * inputs.size(0)
            running_corrects += torch.sum(preds == labels.data)

        epoch_loss = running_loss / dataset_sizes[phase]
        epoch_acc = running_corrects.double() / dataset_sizes[phase]

        print(f'{phase} Loss: {epoch_loss:.4f} Acc: {epoch_acc:.4f}')

# 7. Save Model
models_dir = r'e:\mushu projects\uvion\models'
os.makedirs(models_dir, exist_ok=True)
model_path = os.path.join(models_dir, 'disease_model.pth')
torch.save(model.state_dict(), model_path)

print(f"Model saved successfully to {model_path}")
# Save class names for API prediction later
import json
with open(os.path.join(models_dir, 'class_names.json'), 'w') as f:
    json.dump(class_names, f)
print("Class names saved.")
