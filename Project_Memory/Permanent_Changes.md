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
