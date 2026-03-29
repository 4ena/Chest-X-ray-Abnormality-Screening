#!/usr/bin/env python3
"""
Pneumanosis — Batch Inference CLI Tool
Standalone utility for offline chest X-ray screening.

Uses TorchXRayVision's DenseNet121 (densenet121-res224-all) which has
the highest published AUCs on the CheXpert evaluation set.

The tool will ask you:
  1. Where are your X-ray images?
  2. Which pathologies do you want in the output?
  3. Where should the results CSV be saved?

Then it runs inference and writes a CSV with binary predictions
(1 if confidence >= 50%, else 0).

Published AUCs on CheXpert (BENCHMARKS.md, 07/23/2023):
  Atelectasis: 0.91  |  Cardiomegaly: 0.91  |  Consolidation: 0.90
  Edema: 0.92        |  Effusion: 0.94      |  Lung Opacity: 0.87
  Pneumonia: 0.84    |  Pneumothorax: 0.85  |  Fracture: 0.74

Install dependencies:
  pip install torchxrayvision scikit-image torch torchvision

Usage:
  python batch_inference.py
"""

import sys
import os
import csv

# ── Dependency check ─────────────────────────────────────────────────────────
def check_deps():
    missing = []
    for pkg, import_name in [
        ("torchxrayvision", "torchxrayvision"),
        ("scikit-image",    "skimage"),
        ("torch",           "torch"),
        ("torchvision",     "torchvision"),
    ]:
        try:
            __import__(import_name)
        except ImportError:
            missing.append(pkg)
    if missing:
        print("\n  Missing dependencies. Run this first:\n")
        print(f"    pip install {' '.join(missing)}\n")
        sys.exit(1)

check_deps()

# ── Imports (only after dependency check passes) ─────────────────────────────
import torch
import torchvision.transforms as transforms
import torchxrayvision as xrv
import skimage.io
import numpy as np

# ── Constants ─────────────────────────────────────────────────────────────────
IMAGE_EXTENSIONS = (".jpg", ".jpeg", ".png", ".bmp", ".tif", ".tiff")
CONFIDENCE_THRESHOLD = 0.5

# All 18 pathologies the model can predict, in model output order
ALL_PATHOLOGIES = [
    "Atelectasis", "Consolidation", "Infiltration", "Pneumothorax",
    "Edema", "Emphysema", "Fibrosis", "Effusion", "Pneumonia",
    "Pleural_Thickening", "Cardiomegaly", "Nodule", "Mass", "Hernia",
    "Lung Lesion", "Fracture", "Lung Opacity", "Enlarged Cardiomediastinum",
]

# The 5 CheXpert competition defaults
DEFAULT_PATHOLOGIES = ["Atelectasis", "Cardiomegaly", "Consolidation", "Edema", "Effusion"]

# Nice display names for CSV headers (maps model name -> CSV column name)
DISPLAY_NAMES = {
    "Atelectasis":               "Atelectasis",
    "Consolidation":             "Consolidation",
    "Infiltration":              "Infiltration",
    "Pneumothorax":              "Pneumothorax",
    "Edema":                     "Edema",
    "Emphysema":                 "Emphysema",
    "Fibrosis":                  "Fibrosis",
    "Effusion":                  "Pleural Effusion",
    "Pneumonia":                 "Pneumonia",
    "Pleural_Thickening":        "Pleural Thickening",
    "Cardiomegaly":              "Cardiomegaly",
    "Nodule":                    "Nodule",
    "Mass":                      "Mass",
    "Hernia":                    "Hernia",
    "Lung Lesion":               "Lung Lesion",
    "Fracture":                  "Fracture",
    "Lung Opacity":              "Lung Opacity",
    "Enlarged Cardiomediastinum": "Enlarged Cardiomediastinum",
}


# ══════════════════════════════════════════════════════════════════════════════
#  STEP 1 — Ask the user for inputs
# ══════════════════════════════════════════════════════════════════════════════

