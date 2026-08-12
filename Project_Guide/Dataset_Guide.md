# 🫀 PTB-XL Dataset — Complete Beginner's Guide

> **Goal of this guide:** Help you understand the dataset structure so deeply that you can confidently load, explore, and prepare the data for feature engineering & model training.

---

## 📖 Table of Contents

1. [What is this Dataset?](#1-what-is-this-dataset)
2. [Where did we get it?](#2-where-did-we-get-it)
3. [Folder Structure — What's Inside?](#3-folder-structure--whats-inside)
4. [The Two CSV Files (Your Starting Point)](#4-the-two-csv-files-your-starting-point)
5. [Reading ECG Waveforms (.dat/.hea files)](#5-reading-ecg-waveforms-dathea-files)
6. [Understanding the Label System](#6-understanding-the-label-system)
7. [Connecting Everything — The Full Pipeline](#7-connecting-everything--the-full-pipeline)
8. [Ready for Feature Engineering — What You Have Now](#8-ready-for-feature-engineering--what-you-have-now)

---

## 1. What is this Dataset?

Imagine going to a hospital and getting an ECG test. The doctor sticks **12 electrode pads** on your chest and limbs. The machine records your heart's electrical signals for **10 seconds**. That recording is saved as a file.

**PTB-XL** is a collection of **21,801 such recordings** from **18,869 real patients**. Each recording has:
- The actual **heart signal data** (numbers representing voltage over time)
- **Doctor's diagnosis** (what condition they found — normal, heart attack, etc.)
- **Patient info** (age, sex, height, weight)

### Think of it like this:

```
One ECG Record = {
    "signal": 10 seconds of heart voltage from 12 angles,
    "diagnosis": "Normal" or "Heart Attack" or "Multiple conditions",
    "patient": { age: 56, sex: male, weight: 63kg }
}
```

We have **21,801** of these records. Our job? Build a model that looks at the signal and predicts the diagnosis.

---

## 2. Where Did We Get It?

- **Source:** [PhysioNet — PTB-XL v1.0.2](https://physionet.org/content/ptb-xl/1.0.2/)
- **Paper:** Wagner et al. (2020), published in *Scientific Data* (Nature)
- **License:** Creative Commons Attribution 4.0 (free to use)

The dataset was recorded at the **PTB (Physikalisch-Technische Bundesanstalt)** hospital in Germany.

---

## 3. Folder Structure — What's Inside?

Here's what's in your `Datasets/ptb_ecg_dataset/` folder:

```
ptb_ecg_dataset/
│
├── ptbxl_database.csv          ← 🗂️ MASTER FILE: 1 row per ECG record (21,801 rows)
├── scp_statements.csv          ← 🏷️ LABEL DICTIONARY: what each diagnosis code means
├── example_physionet.py        ← 📝 Official example script (reference only)
│
├── records100/                 ← 📊 ECG signals at 100 Hz (downsampled, smaller files)
│   ├── 00000/                     Contains records 00001 to ~00999
│   │   ├── 00001_lr.dat          ← Binary signal data (the actual heart voltages)
│   │   ├── 00001_lr.hea          ← Header file (tells wfdb how to read the .dat)
│   │   ├── 00002_lr.dat
│   │   ├── 00002_lr.hea
│   │   └── ... (~1000 pairs per subfolder)
│   ├── 01000/                     Contains records 01000 to ~01999
│   └── ... (22 subfolders total)
│
└── records500/                 ← 📊 ECG signals at 500 Hz (full resolution, larger files)
    ├── 00000/
    │   ├── 00001_hr.dat
    │   ├── 00001_hr.hea
    │   └── ...
    └── ...
```

### Key naming conventions:
| Pattern | Meaning |
|---------|---------|
| `_lr` | **L**ow **R**esolution (100 Hz) |
| `_hr` | **H**igh **R**esolution (500 Hz) |
| `.dat` | Binary file with actual signal numbers |
| `.hea` | Text header describing the signal format |

> **⚠️ You CANNOT open `.dat` files in a text editor.** They are binary. You need the `wfdb` library to read them. The `.hea` file tells `wfdb` how to decode the `.dat` file.

---

## 4. The Two CSV Files (Your Starting Point)

### 4A. `ptbxl_database.csv` — The Master Metadata File

This is the **most important file**. It's a normal CSV with **21,801 rows** (one per ECG recording) and **43 columns**.

```python
# ============================================
# STEP 1: Load the master metadata
# ============================================
import pandas as pd
from pathlib import Path

# Set up paths (from your notebook location)
project_root = Path.cwd().parent.parent  # adjust based on your notebook location
data_path = project_root / 'Datasets' / 'ptb_ecg_dataset'

df = pd.read_csv(data_path / 'ptbxl_database.csv', index_col='ecg_id')
print(f"Total records: {len(df)}")       # 21801
print(f"Total columns: {len(df.columns)}")  # 43
print(f"Columns: {list(df.columns)}")
```

#### The Important Columns (you need these):

| Column | Type | What it means | Example |
|--------|------|--------------|---------|
| `ecg_id` | int | Unique ID for each ECG | `1`, `2`, `3`... |
| `patient_id` | float | Which patient this belongs to | `15709.0` |
| `age` | float | Patient's age | `56.0` |
| `sex` | int | `0` = female, `1` = male | `1` |
| `height` | float | Height in cm (often NaN) | `NaN` |
| `weight` | float | Weight in kg | `63.0` |
| `scp_codes` | string | **The diagnosis labels** (stored as a string that looks like a dictionary) | `"{'NORM': 100.0, 'SR': 0.0}"` |
| `report` | string | Doctor's text report (in German!) | `"sinusrhythmus normales ekg"` |
| `strat_fold` | int | Pre-assigned fold for train/test split (1-10) | `3` |
| `filename_lr` | string | Path to 100Hz signal file | `"records100/00000/00001_lr"` |
| `filename_hr` | string | Path to 500Hz signal file | `"records500/00000/00001_hr"` |
| `validated_by_human` | bool | Whether a human doctor verified the labels | `True` |

```python
# ============================================
# STEP 2: Explore the metadata
# ============================================

# Look at first 3 rows (key columns only)
key_cols = ['patient_id', 'age', 'sex', 'scp_codes', 'report', 'strat_fold', 'filename_lr']
print(df[key_cols].head(3))

# Check age distribution
print(f"\nAge range: {df.age.min()} to {df.age.max()}")
print(f"Average age: {df.age.mean():.1f}")

# Check sex distribution (0=female, 1=male)
print(f"\nSex distribution:")
print(df.sex.value_counts())

# Check strat_fold distribution (for train/test split)
print(f"\nFold distribution:")
print(df.strat_fold.value_counts().sort_index())
```

#### ⚠️ The `scp_codes` Gotcha

The `scp_codes` column looks like a Python dictionary, but it's actually stored as a **string**. You MUST convert it:

```python
# ============================================
# STEP 3: Convert scp_codes from string to real dictionary
# ============================================
import ast

# BEFORE conversion:
print(type(df.scp_codes.iloc[0]))  # <class 'str'>
print(df.scp_codes.iloc[0])        # "{'NORM': 100.0, 'LVOLT': 0.0, 'SR': 0.0}"

# Convert string → dictionary using ast.literal_eval
df.scp_codes = df.scp_codes.apply(lambda x: ast.literal_eval(x))

# AFTER conversion:
print(type(df.scp_codes.iloc[0]))  # <class 'dict'>
print(df.scp_codes.iloc[0])        # {'NORM': 100.0, 'LVOLT': 0.0, 'SR': 0.0}

# Now you can access individual diagnosis codes:
first_record = df.scp_codes.iloc[0]
print(first_record.keys())    # dict_keys(['NORM', 'LVOLT', 'SR'])
print(first_record['NORM'])   # 100.0 (100% confidence this is Normal)
```

**What do the numbers mean?**
- `100.0` = Doctor is 100% sure about this diagnosis
- `80.0` = Doctor is 80% confident
- `0.0` = "Unknown likelihood" (the code applies but confidence is uncertain)

---

### 4B. `scp_statements.csv` — The Label Dictionary

This file has **71 rows** — one for each possible diagnosis code. It tells you what each code means and how they're grouped.

```python
# ============================================
# STEP 4: Load and understand the label definitions
# ============================================
scp_df = pd.read_csv(data_path / 'scp_statements.csv', index_col=0)
print(f"Total diagnosis codes: {len(scp_df)}")  # 71
print(f"Columns: {list(scp_df.columns)}")
```

#### Key columns in scp_statements.csv:

| Column | What it means | Example |
|--------|--------------|---------|
| index (row name) | The code itself | `NORM`, `IMI`, `LVH` |
| `description` | Human-readable name | `"normal ECG"`, `"inferior myocardial infarction"` |
| `diagnostic` | Is it a diagnostic code? (`1.0` = yes) | `1.0` |
| `form` | Is it a waveform morphology code? | `1.0` or `NaN` |
| `rhythm` | Is it a rhythm code? | `1.0` or `NaN` |
| `diagnostic_class` | **Superclass** (5 categories) | `NORM`, `MI`, `STTC`, `CD`, `HYP` |
| `diagnostic_subclass` | More specific category | `IMI`, `AMI`, `LVH` |

```python
# ============================================
# STEP 5: Understand the label hierarchy
# ============================================

# Three categories of SCP codes:
diagnostic_codes = scp_df[scp_df.diagnostic == 1]
form_codes = scp_df[scp_df.form == 1]
rhythm_codes = scp_df[scp_df.rhythm == 1]

print(f"Diagnostic codes: {len(diagnostic_codes)}")  # 44
print(f"Form codes: {len(form_codes)}")               # 19
print(f"Rhythm codes: {len(rhythm_codes)}")            # 12
# Note: some codes belong to multiple categories

# The 5 diagnostic superclasses (OUR PRIMARY TARGET):
print("\n=== DIAGNOSTIC SUPERCLASSES ===")
print(diagnostic_codes.groupby('diagnostic_class')['description'].apply(list))
```

#### The 5 Superclasses Explained (What We're Predicting):

| Code | Full Name | What it means | # of sub-codes |
|------|-----------|--------------|----------------|
| **NORM** | Normal ECG | Healthy heart, no issues found | 1 |
| **MI** | Myocardial Infarction | Heart attack — blocked blood flow damaged the heart | 14 |
| **STTC** | ST/T Changes | Abnormalities in the ST segment or T wave of the ECG | 13 |
| **CD** | Conduction Disturbance | Electrical signals travel abnormally through the heart | 11 |
| **HYP** | Hypertrophy | Heart chambers are enlarged/thickened | 5 |

> **🔑 KEY INSIGHT:** Each ECG can have **MULTIPLE labels** at the same time. A patient can have BOTH a heart attack (MI) AND conduction disturbance (CD). This makes it a **multi-label classification** problem, not a simple pick-one problem.

---

## 5. Reading ECG Waveforms (.dat/.hea files)

This is where most beginners get confused. The actual heart signals aren't in the CSV — they're in separate binary files. Here's how to read them.

### 5A. Reading a Single ECG Record

```python
# ============================================
# STEP 6: Read ONE ECG signal file
# ============================================
import wfdb
import numpy as np

# Pick the first record's filename from the metadata
filename = df.filename_lr.iloc[0]  # 'records100/00000/00001_lr'
full_path = str(data_path / filename)

# wfdb.rdsamp() reads the .dat + .hea pair and returns a TUPLE
result = wfdb.rdsamp(full_path)

# Unpack the tuple
signal, metadata = result

print(f"Signal type: {type(signal)}")     # numpy.ndarray
print(f"Signal shape: {signal.shape}")     # (1000, 12)
print(f"Signal dtype: {signal.dtype}")     # float64
print(f"Metadata type: {type(metadata)}") # dict
```

### 5B. What Does the Signal Look Like?

```
signal.shape = (1000, 12)
                 │      │
                 │      └── 12 columns = 12 ECG leads
                 │          [I, II, III, AVR, AVL, AVF, V1, V2, V3, V4, V5, V6]
                 │
                 └── 1000 rows = 1000 time points
                     (10 seconds × 100 samples/second = 1000 samples)
```

Each number is a **voltage in millivolts (mV)**, typically ranging from about -1.5 to +1.5 mV.

```python
# ============================================
# STEP 7: Explore the signal data
# ============================================

print("First 5 time points, all 12 leads:")
print(signal[:5])
# Output: Each row is one moment in time, each column is one lead
# [[-0.119  -0.055   0.064   0.086  -0.091   0.004  -0.069  -0.031   0.   -0.026  -0.039  -0.079]
#  [-0.116  -0.051   0.065   0.083  -0.09    0.006  -0.064  -0.036  -0.003 -0.031  -0.034  -0.074]
#  ...

# Lead names from metadata
print(f"Lead names: {metadata['sig_name']}")
# ['I', 'II', 'III', 'AVR', 'AVL', 'AVF', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6']

print(f"Sampling frequency: {metadata['fs']} Hz")  # 100
print(f"Signal length: {metadata['sig_len']}")      # 1000
print(f"Number of leads: {metadata['n_sig']}")      # 12
print(f"Units: {metadata['units']}")                # ['mV', 'mV', ..., 'mV']

# Value range
print(f"\nVoltage range: {signal.min():.3f} mV to {signal.max():.3f} mV")
```

### 5C. Visualize a Single ECG

```python
# ============================================
# STEP 8: Plot the ECG waveform
# ============================================
import matplotlib.pyplot as plt

lead_names = ['I', 'II', 'III', 'AVR', 'AVL', 'AVF',
              'V1', 'V2', 'V3', 'V4', 'V5', 'V6']

fig, axes = plt.subplots(6, 2, figsize=(14, 16))
time_axis = np.arange(signal.shape[0]) / 100  # Convert samples to seconds

for i, ax in enumerate(axes.flat):
    ax.plot(time_axis, signal[:, i], linewidth=0.5, color='#d32f2f')
    ax.set_title(f'Lead {lead_names[i]}', fontsize=10)
    ax.set_xlabel('Time (seconds)')
    ax.set_ylabel('mV')
    ax.grid(True, alpha=0.3)

diagnosis = df.scp_codes.iloc[0]
plt.suptitle(f'ECG Record #1 | Diagnosis: {diagnosis}', fontsize=14, fontweight='bold')
plt.tight_layout()
plt.show()
```

### 5D. Reading ALL ECG Signals (Batch Loading)

```python
# ============================================
# STEP 9: Load ALL signals into one big numpy array
# ============================================
# ⚠️ This takes 2-5 minutes for 100Hz data. Be patient!

def load_raw_data(df, sampling_rate, path):
    """Load all ECG signals from disk into a numpy array."""
    if sampling_rate == 100:
        filenames = df.filename_lr   # use low-res files
    else:
        filenames = df.filename_hr   # use high-res files

    signals = []
    for fname in filenames:
        signal, meta = wfdb.rdsamp(str(path / fname))
        signals.append(signal)

    return np.array(signals)

SAMPLING_RATE = 100  # Start with 100Hz for faster loading

X = load_raw_data(df, SAMPLING_RATE, data_path)
print(f"All signals shape: {X.shape}")
# Expected output: (21801, 1000, 12)
#                    │      │     │
#                    │      │     └── 12 leads
#                    │      └── 1000 time points (10 sec × 100 Hz)
#                    └── 21,801 ECG records
```

> **💡 TIP:** The official `example_physionet.py` uses a list comprehension for this, but the loop above is clearer for beginners. Both produce the same result.

---

## 6. Understanding the Label System

This is the part that confuses most beginners. Let's break it down layer by layer.

### 6A. The Raw Labels — `scp_codes` Column

After converting with `ast.literal_eval()` (Step 3 above), each record has a dictionary like:

```python
# Example 1: A normal ECG
{'NORM': 100.0, 'SR': 0.0}
# Meaning: "Normal ECG" with 100% confidence, "Sinus Rhythm" with unknown confidence

# Example 2: A heart attack ECG
{'IMI': 80.0, 'ISCA': 20.0}
# Meaning: "Inferior MI" with 80% confidence, "Ischemic in anterior leads" with 20%

# Example 3: Multiple conditions
{'LAFB': 100.0, 'LVH': 60.0, 'SR': 0.0}
# Meaning: "Left anterior fascicular block" + "Left ventricular hypertrophy" + "Sinus rhythm"
```

**The number (0-100) is the doctor's confidence**, NOT a probability for your model. You'll typically treat any present code as a positive label regardless of the number.

### 6B. From 71 Codes to 5 Superclasses

71 diagnosis codes are too many to classify directly. The dataset provides a **hierarchy** to simplify:

```
71 SCP Codes (too granular)
    ↓ grouped by diagnostic_subclass
~24 Subclasses (still too many)
    ↓ grouped by diagnostic_class
 5 Superclasses ← THIS IS WHAT WE PREDICT
```

Here's the hierarchy visualized:

```
NORM (Normal)
  └── NORM: normal ECG

MI (Myocardial Infarction — Heart Attack)
  ├── AMI:  anteroseptal MI
  ├── IMI:  inferior MI
  ├── ALMI: anterolateral MI
  ├── ILMI: inferolateral MI
  ├── LMI:  lateral MI
  ├── PMI:  posterior MI
  └── ... (14 sub-codes total)

STTC (ST/T Changes)
  ├── NST_: non-specific ST changes
  ├── NDT:  non-diagnostic T abnormalities
  ├── ISC_: non-specific ischemic
  ├── DIG:  digitalis effect
  ├── LNGQT: long QT interval
  └── ... (13 sub-codes total)

CD (Conduction Disturbance)
  ├── LAFB: left anterior fascicular block
  ├── CLBBB: complete left bundle branch block
  ├── CRBBB: complete right bundle branch block
  ├── AVB1: first degree AV block
  ├── AVB2: second degree AV block
  └── ... (11 sub-codes total)

HYP (Hypertrophy)
  ├── LVH:  left ventricular hypertrophy
  ├── RVH:  right ventricular hypertrophy
  ├── LAO:  left atrial overload
  ├── RAO:  right atrial overload
  └── SEHYP: septal hypertrophy
```

### 6C. Mapping SCP Codes → Superclasses (Step by Step)

```python
# ============================================
# STEP 10: Map raw codes to the 5 superclasses
# ============================================

# Load the label definitions (only keep diagnostic ones)
scp_df = pd.read_csv(data_path / 'scp_statements.csv', index_col=0)
diag_df = scp_df[scp_df.diagnostic == 1]  # Keep only diagnostic codes (44 of 71)

print(f"Diagnostic codes: {len(diag_df)}")
print(f"Their superclasses: {diag_df.diagnostic_class.unique()}")
# Output: ['STTC', 'NORM', 'MI', 'HYP', 'CD']

# Let's see which codes map to which superclass
for superclass in ['NORM', 'MI', 'STTC', 'CD', 'HYP']:
    codes = diag_df[diag_df.diagnostic_class == superclass].index.tolist()
    print(f"\n{superclass}: {codes}")
```

```python
# ============================================
# STEP 11: Create the mapping function
# ============================================

def aggregate_diagnostic(scp_codes_dict):
    """
    Takes a dict like {'NORM': 100.0, 'SR': 0.0}
    Returns a list like ['NORM']

    Steps:
    1. Look at each code in the patient's scp_codes
    2. Check if that code is a diagnostic code (exists in diag_df)
    3. If yes, find which superclass it belongs to
    4. Return the unique list of superclasses
    """
    superclasses = []
    for code in scp_codes_dict.keys():
        if code in diag_df.index:
            superclass = diag_df.loc[code, 'diagnostic_class']
            superclasses.append(superclass)
    return list(set(superclasses))  # set() removes duplicates

# Apply to every row
df['diagnostic_superclass'] = df.scp_codes.apply(aggregate_diagnostic)

# Let's see what we got:
print(df['diagnostic_superclass'].head(10))
# 1              [NORM]      ← This patient is normal
# 2              [NORM]      ← This patient is normal
# 3              [NORM]      ← This patient is normal
# 4        [CD, STTC]        ← This patient has BOTH conduction issues AND ST/T changes!
# 5              [NORM]
# ...
```

### 6D. Understanding Multi-Label Records

```python
# ============================================
# STEP 12: Analyze the label distribution
# ============================================

# How many labels does each record have?
label_counts = df.diagnostic_superclass.apply(len)
print("Labels per record:")
print(label_counts.value_counts().sort_index())
# 0     1032    ← These records have NO diagnostic superclass (rhythm/form only)
# 1    15979    ← Most records have exactly 1 superclass
# 2     4201    ← ~4200 records have 2 superclasses
# 3      563    ← Some have 3
# 4       26    ← Very few have 4

# Which superclasses are most common?
from collections import Counter
all_labels = [label for labels in df.diagnostic_superclass for label in labels]
print("\nSuperclass frequency:")
for label, count in Counter(all_labels).most_common():
    print(f"  {label}: {count} records ({count/len(df)*100:.1f}%)")
# NORM:  ~9500 records (43.6%)
# MI:    ~5500 records (25.2%)
# STTC:  ~5200 records (23.9%)
# CD:    ~4900 records (22.5%)
# HYP:   ~2700 records (12.4%)
```

> **🔑 KEY INSIGHT:** The percentages add up to MORE than 100% because of multi-label records. This is why we use **sigmoid + binary_crossentropy** (not softmax + categorical_crossentropy) for training.

---

## 7. Connecting Everything — The Full Pipeline

Now let's put it all together in the correct order:

```python
# ============================================
# COMPLETE PIPELINE: From raw files to model-ready data
# ============================================
import pandas as pd
import numpy as np
import wfdb
import ast
from pathlib import Path

# ----- CONFIGURATION -----
project_root = Path.cwd().parent.parent
data_path = project_root / 'Datasets' / 'ptb_ecg_dataset'
SAMPLING_RATE = 100  # Use 100Hz to start (faster loading)

# ============================
# PART A: Load Metadata
# ============================
df = pd.read_csv(data_path / 'ptbxl_database.csv', index_col='ecg_id')
df.scp_codes = df.scp_codes.apply(lambda x: ast.literal_eval(x))
print(f"✅ Loaded metadata: {len(df)} records")

# ============================
# PART B: Load Signal Data
# ============================
def load_raw_data(df, sampling_rate, path):
    if sampling_rate == 100:
        filenames = df.filename_lr
    else:
        filenames = df.filename_hr
    signals = []
    for i, fname in enumerate(filenames):
        signal, _ = wfdb.rdsamp(str(path / fname))
        signals.append(signal)
        if (i + 1) % 5000 == 0:
            print(f"  Loaded {i+1}/{len(filenames)} records...")
    return np.array(signals)

X = load_raw_data(df, SAMPLING_RATE, data_path)
print(f"✅ Loaded signals: {X.shape}")  # (21801, 1000, 12)

# ============================
# PART C: Create Labels
# ============================
scp_df = pd.read_csv(data_path / 'scp_statements.csv', index_col=0)
diag_df = scp_df[scp_df.diagnostic == 1]

def aggregate_diagnostic(y_dic):
    tmp = []
    for key in y_dic.keys():
        if key in diag_df.index:
            tmp.append(diag_df.loc[key].diagnostic_class)
    return list(set(tmp))

df['diagnostic_superclass'] = df.scp_codes.apply(aggregate_diagnostic)
print(f"✅ Created diagnostic labels")

# ============================
# PART D: Train / Validation / Test Split
# ============================
# The dataset comes with pre-assigned folds (strat_fold column, values 1-10)
# Folds 1-8  → Training
# Fold 9     → Validation
# Fold 10    → Test  (highest quality labels — human verified)

X_train = X[np.where(df.strat_fold <= 8)]
y_train = df[df.strat_fold <= 8].diagnostic_superclass

X_val = X[np.where(df.strat_fold == 9)]
y_val = df[df.strat_fold == 9].diagnostic_superclass

X_test = X[np.where(df.strat_fold == 10)]
y_test = df[df.strat_fold == 10].diagnostic_superclass

print(f"✅ Split data:")
print(f"   Train: {X_train.shape[0]} records")
print(f"   Val:   {X_val.shape[0]} records")
print(f"   Test:  {X_test.shape[0]} records")

# ============================
# PART E: Convert Labels to Binary Vectors
# ============================
from sklearn.preprocessing import MultiLabelBinarizer

mlb = MultiLabelBinarizer()
y_train_bin = mlb.fit_transform(y_train)
y_val_bin = mlb.transform(y_val)
y_test_bin = mlb.transform(y_test)

print(f"✅ Encoded labels:")
print(f"   Classes: {mlb.classes_}")        # ['CD', 'HYP', 'MI', 'NORM', 'STTC']
print(f"   y_train shape: {y_train_bin.shape}")  # (N, 5)

# Example: what a label vector looks like
print(f"\n   First record labels: {y_train.iloc[0]}")
print(f"   As binary vector:   {y_train_bin[0]}")
# e.g. [NORM] → [0, 0, 0, 1, 0]
# e.g. [MI, STTC] → [0, 0, 1, 0, 1]
```

### Understanding `strat_fold` — Why Not Random Split?

| Fold | Records | Purpose | Label Quality |
|------|---------|---------|---------------|
| 1–8 | ~17,400 | **Training** | Standard (auto-generated + some human review) |
| 9 | ~2,200 | **Validation** | Higher (more human validation) |
| 10 | ~2,200 | **Test** | Highest (fully human-verified) |

The folds are **stratified** — each fold has roughly the same proportion of each diagnosis. This is pre-done for you, so **always use `strat_fold`** instead of random splitting.

```python
# Verify stratification
print("Label distribution per fold:")
for fold in range(1, 11):
    fold_labels = df[df.strat_fold == fold].diagnostic_superclass
    norm_count = sum(1 for labels in fold_labels if 'NORM' in labels)
    print(f"  Fold {fold}: {len(fold_labels)} records, {norm_count} NORM ({norm_count/len(fold_labels)*100:.1f}%)")
```

---

## 8. Ready for Feature Engineering — What You Have Now

After running the full pipeline, here's exactly what you have in memory:

### Your Variables:

| Variable | Type | Shape | Description |
|----------|------|-------|-------------|
| `X_train` | numpy array | `(~17400, 1000, 12)` | Training ECG signals |
| `X_val` | numpy array | `(~2200, 1000, 12)` | Validation ECG signals |
| `X_test` | numpy array | `(~2200, 1000, 12)` | Test ECG signals |
| `y_train_bin` | numpy array | `(~17400, 5)` | Training labels (binary vectors) |
| `y_val_bin` | numpy array | `(~2200, 5)` | Validation labels |
| `y_test_bin` | numpy array | `(~2200, 5)` | Test labels |
| `df` | DataFrame | `(21801, 44)` | Full metadata with parsed labels |
| `mlb` | MultiLabelBinarizer | — | Encoder to convert labels back and forth |

### What Each Dimension Means:

```
X_train[0]          → First patient's ECG signal (shape: 1000, 12)
X_train[0, :, 0]    → First patient's Lead I signal (shape: 1000,) — a 1D time series
X_train[0, 50, :]   → First patient's voltage at time point 50 across all 12 leads
X_train[:, :, 0]    → ALL patients' Lead I signals (shape: ~17400, 1000)

y_train_bin[0]      → First patient's label e.g. [0, 0, 0, 1, 0] = NORM only
y_train_bin[0][3]   → Is first patient NORM? (1=yes, 0=no)
```

### ⚠️ Before Feature Engineering — Handle These:

```python
# ============================================
# STEP 13: Pre-FE Checklist
# ============================================

# 1. Check for empty labels (records with no diagnostic superclass)
empty_mask_train = y_train.apply(len) == 0
print(f"Empty label records in train: {empty_mask_train.sum()}")
# → You'll want to either remove these or handle them

# 2. Filter out empty labels if needed
if empty_mask_train.sum() > 0:
    X_train_clean = X_train[~empty_mask_train.values]
    y_train_clean = y_train_bin[~empty_mask_train.values]
    print(f"After filtering: {X_train_clean.shape[0]} training records")

# 3. Check for NaN values in signals
nan_count = np.isnan(X_train).sum()
print(f"NaN values in training signals: {nan_count}")

# 4. Check signal value ranges (should be small mV values)
print(f"Signal range: [{X_train.min():.3f}, {X_train.max():.3f}] mV")
```

### 🗺️ What Comes Next (Feature Engineering Options):

| Approach | What to Do | When to Use |
|----------|-----------|-------------|
| **Raw signals → Deep Learning** | Normalize signals, feed directly to 1D CNN/LSTM | Most common, best results |
| **Handcrafted features → ML** | Extract heart rate, QRS duration, R-peak amplitudes etc. | If you want interpretable models |
| **Spectrogram → 2D CNN** | Convert time-series to frequency-domain images | Advanced, good for rhythm detection |

For your next notebook, you'll likely want to:
1. **Normalize** the signals (z-score per channel)
2. **Filter** empty-label records
3. Either feed raw signals to a 1D CNN, or extract features manually

---

## 📝 Quick Reference Cheat Sheet

```python
# Load everything in ~10 lines:
import pandas as pd, numpy as np, wfdb, ast
from pathlib import Path
from sklearn.preprocessing import MultiLabelBinarizer

path = Path('path/to/ptb_ecg_dataset')
df = pd.read_csv(path / 'ptbxl_database.csv', index_col='ecg_id')
df.scp_codes = df.scp_codes.apply(ast.literal_eval)

X = np.array([wfdb.rdsamp(str(path / f))[0] for f in df.filename_lr])

scp = pd.read_csv(path / 'scp_statements.csv', index_col=0)
diag = scp[scp.diagnostic == 1]
df['label'] = df.scp_codes.apply(
    lambda d: list(set(diag.loc[k].diagnostic_class for k in d if k in diag.index))
)

X_train, y_train = X[df.strat_fold <= 8], df[df.strat_fold <= 8].label
X_test, y_test = X[df.strat_fold == 10], df[df.strat_fold == 10].label

mlb = MultiLabelBinarizer()
y_train_bin = mlb.fit_transform(y_train)
y_test_bin = mlb.transform(y_test)
```

---

> **📚 References:**
> - [PhysioNet PTB-XL v1.0.2](https://physionet.org/content/ptb-xl/1.0.2/)
> - Wagner et al. (2020). *PTB-XL: A Large Publicly Available ECG Dataset.* Scientific Data.
> - [WFDB Python Library Docs](https://wfdb.readthedocs.io/)
