# CardioSense AI — 12-Lead ECG Detection & Real-Time Monitoring

Prototype web platform for clinical 12-lead ECG multi-label classification (PTB-XL dataset) and live Arduino telemetry stream monitoring.

---

## Architecture Overview

```
ECG_WEBSITE/
├── frontend/             # React 18 + Vite (Clean SaaS Dashboard)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── HomePage.jsx       # 1. Overview, Architecture & Diagnostic Targets
│   │   │   ├── DashboardPage.jsx  # 2. Patient Registry & 12-Lead Detect SPA
│   │   │   └── RealtimePage.jsx   # 3. Arduino Real-time Telemetry & 4.5s Buffer Detector
│   │   ├── services/api.js        # API Client with robust offline-first fallback
│   │   └── data/mockPatients.js   # Realistic PTB-XL patients & 12-lead signal synthesizer
│   ├── package.json
│   └── vite.config.js
└── backend/              # FastAPI Python Backend
    ├── main.py           # REST endpoints for patients, signals, prediction & Arduino stream
    └── requirements.txt  # fastapi, uvicorn, pydantic, numpy
```

---

## 3 Core Pages

### 1. Homepage (`/`)
- Clinical introduction to 12-lead electrocardiography.
- PTB-XL diagnostic superclass reference:
  - **NORM**: Normal ECG
  - **MI**: Myocardial Infarction
  - **STTC**: ST/T Changes
  - **CD**: Conduction Disturbance
  - **HYP**: Hypertrophy
- Quick links to the Patient Registry and Real-Time Monitor.

### 2. Patient Dashboard & Detect (`/dashboard` — Single Page Application)
- **Sub-page 1 (Patient List / Registry)**:
  - View clinical patient database (ID, demographics, record ID, strat fold, resting heart rate, risk level).
  - Search and filter by diagnostic superclass.
  - "Detect & Analyze" CTA to launch the inspection workspace for any patient.
- **Sub-page 2 (Detect Workspace)**:
  - **12-Lead ECG Visualizer**: Switch between Single-lead focus (`I`, `II`, `III`, `aVR`, `aVL`, `aVF`, `V1-V6`) and standard clinical 3x4 12-lead grid view.
  - **Deep Learning Model Inference**: Multi-label probability meters for each superclass, automated triage indicator, and clinical diagnostic interpretation.

### 3. Real-Time Telemetry Monitor (`/realtime`)
- Designed for direct Arduino hardware connection (e.g. AD8232 sensor via USB serial).
- Live phosphor oscilloscope trace running at 100 Hz.
- **4.5-Second Rolling Buffer Accumulator**: Buffers 450 samples (4.5s window), and automatically triggers model classification at each interval.
- Built-in debugging signal injector: toggle between Normal Sinus, Acute MI, STTC anomaly, and Conduction Delay.
- Rolling event audit log.

---

## Quickstart Guide

> For a complete setup walkthrough on a new or separate PC (including LAN access and troubleshooting), see [frontend/SETUP_GUIDE.md](file:///d:/Codes/Projects/ECG_Detection/ECG_WEBSITE/frontend/SETUP_GUIDE.md).

### 1. Run the Frontend (React + Vite)
```bash
cd ECG_WEBSITE/frontend
npm install
npm run dev
```
Open **http://localhost:3000** in your browser.


> **Note:** The frontend features an offline fallback mechanism. If the backend is not yet started, the entire website will automatically operate in client mode with realistic PTB-XL synthesis!

### 2. Run the Backend (FastAPI)
```bash
cd ECG_WEBSITE/backend
pip install -r requirements.txt
python main.py
```
Backend will start at **http://localhost:8000** (Swagger docs available at `http://localhost:8000/docs`).

### 3. Connecting Your Trained Model
When your PyTorch or TensorFlow model training in `Model_Prepration/` is ready:
1. Load your model weights inside `ECG_WEBSITE/backend/main.py`.
2. In the `@app.post("/api/predict")` handler, pass the incoming 12-lead array through `model.predict()` or `model(tensor)` with sigmoid activation.
3. Return the 5-element probability dictionary (`NORM`, `MI`, `STTC`, `CD`, `HYP`).
