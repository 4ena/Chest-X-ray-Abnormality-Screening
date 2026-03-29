#nn model
import torch
import torch.nn as nn
from torchvision.models import mobilenet_v3_small, MobileNet_V3_Small_Weights
from torchvision.transforms import v2

from config import NUM_CLASSES

def get_model():
    weights = MobileNet_V3_Small_Weights.DEFAULT
    model = mobilenet_v3_small(weights=weights)

    in_features = model.classifier[3].in_features
    model.classifier[3] = nn.Linear(in_features, NUM_CLASSES)

    return model


def augment_function(img, sizeimg, flipfactor, noisemean, noisesigma, mean=[], std=[]):
    """Data augmentation pipeline from baseline branch."""
    transforms = v2.Compose([
        v2.ToImage(),
        v2.RandomResizedCrop(size=(sizeimg, sizeimg), antialias=True),
        v2.RandomHorizontalFlip(flipfactor),
        v2.ToDtype(torch.float32, scale=True),
        v2.GaussianNoise(noisemean, noisesigma, clip=False),
        v2.Normalize(mean, std),
    ])
    return transforms(img)