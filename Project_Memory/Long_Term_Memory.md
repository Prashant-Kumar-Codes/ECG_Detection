# Long Term Memory — ECG Detection Project

## Dataset Quick Reference
- **Path:** `ptb_ecg_dataset/`
- **CSV:** `ptbxl_database.csv` (index: ecg_id, 28+ columns)
- **Labels Column:** `scp_codes` — stored as string dict, must parse with `ast.literal_eval()`
- **File Path Columns:** `filename_lr` (100Hz), `filename_hr` (500Hz)
- **Split Column:** `strat_fold` (1-8=train, 9=val, 10=test)
- **Signal Reader:** `wfdb.rdsamp(path + filename)` → returns `(signal_ndarray, metadata_dict)`

## Critical Code Patterns

### Loading Data
```python
import wfdb, ast
df = pd.read_csv('ptb_ecg_dataset/ptbxl_database.csv', index_col='ecg_id')
df.scp_codes = df.scp_codes.apply(lambda x: ast.literal_eval(x))
signal, meta = wfdb.rdsamp('ptb_ecg_dataset/' + df.filename_lr.iloc[0])
# signal.shape = (1000, 12) for 100Hz
```

### Creating Superclass Labels
```python
scp_df = pd.read_csv('ptb_ecg_dataset/scp_statements.csv', index_col=0)
scp_df = scp_df[scp_df.diagnostic == 1]
# Map scp_codes dict keys → diagnostic_class from scp_df
```

### Multi-Label Encoding
```python
from sklearn.preprocessing import MultiLabelBinarizer
mlb = MultiLabelBinarizer()  # classes_: ['CD', 'HYP', 'MI', 'NORM', 'STTC']
```

## Architecture Notes
- Use `sigmoid` activation (not softmax) — multi-label problem
- Use `binary_crossentropy` loss — not categorical
- 1D CNN works well for ECG: Conv1D → BatchNorm → MaxPool → Dense
- Input shape: `(1000, 12)` for 100Hz or `(5000, 12)` for 500Hz

## Important Gotchas
1. `scp_codes` is a STRING in CSV — must `ast.literal_eval()` to convert to dict
2. Some records have empty diagnostic_superclass — filter them before training
3. `filename_lr`/`filename_hr` paths use forward slashes, work on Windows with wfdb
4. Loading all 21k records at 500Hz needs ~5GB RAM; use 100Hz for prototyping
5. Always use the pre-defined `strat_fold` split — it respects patient assignment
