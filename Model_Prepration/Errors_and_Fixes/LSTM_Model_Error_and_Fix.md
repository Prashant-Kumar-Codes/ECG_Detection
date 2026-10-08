There are two main issues in your architecture:

---

### 1. Conceptual Error: Using `nn.Embedding` on Continuous Signals
`nn.Embedding` is a lookup table strictly designed for **discrete integer indices** (like token IDs in NLP, e.g., vocabulary indices $0, 1, \dots, V-1$). 

Your ECG data consists of **continuous floating-point numbers** with shape `(1000, 12)`:
- `1000`: sequence length ($T$ time steps)
- `12`: input feature dimension ($C$ leads per time step)

If you pass continuous floats into `nn.Embedding`, PyTorch will raise a `RuntimeError` (`Expected tensor ... to have scalar type Long or Int; but got Float`).

---

### 2. Dimension Mismatch for `nn.LSTM`
With `batch_first=True`, `nn.LSTM` expects input tensors of shape:
$$\text{(batch\_size, seq\_len, input\_size)}$$

For your data:
- `seq_len = 1000`
- `input_size = 12` (leads)

You have two ways to handle this:
1. **Direct input (Simplest & standard):** Feed the 12 leads directly into the LSTM (`input_size = 12`).
2. **Linear projection:** If you want a 126-dimensional embedding representation before the LSTM, use `nn.Linear(input_size, embed_dim)` instead of `nn.Embedding`.

---

### Corrected Code

#### Option A: Direct Input to LSTM (Recommended)
No embedding layer needed; the LSTM directly processes the 12 lead values at each time step.

```python
import torch
import torch.nn as nn

INPUT_SIZE = 12      # 12 leads per time step
SEQ_LEN = 1000       # 1000 time steps
NUM_LAYERS = 1
OUTPUT_DIM = 5
HIDDEN_DIM = 90
DROPOUT = 0.25

class BiLSTM(nn.Module):
    def __init__(self, input_size=INPUT_SIZE, hidden_dim=HIDDEN_DIM, output_dim=OUTPUT_DIM, num_layers=NUM_LAYERS, dropout=DROPOUT):
        super(BiLSTM, self).__init__()
        
        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_dim,
            num_layers=num_layers,
            batch_first=True,
            bias=True,
            dropout=dropout if num_layers > 1 else 0,
            bidirectional=True
        )
        self.dropout = nn.Dropout(dropout)
        self.fc = nn.Linear(hidden_dim * 2, output_dim)
        
    def forward(self, signal):
        # signal shape: [batch_size, 1000, 12]
        lstm_out, (hidden, cell) = self.lstm(signal)
        
        # Concatenate forward and backward last hidden states
        hidden_last = torch.cat((hidden[-2, :, :], hidden[-1, :, :]), dim=1)  # [batch_size, hidden_dim * 2]
        logits = self.fc(self.dropout(hidden_last))                           # [batch_size, output_dim]
        
        return logits
```

---

#### Option B: With Linear Projection Layer
If your goal was to project each 12-channel time step into a higher-dimensional feature space (`embed_dim = 126`):

```python
class BiLSTMWithProjection(nn.Module):
    def __init__(self, input_size=12, embed_dim=126, hidden_dim=90, output_dim=5, num_layers=1, dropout=0.25):
        super(BiLSTMWithProjection, self).__init__()
        
        # Projects 12 leads -> embed_dim at each time step
        self.proj = nn.Linear(input_size, embed_dim)
        
        self.lstm = nn.LSTM(
            input_size=embed_dim,
            hidden_size=hidden_dim,
            num_layers=num_layers,
            batch_first=True,
            bias=True,
            dropout=dropout if num_layers > 1 else 0,
            bidirectional=True
        )
        self.dropout = nn.Dropout(dropout)
        self.fc = nn.Linear(hidden_dim * 2, output_dim)
        
    def forward(self, signal):
        # signal: [batch_size, 1000, 12]
        projected = self.dropout(torch.relu(self.proj(signal)))  # [batch_size, 1000, embed_dim]
        lstm_out, (hidden, cell) = self.lstm(projected)
        
        hidden_last = torch.cat((hidden[-2, :, :], hidden[-1, :, :]), dim=1)
        logits = self.fc(self.dropout(hidden_last))
        return logits
```

> **Note on Training:** Since PTB-XL diagnosis is multi-label (samples can have multiple classes simultaneously), pass these raw `logits` directly into `nn.BCEWithLogitsLoss()`. Avoid putting `nn.Sigmoid()` at the end of the model during training for numerical stability.

---

Here is the complete step-by-step breakdown of how this model processes an ECG batch, including tensor shapes, mathematical operations, and the internal mechanics of each layer.

---

### Dimensions Notation
* $B$ = Batch size (e.g., 32 or 64)
* $T$ = Sequence length = $1000$ (time steps, e.g., 10 seconds at 100 Hz)
* $C$ = Input channels = $12$ (standard 12 leads)
* $D_{\text{embed}}$ = Projection dimension = $126$
* $H$ = LSTM hidden dimension = $90$
* $K$ = Number of target classes = $5$ (PTB-XL diagnostic superclasses)

---

### Step 1: Input Tensor
```python
# signal shape: [B, 1000, 12]
```
At every single millisecond/time step $t \in [1, 1000]$, the model receives a 12-dimensional vector $x_t \in \mathbb{R}^{12}$ representing the electrical potential across the 12 leads.

---

### Step 2: Linear Projection & Feature Mixing
```python
projected = self.dropout(torch.relu(self.proj(signal)))
```

