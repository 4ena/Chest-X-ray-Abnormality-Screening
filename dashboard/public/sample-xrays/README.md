# Sample X-ray Images

Real clinical chest X-ray images used for dashboard demo and development.

## Current Images (Wikimedia Commons — Public Domain)

Downloaded via direct `curl` from Wikimedia Commons upload servers. No authentication required.

| File | Condition | Source URL |
|------|-----------|-----------|
| `xray_normal.jpg` | Normal (no findings) | `commons.wikimedia.org/wiki/File:Normal_posteroanterior_(PA)_chest_radiograph_(X-ray).jpg` |
| `xray_cardiomegaly_01.png` | Cardiomegaly | `commons.wikimedia.org/wiki/File:Cardiomegally.PNG` |
| `xray_cardiomegaly_02.jpg` | Cardiomegaly | `commons.wikimedia.org/wiki/File:Cardiomegalia.JPG` |
| `xray_effusion_01.jpg` | Pleural Effusion | `commons.wikimedia.org/wiki/File:Pleural_effusion.jpg` |
| `xray_effusion_bilateral.jpg` | Bilateral Pleural Effusion | `commons.wikimedia.org/wiki/File:Bilateral_Pleural_Effusion.jpg` |
| `xray_effusion_left.jpg` | Left Pleural Effusion | `commons.wikimedia.org/wiki/File:Left-sided_Pleural_Effusion.jpg` |
| `xray_effusion_unilateral.jpg` | Unilateral Pleural Effusion | `commons.wikimedia.org/wiki/File:Unilateral_Pleural_Effusion.jpg` |
| `xray_atelectasis_01.jpg` | Atelectasis | `commons.wikimedia.org/wiki/File:Atelectasia.JPG` |
| `xray_consolidation_01.jpg` | Consolidation / Infiltrate | `commons.wikimedia.org/wiki/File:Medical_X-Ray_imaging_AFJ02_nevit.jpg` |
| `xray_consolidation_02.jpg` | Consolidation (Pneumonia) | `commons.wikimedia.org/wiki/File:PneumonisWedge09.JPG` |

## How These Were Retrieved

### Method: Direct curl from Wikimedia Commons

Wikimedia Commons hosts medical images under public domain / CC0 licenses. The direct download URL pattern is:

```
https://upload.wikimedia.org/wikipedia/commons/{hash}/{filename}
```

For large images, use the thumbnail URL to get a reasonable size:

```
https://upload.wikimedia.org/wikipedia/commons/thumb/{hash}/{filename}/{width}px-{filename}
```

#### Commands used:

```bash
# Direct download (works for images under ~5MB)
curl -sL "https://upload.wikimedia.org/wikipedia/commons/7/7a/Cardiomegally.PNG" -o xray_cardiomegaly_01.png

# Thumbnail download (for very large images like the 16MB normal chest X-ray)
curl -sL "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Normal_posteroanterior_%28PA%29_chest_radiograph_%28X-ray%29.jpg/600px-Normal_posteroanterior_%28PA%29_chest_radiograph_%28X-ray%29.jpg" -o xray_normal.jpg
```

#### Finding images:

1. Browse Wikimedia Commons categories:
   - https://commons.wikimedia.org/wiki/Category:X-rays_of_the_chest
   - https://commons.wikimedia.org/wiki/Category:X-rays_of_pleural_effusion
   - https://commons.wikimedia.org/wiki/Category:X-rays_of_atelectasis
   - https://commons.wikimedia.org/wiki/Category:X-rays_of_cardiomegaly
   - https://commons.wikimedia.org/wiki/Category:X-rays_of_pneumonia
   - https://commons.wikimedia.org/wiki/Category:X-rays_of_pneumothorax
2. Click an image → click "Download" or "Use this file" → copy the direct URL
3. `curl -sL "{url}" -o {filename}`

No API keys, no authentication, no rate limits.

## How to Add NIH Training Images

When the team has the NIH dataset downloaded (from Kaggle or the training pipeline), replace or supplement these with actual training images:

### Option A: From Kaggle (requires Kaggle account)

```bash
# Install Kaggle CLI
pip install kaggle

# Download the 5% sample (5,606 images, ~400MB)
kaggle datasets download -d nih-chest-xrays/sample
unzip sample.zip -d sample/

# Or the pre-resized 224x224 version (matches model input)
kaggle datasets download -d khanfashee/nih-chest-x-ray-14-224x224-resized
```

### Option B: From HuggingFace (requires datasets library)

```python
from datasets import load_dataset

ds = load_dataset("alkzar90/NIH-Chest-X-ray-dataset", split="train", streaming=True)

for i, sample in enumerate(ds):
    if i >= 10:
        break
    sample["image"].save(f"sample_{i:02d}.png")
```

Note: HuggingFace uses Git LFS for this dataset — direct `curl` downloads return "Entry not found". You must use the `datasets` library or `git lfs pull`.

### Option C: From teammate's local training data

If a teammate already has the NIH images downloaded for training:

```bash
# Copy 10 random images
ls /path/to/nih/images/ | shuf -n 10 | while read f; do
  cp "/path/to/nih/images/$f" "dashboard/public/sample-xrays/"
done
```

## How the Dashboard Uses These

The mock data in `dashboard/src/data/mock.ts` references these images via:

```typescript
const SAMPLE_XRAY_URLS = [
  "/sample-xrays/xray_normal.jpg",
  "/sample-xrays/xray_cardiomegaly_01.png",
  // ...
];
```

Each mock patient gets assigned one image from this pool. When the API backend is connected, real uploaded images would replace these.

## License

All images sourced from Wikimedia Commons under public domain or CC0 license. US medical X-rays are generally not copyrightable (no creative authorship in a diagnostic scan).
