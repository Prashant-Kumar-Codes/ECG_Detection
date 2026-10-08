Searched for "accuracy"
Searched for "BiLSTM"
Listed directory notebooks
Searched for "LSTM"
Viewed 4_Neural_Networks.ipynb:870-930
Viewed 4_Neural_Networks.ipynb:500-600
Viewed 4_Neural_Networks.ipynb:600-720

In your notebook, the accuracy calculation in `train_lstm_model` has **three fundamental bugs**:

```python
# From your notebook:
total += y_batch.shape[0]
train_loss += loss.item() * y_batch.shape[0]
correct += (logits == y_batch).sum().item()   # <--- BUGS ARE HERE
```

---

### Why It Fails

#### 1. Comparing Continuous Floats to Binary Targets (`logits == y_batch`)
* `logits` are unnormalized real numbers output by your linear layer (e.g., `[-1.42, 2.81, 0.05, ...]`).
* `y_batch` contains binary target indicators (`0.0` or `1.0`).
* A continuous float will almost never exactly equal `0.0` or `1.0`. Therefore, `logits == y_batch` evaluates to `False` everywhere, giving **0% accuracy**.
* For multi-label outputs, you must first convert logits to probabilities with `sigmoid`, then threshold at `0.5`:
  ```python
  preds = (torch.sigmoid(logits) > 0.5).float()
  ```

#### 2. Dimension Mismatch: `correct` vs `total`
* `y_batch` has shape `[batch_size, 5]`.
* `(preds == y_batch).sum().item()` sums across **all elements** (up to $5 \times \text{batch\_size}$ matches).
* But `total += y_batch.shape[0]` only counts the number of **samples** ($\text{batch\_size}$).
* If your predictions were binary, `correct / total` would evaluate to values like **$420\%$**!

#### 3. Loss Function Bug: `nn.CrossEntropyLoss()` on Multi-Label Targets
* Look at your batch printout: `[0., 1., 1., 0., 1.]` has multiple `1`s. PTB-XL is a **multi-label** dataset (patients can have multiple conditions simultaneously).
* `nn.CrossEntropyLoss()` assumes **mutually exclusive** single labels and applies Softmax (forcing probabilities to sum to 1).
* You must use `nn.BCEWithLogitsLoss()`.

---

### How to Correct It

In multi-label classification, there are two common ways to calculate accuracy:

1. **Subset Accuracy (Exact Match Ratio):** A prediction is counted as correct *only* if all 5 class labels match the ground truth for that patient.
2. **Hamming / Element-wise Accuracy:** Percentage of correct individual binary decisions (out of $N \times 5$).

Here is the corrected code:

#### Step 1: Fix Criterion
```python
# Replace nn.CrossEntropyLoss() with:
criterion = nn.BCEWithLogitsLoss()
optimizer = optim.AdamW(lstmModel.parameters(), lr=LEARNING_RATE)
```

#### Step 2: Fix `train_lstm_model`
```python
def train_lstm_model(model, datasetloader, criterion, optimizer, device):
    model.train()
    train_loss = 0.0
    correct_exact = 0      # Subset accuracy (all 5 labels correct)
    correct_elements = 0   # Element-wise binary accuracy
    total_samples = 0
    total_elements = 0
    
    for x_batch, y_batch in datasetloader:
        x_batch = x_batch.to(device)
        y_batch = y_batch.to(device).float()

        optimizer.zero_grad()
        logits = model(x_batch)
        loss = criterion(logits, y_batch)
        loss.backward()
        optimizer.step()

        # Convert logits to binary predictions (0 or 1)
        probs = torch.sigmoid(logits)
        preds = (probs > 0.5).float()

        # 1. Exact Match: check if all 5 classes match for each sample
        exact_matches = (preds == y_batch).all(dim=1)  # shape: [batch_size]
        correct_exact += exact_matches.sum().item()

        # 2. Element-wise Accuracy: total correct bits / total bits
        correct_elements += (preds == y_batch).sum().item()

        total_samples += y_batch.size(0)
        total_elements += y_batch.numel()  # batch_size * 5
        train_loss += loss.item() * y_batch.size(0)
        
    avg_loss = train_loss / total_samples
    exact_acc = correct_exact / total_samples
    element_acc = correct_elements / total_elements
    
    return avg_loss, exact_acc, element_acc
```

#### Step 3: Run Training Loop
```python
print('Training model....')
for epoch in range(1, EPOTCHS + 1):
    train_loss, exact_acc, element_acc = train_lstm_model(
        lstmModel, train_dataloader, criterion, optimizer, device
    )
    print(f"Epoch [{epoch}/{EPOTCHS}] | Loss: {train_loss:.4f} | "
          f"Exact Acc: {exact_acc * 100:.2f}% | Element Acc: {element_acc * 100:.2f}%")
```

*(Note: In imbalanced multi-label problems like PTB-XL, **Macro-F1** and **macro-AUROC** from `sklearn.metrics` are the industry standard metrics to evaluate alongside loss.)*