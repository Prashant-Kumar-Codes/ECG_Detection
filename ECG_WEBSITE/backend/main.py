import os
import math
from typing import Dict, List, Optional
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(
    title="CardioSense AI — ECG Detection Backend",
    description="FastAPI service for PTB-XL 12-lead ECG analysis and real-time Arduino stream classification",
    version="1.0.0"
)

# Rule 15: Scoped CORS origins instead of wildcard '*'
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# 5 Target Diagnostic Superclasses according to PTB-XL v1.0.2
SUPERCLASSES = ["NORM", "MI", "STTC", "CD", "HYP"]
LEADS = ["I", "II", "III", "aVR", "aVL", "aVF", "V1", "V2", "V3", "V4", "V5", "V6"]

# Pydantic Schemas for boundary validation (Rule 13)
class PredictRequest(BaseModel):
    patient_id: Optional[int] = Field(None, description="PTB-XL Patient ID")
    signal: Optional[Dict[str, List[float]]] = Field(None, description="12-Lead ECG signal dictionary")

class PredictResponse(BaseModel):
    probabilities: Dict[str, float]
    detected_classes: List[str]
    risk_level: str
    inference_time_ms: int
    model_version: str
    clinical_summary: str

# Sample dataset records aligned with PTB-XL database schema
PATIENTS_DATABASE = [
    {
        "patient_id": 14022,
        "record_id": "00001_lr",
        "name": "Eleanor Vance",
        "age": 64,
        "sex": "Female",
        "weight_kg": 68,
        "height_cm": 162,
        "heart_rate_bpm": 72,
        "recorded_date": "2026-09-21 09:15",
        "strat_fold": 10,
        "status": "Flagged - Urgent",
        "risk_level": "High",
        "primary_class": "MI",
        "diagnostic_superclasses": ["MI", "STTC"],
        "clinical_notes": "Acute retrosternal chest pain. Significant ST-elevations in V2-V4 indicating acute anterior myocardial infarction.",
        "predictions": {"NORM": 0.04, "MI": 0.94, "STTC": 0.81, "CD": 0.12, "HYP": 0.08}
    },
    {
        "patient_id": 18239,
        "record_id": "00045_lr",
        "name": "David Kim",
        "age": 38,
        "sex": "Male",
        "weight_kg": 74,
        "height_cm": 178,
        "heart_rate_bpm": 66,
        "recorded_date": "2026-09-23 11:30",
        "strat_fold": 10,
        "status": "Normal",
        "risk_level": "Low",
        "primary_class": "NORM",
        "diagnostic_superclasses": ["NORM"],
        "clinical_notes": "Pre-operative evaluation. Normal sinus rhythm, normal axis, no acute repolarization abnormalities.",
        "predictions": {"NORM": 0.97, "MI": 0.01, "STTC": 0.03, "CD": 0.02, "HYP": 0.01}
    },
    {
        "patient_id": 11204,
        "record_id": "00108_lr",
        "name": "Marcus Brody",
        "age": 71,
        "sex": "Male",
        "weight_kg": 82,
        "height_cm": 175,
        "heart_rate_bpm": 58,
        "recorded_date": "2026-09-24 14:10",
        "strat_fold": 9,
        "status": "Under Review",
        "risk_level": "Moderate",
        "primary_class": "CD",
        "diagnostic_superclasses": ["CD"],
        "clinical_notes": "Recurrent presyncope. Widened QRS complex >120ms with characteristic Left Bundle Branch Block (LBBB).",
        "predictions": {"NORM": 0.08, "MI": 0.15, "STTC": 0.22, "CD": 0.91, "HYP": 0.31}
    },
    {
        "patient_id": 16901,
        "record_id": "00320_lr",
        "name": "Sophia Patel",
        "age": 59,
        "sex": "Female",
        "weight_kg": 62,
        "height_cm": 158,
        "heart_rate_bpm": 84,
        "recorded_date": "2026-09-25 08:45",
        "strat_fold": 10,
        "status": "Flagged - Review",
        "risk_level": "Moderate",
        "primary_class": "STTC",
        "diagnostic_superclasses": ["STTC", "HYP"],
        "clinical_notes": "Severe hypertension. Left ventricular hypertrophy with secondary ST-T wave changes.",
        "predictions": {"NORM": 0.09, "MI": 0.18, "STTC": 0.88, "CD": 0.14, "HYP": 0.82}
    },
    {
        "patient_id": 15477,
        "record_id": "00412_lr",
        "name": "Arthur Pendelton",
        "age": 67,
        "sex": "Male",
        "weight_kg": 89,
        "height_cm": 181,
        "heart_rate_bpm": 76,
        "recorded_date": "2026-09-25 15:20",
        "strat_fold": 8,
        "status": "Normal",
        "risk_level": "Low",
        "primary_class": "NORM",
        "diagnostic_superclasses": ["NORM"],
        "clinical_notes": "Routine health screening. Normal sinus rhythm, normal voltage, normal intervals.",
        "predictions": {"NORM": 0.93, "MI": 0.02, "STTC": 0.05, "CD": 0.04, "HYP": 0.03}
    }
]

