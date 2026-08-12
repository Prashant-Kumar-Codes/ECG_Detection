# 🫀 ECG Detection Project — Complete Guide

## 📌 Project Overview

**Goal:** Build a deep learning model to automatically classify 12-lead ECG signals into cardiac diagnostic categories using the **PTB-XL dataset**.

**Dataset:** PTB-XL v1.0.2 — 21,801 clinical 12-lead ECGs from 18,869 patients (10-second recordings)
**Source:** [PhysioNet PTB-XL](https://physionet.org/content/ptb-xl/1.0.2/)
**License:** Creative Commons Attribution 4.0

---

## 📂 Phase 0: Dataset Understanding

### What is a 12-Lead ECG?
An ECG records the heart's electrical activity. A **12-lead ECG** captures signals from 12 different angles:
- **Limb leads:** I, II, III, AVL, AVR, AVF
- **Chest leads:** V1, V2, V3, V4, V5, V6

Each lead = 1 channel of time-series data. So each ECG record is a **2D array**: `(timesteps, 12)`.

### Dataset Structure (Your Local: `ptb_ecg_dataset/`)

```
ptb_ecg_dataset/
├── ptbxl_database.csv        ← Master metadata (1 row per ECG record)
├── scp_statements.csv        ← Label definitions & diagnostic hierarchy
├── example_physionet.py      ← Official data loading example
├── records100/               ← ECG waveforms at 100 Hz (downsampled)
│   ├── 00000/
│   │   ├── 00001_lr.dat      ← Binary signal data
│   │   ├── 00001_lr.hea      ← Header (metadata for wfdb reader)
│   │   └── ...
│   ├── 01000/
│   └── ... (22 subdirectories, ~1000 records each)
└── records500/               ← ECG waveforms at 500 Hz (original)
    ├── 00000/
    │   ├── 00001_hr.dat
    │   ├── 00001_hr.hea
    │   └── ...
    └── ...
```

### File Formats Explained

| File | Format | Content |
|------|--------|---------|
| `*.dat` | Binary (WFDB) | Raw ECG signal data (16-bit) |
| `*.hea` | Text (WFDB header) | Channel names, sampling rate, calibration |
| `ptbxl_database.csv` | CSV | All metadata: patient info, labels, file paths |
| `scp_statements.csv` | CSV | 71 SCP-ECG statement definitions & categories |

### Sampling Rate Options

| Version | Folder | Shape per Record | Use Case |
|---------|--------|-------------------|----------|
| 100 Hz | `records100/` | `(1000, 12)` | Faster training, good baseline |
| 500 Hz | `records500/` | `(5000, 12)` | Higher resolution, better accuracy |

> **Recommendation:** Start with **100 Hz** for prototyping, then switch to 500 Hz for final model.

### Label System (SCP-ECG Codes)

Labels are stored as **dictionaries** in the `scp_codes` column:
```python
{'NORM': 100.0, 'SR': 0.0}  # NORM with 100% likelihood, SR with unknown likelihood
```

The 71 SCP codes are organized into **3 categories** and a **diagnostic hierarchy**:

#### Statement Categories
| Category | Description | Example Codes |
|----------|-------------|---------------|
| **Diagnostic** | Heart conditions | NORM, MI, HYP, STTC, CD |
| **Form** | Waveform morphology | LVOLT, LOWT, VCLVH |
| **Rhythm** | Heart rhythm patterns | SR, AFIB, SBRAD, STACH |

#### Diagnostic Superclass Hierarchy (5 classes — **PRIMARY TARGET**)
| Code | Superclass | Description |
|------|------------|-------------|
| NORM | Normal ECG | Healthy heart signal |
| MI | Myocardial Infarction | Heart attack indicators |
| STTC | ST/T Changes | ST segment & T wave abnormalities |
| CD | Conduction Disturbance | Electrical conduction problems |
| HYP | Hypertrophy | Enlarged heart chambers |

> ⚠️ **Multi-label problem:** A single ECG can have MULTIPLE diagnostic labels simultaneously.

### Train/Test Split (Pre-defined via `strat_fold`)

| Fold | Usage | Records |
|------|-------|---------|
| 1–8 | Training | ~17,400 |
| 9 | Validation | ~2,200 |
| 10 | Test | ~2,200 |

Folds 9 & 10 have higher label quality (human-validated).

---

## 📂 Phase 1: Environment Setup

### Required Libraries
```bash
pip install numpy pandas wfdb matplotlib seaborn scikit-learn tensorflow
# OR for PyTorch:
pip install numpy pandas wfdb matplotlib seaborn scikit-learn torch torchvision
```

### Key Libraries Explained
| Library | Purpose |
|---------|---------|
| `wfdb` | Read WFDB format ECG files (.dat/.hea) |
| `pandas` | Load and manipulate CSV metadata |
| `numpy` | Numerical operations on signal arrays |
| `ast` | Parse string-encoded dictionaries (scp_codes) |
| `matplotlib` | Visualize ECG waveforms |
| `tensorflow`/`torch` | Build deep learning models |

---

## 📂 Phase 2: Data Loading & Exploration

### Step 2.1 — Load Metadata
```python
import pandas as pd
import numpy as np
import wfdb
import ast

# Path to your dataset folder
DATA_PATH = 'ptb_ecg_dataset/'
SAMPLING_RATE = 100  # Start with 100 Hz

# Load master metadata
df = pd.read_csv(DATA_PATH + 'ptbxl_database.csv', index_col='ecg_id')
print(f"Total records: {len(df)}")
print(f"Columns: {list(df.columns)}")

# Parse scp_codes from string to dictionary
df.scp_codes = df.scp_codes.apply(lambda x: ast.literal_eval(x))
```

### Step 2.2 — Load ECG Waveform Data
```python
def load_raw_data(df, sampling_rate, path):
    """Load ECG signals using wfdb library."""
    if sampling_rate == 100:
        # _lr = low resolution (100 Hz)
        data = [wfdb.rdsamp(path + f) for f in df.filename_lr]
    else:
        # _hr = high resolution (500 Hz)
        data = [wfdb.rdsamp(path + f) for f in df.filename_hr]
    # wfdb.rdsamp returns (signal_array, metadata_dict) — we only need signals
    data = np.array([signal for signal, meta in data])
    return data

# Load all signals — THIS TAKES TIME (~2-5 min for 100Hz)
X = load_raw_data(df, SAMPLING_RATE, DATA_PATH)
print(f"Signal data shape: {X.shape}")  
# Expected: (21801, 1000, 12) for 100Hz
# Meaning: 21801 records × 1000 timesteps × 12 leads
```

### Step 2.3 — Create Diagnostic Labels
```python
# Load SCP statement definitions
scp_df = pd.read_csv(DATA_PATH + 'scp_statements.csv', index_col=0)
# Keep only diagnostic statements
scp_df = scp_df[scp_df.diagnostic == 1]

def aggregate_diagnostic(y_dic):
    """Map SCP codes to diagnostic superclass labels."""
    tmp = []
    for key in y_dic.keys():
        if key in scp_df.index:
            tmp.append(scp_df.loc[key].diagnostic_class)
    return list(set(tmp))

# Create superclass labels
df['diagnostic_superclass'] = df.scp_codes.apply(aggregate_diagnostic)
print(df['diagnostic_superclass'].head(10))
```

### Step 2.4 — Train/Validation/Test Split
```python
# Use pre-defined stratified folds
X_train = X[np.where(df.strat_fold <= 8)]
y_train = df[df.strat_fold <= 8].diagnostic_superclass

X_val = X[np.where(df.strat_fold == 9)]
y_val = df[df.strat_fold == 9].diagnostic_superclass

X_test = X[np.where(df.strat_fold == 10)]
y_test = df[df.strat_fold == 10].diagnostic_superclass

print(f"Train: {X_train.shape}, Val: {X_val.shape}, Test: {X_test.shape}")
```

---

## 📂 Phase 3: Data Preprocessing

### Step 3.1 — Convert Multi-Labels to Binary Vectors
```python
from sklearn.preprocessing import MultiLabelBinarizer

mlb = MultiLabelBinarizer()
y_train_bin = mlb.fit_transform(y_train)
y_val_bin = mlb.transform(y_val)
y_test_bin = mlb.transform(y_test)

print(f"Label classes: {mlb.classes_}")
# Expected: ['CD', 'HYP', 'MI', 'NORM', 'STTC']
print(f"y_train shape: {y_train_bin.shape}")  # (N, 5)
```

### Step 3.2 — Normalize Signals
```python
# Z-score normalization per channel
from sklearn.preprocessing import StandardScaler

# Reshape for scaler: (samples * timesteps, channels)
n_samples, n_timesteps, n_channels = X_train.shape
X_train_flat = X_train.reshape(-1, n_channels)

scaler = StandardScaler()
X_train_flat = scaler.fit_transform(X_train_flat)
X_train_norm = X_train_flat.reshape(n_samples, n_timesteps, n_channels)

# Apply same scaler to val/test
X_val_norm = scaler.transform(X_val.reshape(-1, n_channels)).reshape(X_val.shape)
X_test_norm = scaler.transform(X_test.reshape(-1, n_channels)).reshape(X_test.shape)
```

### Step 3.3 — Handle Empty Labels
```python
# Some records have no diagnostic superclass — filter them out
mask_train = y_train.apply(len) > 0
mask_val = y_val.apply(len) > 0
mask_test = y_test.apply(len) > 0

X_train_clean = X_train_norm[mask_train.values]
y_train_clean = y_train_bin[mask_train.values]
# Repeat for val and test...
```

---

## 📂 Phase 4: Model Building

### Option A — 1D CNN (Recommended Starting Point)
```python
import tensorflow as tf
from tensorflow.keras import layers, models

def build_cnn_model(input_shape, n_classes):
    model = models.Sequential([
        # Conv Block 1
        layers.Conv1D(64, 7, activation='relu', padding='same', input_shape=input_shape),
        layers.BatchNormalization(),
        layers.MaxPooling1D(2),
        layers.Dropout(0.2),
        
        # Conv Block 2
        layers.Conv1D(128, 5, activation='relu', padding='same'),
        layers.BatchNormalization(),
        layers.MaxPooling1D(2),
        layers.Dropout(0.2),
        
        # Conv Block 3
        layers.Conv1D(256, 3, activation='relu', padding='same'),
        layers.BatchNormalization(),
        layers.GlobalAveragePooling1D(),
        layers.Dropout(0.3),
        
        # Classification Head
        layers.Dense(128, activation='relu'),
        layers.Dropout(0.3),
        layers.Dense(n_classes, activation='sigmoid')  # sigmoid for multi-label
    ])
    return model

model = build_cnn_model((1000, 12), 5)
model.compile(
    optimizer='adam',
    loss='binary_crossentropy',  # multi-label loss
    metrics=['accuracy', tf.keras.metrics.AUC(name='auc')]
)
model.summary()
```

### Option B — BiLSTM (For Temporal Patterns)
```python
def build_bilstm_model(input_shape, n_classes):
    model = models.Sequential([
        layers.Bidirectional(layers.LSTM(128, return_sequences=True), input_shape=input_shape),
        layers.Dropout(0.3),
        layers.Bidirectional(layers.LSTM(64)),
        layers.Dropout(0.3),
        layers.Dense(64, activation='relu'),
        layers.Dense(n_classes, activation='sigmoid')
    ])
    return model
```

### Option C — CNN + LSTM Hybrid (Best of Both)
```python
def build_hybrid_model(input_shape, n_classes):
    inputs = layers.Input(shape=input_shape)
    
    # CNN feature extraction
    x = layers.Conv1D(64, 7, activation='relu', padding='same')(inputs)
    x = layers.BatchNormalization()(x)
    x = layers.MaxPooling1D(4)(x)
    x = layers.Conv1D(128, 5, activation='relu', padding='same')(x)
    x = layers.BatchNormalization()(x)
    x = layers.MaxPooling1D(4)(x)
    
    # LSTM temporal modeling
    x = layers.Bidirectional(layers.LSTM(64))(x)
    x = layers.Dropout(0.3)(x)
    x = layers.Dense(64, activation='relu')(x)
    outputs = layers.Dense(n_classes, activation='sigmoid')(x)
    
    return models.Model(inputs, outputs)
```

---

## 📂 Phase 5: Training

```python
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau, ModelCheckpoint

callbacks = [
    EarlyStopping(monitor='val_auc', patience=10, mode='max', restore_best_weights=True),
    ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=5),
    ModelCheckpoint('best_ecg_model.keras', monitor='val_auc', mode='max', save_best_only=True)
]

history = model.fit(
    X_train_clean, y_train_clean,
    validation_data=(X_val_clean, y_val_clean),
    epochs=50,
    batch_size=64,
    callbacks=callbacks
)
```

---

## 📂 Phase 6: Evaluation

```python
from sklearn.metrics import classification_report, roc_auc_score

# Predict
y_pred = model.predict(X_test_clean)
y_pred_binary = (y_pred > 0.5).astype(int)

# Classification Report
print(classification_report(y_test_clean, y_pred_binary, target_names=mlb.classes_))

# AUC Score
auc = roc_auc_score(y_test_clean, y_pred, average='macro')
print(f"Macro AUC-ROC: {auc:.4f}")
```

---

## 📂 Phase 7: Visualization

```python
import matplotlib.pyplot as plt

# Plot single ECG
def plot_ecg(signal, title="12-Lead ECG"):
    leads = ['I', 'II', 'III', 'AVL', 'AVR', 'AVF', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6']
    fig, axes = plt.subplots(6, 2, figsize=(14, 16))
    for i, ax in enumerate(axes.flat):
        ax.plot(signal[:, i], linewidth=0.5, color='#d32f2f')
        ax.set_title(leads[i], fontsize=10)
        ax.set_xlim(0, len(signal))
        ax.grid(True, alpha=0.3)
    plt.suptitle(title, fontsize=14, fontweight='bold')
    plt.tight_layout()
    plt.show()

plot_ecg(X[0], title=f"ECG Record #1 | Labels: {df.iloc[0].scp_codes}")
```

---

## 🗺️ Project Roadmap

| Phase | Task | Status |
|-------|------|--------|
| 0 | Understand dataset structure | ⬜ |
| 1 | Setup environment & install libraries | ⬜ |
| 2 | Load data & explore | ⬜ |
| 3 | Preprocess (normalize, encode labels) | ⬜ |
| 4 | Build model (start with 1D CNN) | ⬜ |
| 5 | Train with callbacks | ⬜ |
| 6 | Evaluate (AUC, classification report) | ⬜ |
| 7 | Visualize results | ⬜ |
| 8 | Iterate (try LSTM, hybrid, 500Hz) | ⬜ |

---

## 📚 Key References

1. Wagner et al. (2020). "PTB-XL: A Large Publicly Available ECG Dataset." *Scientific Data*.
2. Strodthoff et al. (2021). "Deep Learning for ECG Analysis: Benchmarks and Insights from PTB-XL." *IEEE JBHI*.
3. [Official Example Script](./ptb_ecg_dataset/example_physionet.py)
