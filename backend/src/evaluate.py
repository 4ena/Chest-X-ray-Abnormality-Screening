import torch

def evaluate(model, dataloader, criterion, device, threshold=0.5):
    model.eval()
    running_loss = 0.0
    total_correct = 0
    total_labels = 0

    with torch.no_grad():
        for images, labels in dataloader:
            images = images.to(device)
            labels = labels.to(device).float()

            outputs = model(images)
            loss = criterion(outputs, labels)

            running_loss += loss.item() * images.size(0)
            
            probs = torch.sigmoid(outputs)
            preds = (probs >= threshold).float()

            total_correct += (preds == labels).sum().item()
            total_labels += labels.numel()

    epoch_loss = running_loss / len(dataloader.dataset)
    epoch_acc = total_correct / total_labels

    return epoch_loss, epoch_acc