#### What happens mathematically:
`nn.Linear(12, 126)` holds a weight matrix $W_{\text{proj}} \in \mathbb{R}^{126 \times 12}$ and bias $b_{\text{proj}} \in \mathbb{R}^{126}$.

When applied to a 3D tensor of shape $(B, T, 12)$, PyTorch broadcasts the linear operation across the first two dimensions, applying it **independently to each time step $t$**:

$$z_t = \text{ReLU}(W_{\text{proj}} \, x_t + b_{\text{proj}}), \quad z_t \in \mathbb{R}^{126}$$

#### Why this is useful:
* The 12 ECG leads are physically correlated (e.g., lead II + lead III $\approx$ lead aVF).
* A single LSTM cell could struggle to model cross-channel interactions at the same time step. 
* This layer linearly mixes the 12 leads into a richer 126-dimensional spatial representation **before** temporal sequence modeling begins.

**Output Shape:** `[B, 1000, 126]`

---

### Step 3: Bidirectional LSTM
```python
lstm_out, (hidden, cell) = self.lstm(projected)
```

A standard unidirectional LSTM processes time from $t=1 \to 1000$. A **Bidirectional LSTM** runs two separate recurrent networks simultaneously:
1. **Forward LSTM ($\overrightarrow{\text{LSTM}}$):** Reads $t = 1, 2, \dots, 1000$.
   $$\overrightarrow{h}_t = \sigma(\dots) \odot \overrightarrow{c}_t \quad \in \mathbb{R}^{90}$$
2. **Backward LSTM ($\overleftarrow{\text{LSTM}}$):** Reads $t = 1000, 999, \dots, 1$.
   $$\overleftarrow{h}_t = \sigma(\dots) \odot \overleftarrow{c}_t \quad \in \mathbb{R}^{90}$$

#### Output Shapes:
1. **`lstm_out`**: Shape is `[B, 1000, 180]` ($H \times 2 = 90 \times 2 = 180$).
   * At each time step $t$, it concatenates the forward and backward hidden states: $[\overrightarrow{h}_t \,;\, \overleftarrow{h}_t]$.
2. **`hidden`**: Shape is `[num_directions * num_layers, B, hidden_dim]` $\rightarrow$ `[2, B, 90]`.
   * `hidden[0]` (or `hidden[-2]`): The forward LSTM's final state after reading up to $t = 1000$ ($\overrightarrow{h}_{1000}$).
   * `hidden[1]` (or `hidden[-1]`): The backward LSTM's final state after reading back down to $t = 1$ ($\overleftarrow{h}_{1}$).
3. **`cell`**: Shape is `[2, B, 90]`, corresponding to the long-term memory cell states ($\overrightarrow{c}_{1000}$ and $\overleftarrow{c}_{1}$).

---

### Step 4: Extracting and Merging Sequence Representations
```python
hidden_last = torch.cat((hidden[-2, :, :], hidden[-1, :, :]), dim=1)
```

#### Why index `[-2]` and `[-1]` instead of `lstm_out[:, -1, :]`?
* In `lstm_out[:, -1, :]` (the last time index $t=1000$):
  * The forward component is $\overrightarrow{h}_{1000}$ (full forward history).
  * But the backward component is $\overleftarrow{h}_{1000}$, which has only processed **1 step** of backward context!
* By using the `hidden` tuple:
  * `hidden[-2, :, :]` is $\overrightarrow{h}_{1000}$ (processed $1 \to 1000$).
  * `hidden[-1, :, :]` is $\overleftarrow{h}_{1}$ (processed $1000 \to 1$).
  
Concatenating them along `dim=1` creates a single comprehensive context vector:

$$h_{\text{summary}} = \left[ \overrightarrow{h}_{1000} \;\Vert\; \overleftarrow{h}_{1} \right] \in \mathbb{R}^{180}$$

**Output Shape:** `[B, 180]`

---

### Step 5: Classification Head
```python
logits = self.fc(self.dropout(hidden_last))
```

#### What happens mathematically:
1. **Dropout**: During training (`model.train()`), randomly zeros out elements with probability $p = 0.25$ and scales remaining elements by $\frac{1}{1-p}$ to prevent co-adaptation of features.
2. **Linear transformation**:
   $$\text{logits} = h_{\text{summary}} W_{\text{fc}}^T + b_{\text{fc}}$$
   where $W_{\text{fc}} \in \mathbb{R}^{5 \times 180}$ and $b_{\text{fc}} \in \mathbb{R}^5$.

**Output Shape:** `[B, 5]`

---

### Parameter Count Breakdown

| Layer | Formula | Calculation | Parameters |
| :--- | :--- | :--- | :--- |
| **`proj`** | $(C \times D_{\text{embed}}) + D_{\text{embed}}$ | $(12 \times 126) + 126$ | **1,638** |
| **`lstm` (Forward)** | $4 \times [(D_{\text{embed}} + H) \times H + H]$ | $4 \times [(126 + 90) \times 90 + 90]$ | **78,120** |
| **`lstm` (Backward)** | $4 \times [(D_{\text{embed}} + H) \times H + H]$ | $4 \times [(126 + 90) \times 90 + 90]$ | **78,120** |
| **`fc`** | $(2H \times K) + K$ | $(180 \times 5) + 5$ | **905** |
| **Total** | | | **~158,783** |

This parameter size (~158k parameters, ~600 KB in float32) is lightweight, fits comfortably in GPU memory, and is well-suited to avoid overfitting on the ~21,800 records of PTB-XL.