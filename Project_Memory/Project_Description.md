# Project: ECG Detection using Deep Learning

## Objective
Build a deep learning model to classify 12-lead ECG signals into 5 cardiac diagnostic superclasses (NORM, MI, STTC, CD, HYP) using the PTB-XL dataset. This is a **multi-label classification** problem.

## Dataset
- **Name:** PTB-XL v1.0.2
- **Source:** https://physionet.org/content/ptb-xl/1.0.2/
- **Local Folder:** `ptb_ecg_dataset/`
- **Records:** 21,801 clinical 12-lead ECGs from 18,869 patients
- **Duration:** 10 seconds per recording
- **Sampling:** 100 Hz (records100/) and 500 Hz (records500/)
- **Labels:** 71 SCP-ECG codes → aggregated into 5 diagnostic superclasses
- **Format:** WFDB (.dat + .hea files), read with `wfdb.rdsamp()`

## Signal Shape
- 100 Hz: `(1000, 12)` per record → 1000 timesteps × 12 leads
- 500 Hz: `(5000, 12)` per record → 5000 timesteps × 12 leads

## 5 Target Classes (Diagnostic Superclass)
| Code | Meaning |
|------|---------|
| NORM | Normal ECG |
| MI   | Myocardial Infarction |
| STTC | ST/T Changes |
| CD   | Conduction Disturbance |
| HYP  | Hypertrophy |

## Train/Val/Test Split (Pre-defined `strat_fold` column)
- Train: folds 1–8 (~17,400 records)
- Validation: fold 9 (~2,200 records)
- Test: fold 10 (~2,200 records)

## Tech Stack
- Python, NumPy, Pandas, wfdb, matplotlib
- TensorFlow/Keras (deep learning framework)
- scikit-learn (metrics, preprocessing)

## Key Files
| File | Purpose |
|------|---------|
| `ptb_ecg_dataset/ptbxl_database.csv` | Master metadata (28+ columns) |
| `ptb_ecg_dataset/scp_statements.csv` | Label definitions & hierarchy |
| `ptb_ecg_dataset/example_physionet.py` | Official data loading example |
| `Project_Guide/Guide.md` | Full project guide with code |
