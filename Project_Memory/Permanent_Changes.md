# Permanent Changes Log

## 2026-08-12 — Project Initialization
- Created `Project_Guide/Guide.md` — Full 7-phase project guide with code examples
- Populated all `Project_Memory/` files with dataset context and AI memory
- Dataset located at `ptb_ecg_dataset/` (renamed from original PTB-XL download)
- Key decisions:
  - Start with **100 Hz** data for faster prototyping
  - Use **5-class diagnostic superclass** as target labels
  - Use **pre-defined strat_fold** splits (1-8 train, 9 val, 10 test)
  - Framework: **TensorFlow/Keras** (can switch to PyTorch later)
  - Multi-label classification with **sigmoid + binary_crossentropy**

## 2026-09-25 — Website Prototype Creation (`ECG_WEBSITE/`)
- Built React (Vite) frontend with clean SaaS aesthetic (Linear/Stripe style)
- Implemented 3 core views:
  1. **Homepage**: System overview, PTB-XL diagnostic superclasses (NORM, MI, STTC, CD, HYP), hardware architecture
  2. **Patient Dashboard & Detect (SPA)**: Patient list/registry with search/filter, and Detect Workspace featuring interactive 12-lead ECG viewer (single lead + 3x4 clinical grid) & multi-label model inference
  3. **Real-Time Stream**: Live oscilloscope trace, 4.5s rolling buffer accumulator, and continuous automated prediction
- Built lightweight FastAPI backend (`main.py`) with REST endpoints and resilient client-side fallback
