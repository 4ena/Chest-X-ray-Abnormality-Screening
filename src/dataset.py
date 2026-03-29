

import pandas as pd

import kagglehub


from PIL import Image

import os

import torch
from torch.utils.data import Dataset, DataLoader
import torchvision.transforms as T

from config import BATCH_SIZE, IMAGE_SIZE, CLASS_NAMES


path = kagglehub.dataset_download("ashery/chexpert")


TARGET_COLUMNS = CLASS_NAMES
  

#you can change these

train_tf = T.Compose([
    T.Resize((IMAGE_SIZE, IMAGE_SIZE)),
    T.RandomRotation(3),
    T.ColorJitter(brightness=0.03, contrast=0.03),
    T.ToTensor(),

    T.Normalize([0.485, 0.456, 0.406],
                [0.229, 0.224, 0.225]),
])

  

valid_tf = T.Compose([

    T.Resize((IMAGE_SIZE, IMAGE_SIZE)),

    T.ToTensor(),

    T.Normalize([0.485, 0.456, 0.406],

                [0.229, 0.224, 0.225]),

])

class CheXpertDataset(Dataset):
    def __init__(self, dataframe, root_dir, transform=None):
        self.data_paths = dataframe.reset_index(drop=True)
        self.transform = transform
        self.root_dir = root_dir

    def __len__(self):
        return len(self.data_paths)

    def __getitem__(self, idx):
        row = self.data_paths.iloc[idx]

        rel_path = row["Path"].replace("CheXpert-v1.0-small/", "")
        #If the path starts with synthetic/, look in the repo's data/ folder instead of the CheXpert download folder.
        if rel_path.startswith("synthetic/"):
            image_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", rel_path)
        else:
            image_path = os.path.join(self.root_dir, rel_path)

        image = Image.open(image_path).convert("RGB")

        if self.transform:
            image = self.transform(image)

        label = torch.tensor(
            [float(row[col]) for col in TARGET_COLUMNS],
            dtype=torch.float32
        )

        return image, label

def get_dataloaders():
    train_csv = os.path.join(path, "train.csv")
    valid_csv = os.path.join(path, "valid.csv")

    train_df = pd.read_csv(train_csv)
    valid_df = pd.read_csv(valid_csv)
  

    needed_cols = ["Path"] + TARGET_COLUMNS
    train_df = train_df[needed_cols].copy()
    valid_df = valid_df[needed_cols].copy()
    #Add synthetic data from csv to dataset
    synthetic_csv = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "synthetic", "synthetic_labels.csv")
    if os.path.exists(synthetic_csv):
        synth_df = pd.read_csv(synthetic_csv)
        train_df = pd.concat([train_df, synth_df], ignore_index=True)
        print(f"Added {len(synth_df)} synthetic images")

    synthetic_csv = os.path.join(
        os.path.dirname(os.path.dirname(__file__)),
        "data",
        "synthetic",
        "synthetic_labels.csv"
    )

    if os.path.exists(synthetic_csv):
        synth_df = pd.read_csv(synthetic_csv)
        synth_df = synth_df[needed_cols].copy()
        train_df = pd.concat([train_df, synth_df], ignore_index=True)
        print(f"Added {len(synth_df)} synthetic images")

    for col in TARGET_COLUMNS:
        train_df[col] = train_df[col].fillna(0).replace(-1, 0)
        valid_df[col] = valid_df[col].fillna(0).replace(-1, 0)

    train_dataset = CheXpertDataset(train_df, path, transform=train_tf)
    valid_dataset = CheXpertDataset(valid_df, path, transform=valid_tf)

    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True)
    val_loader = DataLoader(valid_dataset, batch_size=BATCH_SIZE, shuffle=False)

    return train_loader, val_loader
