// Realistic PTB-XL Clinical Dataset Records & 12-Lead Signal Synthesizer

export const LEADS = ['I', 'II', 'III', 'aVR', 'aVL', 'aVF', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6'];

export const DIAGNOSTIC_CLASSES = [
  { code: 'NORM', name: 'Normal ECG', desc: 'Normal sinus rhythm, standard conduction & repolarization', color: '#10b981' },
  { code: 'MI', name: 'Myocardial Infarction', desc: 'Ischemic necrosis, ST-elevation / pathological Q waves', color: '#ef4444' },
  { code: 'STTC', name: 'ST/T Changes', desc: 'Non-specific repolarization abnormalities, T-wave inversion', color: '#f59e0b' },
  { code: 'CD', name: 'Conduction Disturbance', desc: 'Bundle branch blocks, fascicular blocks, prolonged PR/QRS', color: '#0284c7' },
  { code: 'HYP', name: 'Hypertrophy', desc: 'Left or right ventricular voltage hypertrophy', color: '#8b5cf6' }
];

// Helper to generate realistic 10-second 100Hz 12-lead signal (1000 points per lead)
export function generate12LeadECG(condition = 'NORM', bpm = 75, samplingRate = 100, durationSec = 10) {
  const totalSamples = samplingRate * durationSec;
  const rrInterval = (60 / bpm) * samplingRate; // samples per beat
  const signals = {};

  LEADS.forEach((lead, leadIdx) => {
    signals[lead] = new Array(totalSamples).fill(0);
  });

  // Relative lead amplitude multipliers (approximate anatomical projections)
  const leadScales = {
    'I': 0.8, 'II': 1.1, 'III': 0.7,
    'aVR': -0.9, 'aVL': 0.5, 'aVF': 0.9,
    'V1': -0.6, 'V2': 0.7, 'V3': 1.2, 'V4': 1.4, 'V5': 1.1, 'V6': 0.8
  };

  const isMI = condition === 'MI';
  const isSTTC = condition === 'STTC';
  const isCD = condition === 'CD';
  const isHYP = condition === 'HYP';

  for (let sample = 0; sample < totalSamples; sample++) {
    const phaseInBeat = (sample % rrInterval) / rrInterval; // 0 to 1 inside cardiac cycle
    const t = phaseInBeat * (60 / bpm); // time in seconds within beat

    // Baseline slight respiratory wander (0.15Hz)
    const wander = 0.04 * Math.sin(2 * Math.PI * 0.15 * (sample / samplingRate));

    // P-wave (Atrial depolarization: ~0.08s - 0.18s)
    let pWave = 0;
    if (t > 0.08 && t < 0.18) {
      pWave = 0.15 * Math.sin(Math.PI * (t - 0.08) / 0.10);
    }

    // PR segment baseline: flat

    // QRS complex (Ventricular depolarization)
    let qrs = 0;
    const qrsStart = 0.22;
    const qrsWidth = isCD ? 0.14 : 0.08; // widened QRS for conduction disturbance

    if (t >= qrsStart && t <= qrsStart + qrsWidth) {
      const qrsProgress = (t - qrsStart) / qrsWidth;
      if (qrsProgress < 0.2) {
        // Q wave (prominent deep Q in MI)
        qrs = isMI ? -0.35 : -0.08;
      } else if (qrsProgress < 0.6) {
        // R wave peak (amplified in hypertrophy)
        const hypMultiplier = isHYP ? 1.6 : 1.0;
        qrs = 1.2 * hypMultiplier * Math.sin(Math.PI * (qrsProgress - 0.2) / 0.4);
      } else {
        // S wave
        qrs = -0.25 * Math.sin(Math.PI * (qrsProgress - 0.6) / 0.4);
      }
    }

    // ST segment & T-wave (Ventricular repolarization: ~0.32s - 0.55s)
    let stSegment = 0;
    let tWave = 0;

    if (t >= qrsStart + qrsWidth && t < 0.36) {
      // ST elevation for MI (classic STEMI tombstones in anterior leads)
      stSegment = isMI ? 0.32 : 0.02;
    }

    if (t >= 0.36 && t < 0.54) {
      const tProgress = (t - 0.36) / 0.18;
      if (isSTTC) {
        // Inverted T-wave for STTC ischemia
        tWave = -0.28 * Math.sin(Math.PI * tProgress);
      } else if (isMI) {
        // Hyperacute peaked T-wave or elevated junction
        tWave = 0.45 * Math.sin(Math.PI * tProgress);
      } else {
        // Normal upright T-wave
        tWave = 0.24 * Math.sin(Math.PI * tProgress);
      }
    }

    // Base voltage combine
    const rawVal = wander + pWave + qrs + stSegment + tWave;

    // Distribute across 12 leads with anatomical projection + subtle Gaussian-like noise
    LEADS.forEach((lead) => {
      const scale = leadScales[lead] || 1.0;
      const noise = (Math.random() - 0.5) * 0.02;
      signals[lead][sample] = Number((rawVal * scale + noise).toFixed(4));
    });
  }

  return signals;
}

export const MOCK_PATIENTS = [
  {
    patient_id: 14022,
    record_id: '00001_lr',
    name: 'Eleanor Vance',
    age: 64,
    sex: 'Female',
    weight_kg: 68,
    height_cm: 162,
    heart_rate_bpm: 72,
    recorded_date: '2026-09-21 09:15',
    strat_fold: 10,
    status: 'Flagged - Urgent',
    risk_level: 'High',
    primary_class: 'MI',
    diagnostic_superclasses: ['MI', 'STTC'],
    clinical_notes: 'Patient presented with acute retrosternal chest tightness radiating to left jaw. ECG reveals marked ST elevations in anterior precordial leads (V2-V4) consistent with acute STEMI.',
    sc_codes: { 'AMI': 100.0, 'STTC': 80.0, 'SR': 100.0 },
    predictions: {
      NORM: 0.04,
      MI: 0.94,
      STTC: 0.81,
      CD: 0.12,
      HYP: 0.08
    }
  },
  {
    patient_id: 18239,
    record_id: '00045_lr',
    name: 'David Kim',
    age: 38,
    sex: 'Male',
    weight_kg: 74,
    height_cm: 178,
    heart_rate_bpm: 66,
    recorded_date: '2026-09-23 11:30',
    strat_fold: 10,
    status: 'Normal',
    risk_level: 'Low',
    primary_class: 'NORM',
    diagnostic_superclasses: ['NORM'],
    clinical_notes: 'Routine pre-operative cardiac clearance. Normal sinus rhythm, normal axis, narrow QRS complexes, no ST-T abnormalities identified.',
    sc_codes: { 'NORM': 100.0, 'SR': 100.0 },
    predictions: {
      NORM: 0.97,
      MI: 0.01,
      STTC: 0.03,
      CD: 0.02,
      HYP: 0.01
    }
  },
  {
    patient_id: 11204,
    record_id: '00108_lr',
    name: 'Marcus Brody',
    age: 71,
    sex: 'Male',
    weight_kg: 82,
    height_cm: 175,
    heart_rate_bpm: 58,
    recorded_date: '2026-09-24 14:10',
    strat_fold: 9,
    status: 'Under Review',
    risk_level: 'Moderate',
    primary_class: 'CD',
    diagnostic_superclasses: ['CD'],
    clinical_notes: 'History of syncope and dizziness on exertion. Tracing demonstrates broadened QRS (>125ms), notched R-waves in I and aVL characteristic of Left Bundle Branch Block (LBBB).',
    sc_codes: { 'LBBB': 100.0, 'CD': 100.0 },
    predictions: {
      NORM: 0.08,
      MI: 0.15,
      STTC: 0.22,
      CD: 0.91,
      HYP: 0.31
    }
  },
  {
    patient_id: 16901,
    record_id: '00320_lr',
    name: 'Sophia Patel',
    age: 59,
    sex: 'Female',
    weight_kg: 62,
    height_cm: 158,
    heart_rate_bpm: 84,
    recorded_date: '2026-09-25 08:45',
    strat_fold: 10,
    status: 'Flagged - Review',
    risk_level: 'Moderate',
    primary_class: 'STTC',
    diagnostic_superclasses: ['STTC', 'HYP'],
    clinical_notes: 'Chronic hypertension (155/95 mmHg). Deep S-wave in V1 plus tall R-wave in V5 satisfying Sokolow-Lyon criteria for Left Ventricular Hypertrophy, with asymmetric T-wave inversions (strain pattern).',
    sc_codes: { 'LVH': 90.0, 'STTC': 85.0 },
    predictions: {
      NORM: 0.09,
      MI: 0.18,
      STTC: 0.88,
      CD: 0.14,
      HYP: 0.82
    }
  },
  {
    patient_id: 15477,
    record_id: '00412_lr',
    name: 'Arthur Pendelton',
    age: 67,
    sex: 'Male',
    weight_kg: 89,
    height_cm: 181,
    heart_rate_bpm: 76,
    recorded_date: '2026-09-25 15:20',
    strat_fold: 8,
    status: 'Normal',
    risk_level: 'Low',
    primary_class: 'NORM',
    diagnostic_superclasses: ['NORM'],
    clinical_notes: 'Annual executive physical examination. Clear waveform morphology, symmetric upright T-waves in limb leads, standard PR interval of 150ms.',
    sc_codes: { 'NORM': 100.0 },
    predictions: {
      NORM: 0.93,
      MI: 0.02,
      STTC: 0.05,
      CD: 0.04,
      HYP: 0.03
    }
  }
];
