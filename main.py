import os
import torch
import torch.nn as nn
import torch.optim as optim

from config import DEVICE, NUM_EPOCHS, LEARNING_RATE, MODEL_DIR
from src.model import get_model
from src.train import train_one_epoch
from src.evaluate import evaluate
from src.dataset import get_dataloaders

def main():
    train_loader, val_loader = get_dataloaders()

    model = get_model().to(DEVICE)
    criterion = nn.BCEWithLogitsLoss()
    optimizer = optim.Adam(model.parameters(), lr=LEARNING_RATE)

    os.makedirs(MODEL_DIR, exist_ok=True)
    best_val_auc = -1.0

    for epoch in range(NUM_EPOCHS):
        train_loss = train_one_epoch(model, train_loader, criterion, optimizer, DEVICE)
        val_loss, val_auc = evaluate(model, val_loader, criterion, DEVICE)

        print(f"Epoch {epoch + 1}/{NUM_EPOCHS}")
        print(f"Train Loss: {train_loss:.4f}")
        print(f"Val Loss: {val_loss:.4f} | Val AUC: {val_auc:.4f}")

        checkpoint_path = os.path.join(MODEL_DIR, f"model_epoch_{epoch + 1}.pth")
        torch.save(model.state_dict(), checkpoint_path)

        if val_auc > best_val_auc:
            best_val_auc = val_auc
            best_model_path = os.path.join(MODEL_DIR, "best_model.pth")
            torch.save(model.state_dict(), best_model_path)
            print(f"Saved checkpoint to {checkpoint_path}")
            print(f"New best model saved with AUC: {best_val_auc:.4f}")

if __name__ == "__main__":
    main()