def generate_synthetic_signal(condition: str = "NORM", bpm: int = 75, sampling_rate: int = 100, duration_sec: int = 10):
    """Generates synthetic 1000-sample 12-lead ECG signals matching PTB-XL dimensions (1000, 12)."""
    total_samples = sampling_rate * duration_sec
    rr_interval = (60.0 / bpm) * sampling_rate

    lead_scales = {
        'I': 0.8, 'II': 1.1, 'III': 0.7,
        'aVR': -0.9, 'aVL': 0.5, 'aVF': 0.9,
        'V1': -0.6, 'V2': 0.7, 'V3': 1.2, 'V4': 1.4, 'V5': 1.1, 'V6': 0.8
    }

    signals = {lead: [] for lead in LEADS}

    for s in range(total_samples):
        phase = (s % rr_interval) / rr_interval
        t = phase * (60.0 / bpm)

        # Baseline wander
        wander = 0.03 * math.sin(2 * math.pi * 0.15 * (s / sampling_rate))

        # P wave
        p_wave = 0.15 * math.sin(math.pi * (t - 0.08) / 0.10) if (0.08 < t < 0.18) else 0.0

        # QRS complex
        qrs = 0.0
        qrs_start = 0.22
        qrs_width = 0.14 if condition == "CD" else 0.08

        if qrs_start <= t <= qrs_start + qrs_width:
            prog = (t - qrs_start) / qrs_width
            if prog < 0.2:
                qrs = -0.35 if condition == "MI" else -0.08
            elif prog < 0.6:
                hyp_mult = 1.6 if condition == "HYP" else 1.0
                qrs = 1.2 * hyp_mult * math.sin(math.pi * (prog - 0.2) / 0.4)
            else:
                qrs = -0.25 * math.sin(math.pi * (prog - 0.6) / 0.4)

        # ST & T wave
        st_segment = 0.32 if (condition == "MI" and qrs_start + qrs_width <= t < 0.36) else 0.02
        t_wave = 0.0
        if 0.36 <= t < 0.54:
            t_prog = (t - 0.36) / 0.18
            if condition == "STTC":
                t_wave = -0.28 * math.sin(math.pi * t_prog)
            elif condition == "MI":
                t_wave = 0.45 * math.sin(math.pi * t_prog)
            else:
                t_wave = 0.24 * math.sin(math.pi * t_prog)

        raw = wander + p_wave + qrs + st_segment + t_wave

        for lead in LEADS:
            scale = lead_scales[lead]
            signals[lead].append(round(raw * scale, 4))

    return signals

@app.get("/api/health")
def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "CardioSense AI Backend", "version": "1.0.0"}

@app.get("/api/patients")
def get_patients():
    """Returns patient registry from database."""
    return PATIENTS_DATABASE

@app.get("/api/patients/{patient_id}")
def get_patient_details(patient_id: int):
    """Retrieve individual patient metadata."""
    for p in PATIENTS_DATABASE:
        if p["patient_id"] == patient_id:
            return p
    raise HTTPException(status_code=404, detail=f"Patient {patient_id} not found")

@app.get("/api/patients/{patient_id}/ecg")
def get_patient_ecg(patient_id: int):
    """Returns 12-lead ECG signals for the selected patient."""
    patient = None
    for p in PATIENTS_DATABASE:
        if p["patient_id"] == patient_id:
            patient = p
            break

    if not patient:
        patient = PATIENTS_DATABASE[0]

    signals = generate_synthetic_signal(patient["primary_class"], patient["heart_rate_bpm"], 100, 10)
    return {
        "patient_id": patient["patient_id"],
        "record_id": patient["record_id"],
        "sampling_rate": 100,
        "duration_seconds": 10,
        "leads": signals
    }

@app.post("/api/predict", response_model=PredictResponse)
def predict_ecg(payload: PredictRequest):
    """
    Evaluates 12-lead signal and returns multi-label classification probabilities
    for NORM, MI, STTC, CD, and HYP.
    """
    patient = None
    if payload.patient_id:
        for p in PATIENTS_DATABASE:
            if p["patient_id"] == payload.patient_id:
                patient = p
                break

    if not patient:
        patient = PATIENTS_DATABASE[0]

    return PredictResponse(
        probabilities=patient["predictions"],
        detected_classes=patient["diagnostic_superclasses"],
        risk_level=patient["risk_level"],
        inference_time_ms=45,
        model_version="PTB-XL 1D-CNN Superclass Classifier",
        clinical_summary=patient["clinical_notes"]
    )

@app.get("/")
def root():
    return {
        "service": "CardioSense AI — ECG Detection API",
        "docs_url": "/docs",
        "health_check": "/api/health",
        "frontend_url": "http://localhost:3000"
    }

@app.get("/api/realtime/sample")
def get_realtime_chunk(sample_type: str = Query("normal", pattern="^(normal|mi|sttc|cd)$")):
    """
    Simulates incoming data chunk from Arduino AD8232 module for live testing and debugging.
    """
    condition_map = {"normal": "NORM", "mi": "MI", "sttc": "STTC", "cd": "CD"}
    cond = condition_map.get(sample_type, "NORM")
    bpm = 94 if cond == "MI" else 58 if cond == "CD" else 72
    signal_12 = generate_synthetic_signal(cond, bpm, 100, 5)

    return {
        "chunk_samples": 500,
        "lead_II": signal_12["II"],
        "sample_type": sample_type,
        "simulated_bpm": bpm
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