def ask_image_folder():
    """Prompt user for the folder containing X-ray images."""
    print("=" * 60)
    print("  PNEUMANOSIS — Batch Inference Tool")
    print("  Model: DenseNet121 (densenet121-res224-all)")
    print("=" * 60)
    print()

    while True:
        folder = input("  Enter the path to your X-ray image folder:\n  > ").strip()

        # Remove surrounding quotes (common when pasting Windows paths)
        folder = folder.strip('"').strip("'")

        if not folder:
            print("  Please enter a path.\n")
            continue
        if not os.path.isdir(folder):
            print(f"  Folder not found: {folder}")
            print("  Please try again.\n")
            continue

        # Count images
        images = [f for f in os.listdir(folder)
                  if os.path.splitext(f)[1].lower() in IMAGE_EXTENSIONS]
        if not images:
            print(f"  No image files found in: {folder}")
            print(f"  (Looking for: {', '.join(IMAGE_EXTENSIONS)})\n")
            continue

        print(f"  Found {len(images)} image(s).\n")
        return folder, images


def ask_pathologies():
    """Let user pick which pathologies to include in the CSV output."""
    print("-" * 60)
    print("  Which pathologies do you want in the output CSV?")
    print()
    print("  Available pathologies:")
    print()
    for i, p in enumerate(ALL_PATHOLOGIES, 1):
        marker = " *" if p in DEFAULT_PATHOLOGIES else ""
        print(f"    {i:2}. {DISPLAY_NAMES[p]}{marker}")
    print()
    print("  * = CheXpert Competition 5 (default)")
    print()
    print("  Options:")
    print("    - Press ENTER to use the defaults (CheXpert 5)")
    print("    - Type numbers separated by commas (e.g. 1,5,8,11)")
    print("    - Type 'all' for all 18 pathologies")
    print()

    while True:
        choice = input("  Your selection:\n  > ").strip().lower()

        # Default
        if choice == "":
            selected = DEFAULT_PATHOLOGIES[:]
            print(f"  Using CheXpert 5 defaults.\n")
            return selected

        # All
        if choice == "all":
            selected = ALL_PATHOLOGIES[:]
            print(f"  Using all {len(selected)} pathologies.\n")
            return selected

        # Parse comma-separated numbers
        try:
            nums = [int(x.strip()) for x in choice.split(",")]
            if any(n < 1 or n > len(ALL_PATHOLOGIES) for n in nums):
                print(f"  Numbers must be between 1 and {len(ALL_PATHOLOGIES)}.\n")
                continue
            selected = [ALL_PATHOLOGIES[n - 1] for n in nums]
            names = [DISPLAY_NAMES[p] for p in selected]
            print(f"  Selected: {', '.join(names)}\n")
            return selected
        except ValueError:
            print("  Could not parse that. Use numbers separated by commas.\n")
            continue


def ask_output_path():
    """Ask where to save the output CSV."""
    print("-" * 60)
    default_path = os.path.join(os.getcwd(), "predictions.csv")
    print(f"  Where should the results CSV be saved?")
    print(f"  (Press ENTER for: {default_path})")
    print()

    while True:
        out = input("  > ").strip()
        out = out.strip('"').strip("'")

        if out == "":
            out = default_path

        # Make sure the directory exists
        out_dir = os.path.dirname(out)
        if out_dir and not os.path.isdir(out_dir):
            print(f"  Directory does not exist: {out_dir}")
            print("  Please try again.\n")
            continue

        # Make sure it ends with .csv
        if not out.lower().endswith(".csv"):
            out += ".csv"

        print(f"  Output: {out}\n")
        return out


# ══════════════════════════════════════════════════════════════════════════════
#  STEP 2 — Model loading and inference
# ══════════════════════════════════════════════════════════════════════════════

def load_model():
    """Load the pretrained DenseNet121-all model."""
    print("-" * 60)
    print("  Loading model (downloads weights on first run)...")
    model = xrv.models.DenseNet(weights="densenet121-res224-all")
    model.eval()
    if torch.cuda.is_available():
        model = model.cuda()
        print("  Running on GPU")
    else:
        print("  Running on CPU")
    print()
    return model


