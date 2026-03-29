import torch
from sklearn.metrics import roc_auc_score

def evaluate(model, dataloader, criterion, device):
    model.eval()
    running_loss = 0.0

    all_labels = []
    all_probs = []

    with torch.no_grad():
        for images, labels in dataloader:
            images = images.to(device)
            labels = labels.to(device).float()

            outputs = model(images)
            loss = criterion(outputs, labels)

            running_loss += loss.item() * images.size(0)

            probs = torch.sigmoid(outputs)
            all_labels.append(labels.cpu())
            all_probs.append(probs.cpu())

    epoch_loss = running_loss / len(dataloader.dataset)

    all_labels = torch.cat(all_labels).numpy()
    all_probs = torch.cat(all_probs).numpy()

    try:
        auc = roc_auc_score(all_labels, all_probs, average="macro")
    except ValueError:
        auc = float("nan")

    return epoch_loss, auc