import torch
import torch.nn as nn
import torch.optim as optim

from config import DEVICE, NUM_EPOCHS, LEARNING_RATE
from src.model import get_model
from src.train import train_one_epoch
from src.evaluate import evaluate
from src.dataset import get_dataloaders
import kragglehub

def main():
    train_loader, val_loader = get_dataloaders()

    #download data
    

    #test dataloader
    image, label = next(iter(train_loader))
    print("Train batch image shape:", images.shape)
    print("Train batch label shape:", labels.shape)
    print("Sample labels:", labels[:2])

    model = get_model().to(DEVICE)
    criterion = nn.BCEWithLogitsLoss()
    optimizer = optim.Adam(model.parameters(), lr=LEARNING_RATE)

    for epoch in range(NUM_EPOCHS):
        train_loss = train_one_epoch(model, train_loader, criterion, optimizer, DEVICE)
        val_loss, val_acc = evaluate(model, val_loader, criterion, DEVICE)

        print(f"Epoch {epoch + 1}/{NUM_EPOCHS}")
        print(f"Train Loss: {train_loss:.4f}")
        print(f"Val Loss: {val_loss:.4f} | Val Acc: {val_acc:.4f}")

if __name__ == "__main__":
    main()