def preprocess(image_path):
    """Load and preprocess a single X-ray image."""
    img = skimage.io.imread(image_path)

    # RGBA or RGB -> grayscale
    if len(img.shape) == 3:
        img = img.mean(axis=2)

    # Normalize to [-1024, 1024]
    img = xrv.datasets.normalize(img, 255)

    # (H, W) -> (1, H, W)
    img = img[None, ...]

    transform = transforms.Compose([
        xrv.datasets.XRayCenterCrop(),
        xrv.datasets.XRayResizer(224),
    ])
    img = transform(img)
    img = torch.from_numpy(img).unsqueeze(0)  # (1, 1, H, W)
    return img


def run_inference(model, img_tensor):
    """Run model on a preprocessed image tensor."""
    if torch.cuda.is_available():
        img_tensor = img_tensor.cuda()
    with torch.no_grad():
        outputs = model(img_tensor)
    return outputs[0].cpu().numpy()


# ══════════════════════════════════════════════════════════════════════════════
#  STEP 3 — Process all images and write CSV
# ══════════════════════════════════════════════════════════════════════════════

def process_folder(model, image_folder, image_files, selected_pathologies, output_path):
    """Run inference on every image and write results to CSV."""
    # Build index mapping: model pathology name -> position in model output
    path_to_idx = {p: i for i, p in enumerate(model.pathologies)}

    folder_name = os.path.basename(image_folder)
    csv_columns = [DISPLAY_NAMES[p] for p in selected_pathologies]
    header = ["Path"] + csv_columns

    rows = []
    total = len(image_files)

    print("-" * 60)
    print(f"  Processing {total} image(s)...\n")

    for i, filename in enumerate(sorted(image_files), 1):
        img_path = os.path.join(image_folder, filename)
        print(f"  [{i}/{total}] {filename} ... ", end="", flush=True)

        try:
            img_tensor  = preprocess(img_path)
            predictions = run_inference(model, img_tensor)

            # Extract selected pathologies
            row = {"Path": f"{folder_name}\\{filename}"}
            for p in selected_pathologies:
                idx = path_to_idx.get(p)
                if idx is not None:
                    score = float(predictions[idx])
                    row[DISPLAY_NAMES[p]] = 1 if score >= CONFIDENCE_THRESHOLD else 0
                else:
                    row[DISPLAY_NAMES[p]] = 0
            rows.append(row)
            print("OK")

        except Exception as e:
            print(f"FAILED ({e})")

    # Write CSV
    with open(output_path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=header)
        writer.writeheader()
        writer.writerows(rows)

    # Summary
    print()
    print("=" * 60)
    print(f"  DONE!")
    print(f"  Results saved to: {output_path}")
    print(f"  Images processed: {len(rows)}/{total}")
    print(f"  Pathologies:      {', '.join(csv_columns)}")
    print(f"  Threshold:        {CONFIDENCE_THRESHOLD * 100:.0f}% confidence")
    print(f"  Model:            densenet121-res224-all")
    print("=" * 60)
    print()

    # Preview
    print("  CSV Preview:")
    print(f"  {', '.join(header)}")
    for row in rows:
        print(f"  {', '.join(str(row[h]) for h in header)}")
    print()


# ══════════════════════════════════════════════════════════════════════════════
#  MAIN
# ══════════════════════════════════════════════════════════════════════════════

def main():
    # Ask the user everything up front
    image_folder, image_files = ask_image_folder()
    selected_pathologies      = ask_pathologies()
    output_path               = ask_output_path()

    # Confirm before running
    print("=" * 60)
    print("  Ready to run inference!")
    print(f"  Images:      {len(image_files)} file(s) in {image_folder}")
    print(f"  Pathologies:  {len(selected_pathologies)}")
    print(f"  Output:       {output_path}")
    print("=" * 60)
    confirm = input("  Press ENTER to start (or 'q' to quit): ").strip().lower()
    if confirm == "q":
        print("  Cancelled.\n")
        sys.exit(0)
    print()

    # Load model and go
    model = load_model()
    process_folder(model, image_folder, image_files, selected_pathologies, output_path)


if __name__ == "__main__":
    main()
