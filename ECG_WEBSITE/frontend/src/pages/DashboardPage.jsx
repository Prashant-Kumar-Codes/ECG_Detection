import React, { useState, useEffect, useRef } from 'react';
import { LEADS, DIAGNOSTIC_CLASSES } from '../data/mockPatients';
import { fetchPatients, fetchPatientECG, runPrediction } from '../services/api';

export default function DashboardPage() {
  const [subView, setSubView] = useState('registry'); // 'registry' or 'detect'
  const [patients, setPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState('ALL');

  // Detect Workspace State
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [ecgData, setEcgData] = useState(null);
  const [loadingECG, setLoadingECG] = useState(false);
  const [selectedLead, setSelectedLead] = useState('II');
  const [viewMode, setViewMode] = useState('single'); // 'single' or '12lead'
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  const canvasRef = useRef(null);
  const multiCanvasRef = useRef(null);

  // Ingest patient database on mount
  useEffect(() => {
    async function load() {
      setLoadingPatients(true);
      const res = await fetchPatients();
      setPatients(res.data);
      setLoadingPatients(false);
    }
    load();
  }, []);

  // Select patient and navigate to Detect sub-view
  const handleSelectPatient = async (patient) => {
    setSelectedPatient(patient);
    setSubView('detect');
    setAnalysisResult(null);
    setLoadingECG(true);

    const res = await fetchPatientECG(patient.patient_id);
    setEcgData(res.data);
    setLoadingECG(false);

    setAnalysisResult({
      probabilities: patient.predictions,
      detected_classes: patient.diagnostic_superclasses,
      risk_level: patient.risk_level,
      inference_time_ms: 38,
      model_version: `PTB-XL 1D-CNN (Fold ${patient.strat_fold})`,
      clinical_summary: patient.clinical_notes
    });
  };

  // Re-run inference model
  const handleRunInference = async () => {
    if (!selectedPatient || !ecgData) return;
    setIsAnalyzing(true);
    const result = await runPrediction(selectedPatient.patient_id, ecgData.leads);
    setAnalysisResult(result);
    setIsAnalyzing(false);
  };

  // Single Lead Canvas Rendering (Clinical Instrument Standard)
  useEffect(() => {
    if (subView !== 'detect' || !ecgData || viewMode !== 'single' || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Instrument grid
    const gridSize = 25;
    ctx.strokeStyle = '#1a2230';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Zero-volt reference line
    ctx.strokeStyle = '#273449';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Waveform
    const signal = ecgData.leads[selectedLead];
    if (!signal || signal.length === 0) return;

    ctx.strokeStyle = '#38bdf8'; // Precision medical cyan
    ctx.lineWidth = 1.8;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();

    const centerY = height / 2;
    const scaleY = height / 3.4;
    const stepX = width / signal.length;

    signal.forEach((val, i) => {
      const x = i * stepX;
      const y = centerY - val * scaleY;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    ctx.stroke();
  }, [subView, ecgData, selectedLead, viewMode]);

  // 12-Lead Multi-Grid Rendering (Standard 3x4 Layout)
  useEffect(() => {
    if (subView !== 'detect' || !ecgData || viewMode !== '12lead' || !multiCanvasRef.current) return;
    const canvas = multiCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const cols = 4;
    const rows = 3;
    const cellW = width / cols;
    const cellH = height / rows;

    const leadOrder = [
      ['I', 'aVR', 'V1', 'V4'],
      ['II', 'aVL', 'V2', 'V5'],
      ['III', 'aVF', 'V3', 'V6']
    ];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const leadName = leadOrder[r][c];
        const originX = c * cellW;
        const originY = r * cellH;

        // Cell boundary
        ctx.strokeStyle = '#1e2838';
        ctx.lineWidth = 1;
        ctx.strokeRect(originX, originY, cellW, cellH);

        // Technical lead label
        ctx.font = '600 11px IBM Plex Mono, monospace';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(`LEAD ${leadName}`, originX + 8, originY + 16);

        // Signal slice
        const fullSignal = ecgData.leads[leadName];
        if (fullSignal) {
          const slice = fullSignal.slice(0, 250);
          const centerY = originY + cellH / 2;
          const scaleY = cellH / 3.6;
          const stepX = cellW / slice.length;

          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          slice.forEach((v, idx) => {
            const x = originX + idx * stepX;
            const y = centerY - v * scaleY;
            if (idx === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          });
          ctx.stroke();
        }
      }
    }
  }, [subView, ecgData, viewMode]);

  // Filtering
  const filteredPatients = patients.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(p.patient_id).includes(searchQuery) ||
      p.record_id.toLowerCase().includes(searchQuery.toLowerCase());

    if (filterClass === 'ALL') return matchesSearch;
    return matchesSearch && p.diagnostic_superclasses.includes(filterClass);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* ======================================================== */}
      {/* SPA BREADCRUMB & SUB-VIEW NAVIGATOR                      */}
      {/* ======================================================== */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-hairline)', paddingBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {subView === 'detect' && (
            <button
              className="btn-control btn-control-secondary btn-control-sm"
              onClick={() => setSubView('registry')}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              Return to Registry
            </button>
          )}
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              {subView === 'registry' ? 'Clinical Patient Registry' : `Diagnostic Studio / ${selectedPatient?.name} (ID: #${selectedPatient?.patient_id})`}
            </h2>
            <div className="tech-label" style={{ marginTop: '0.125rem' }}>
              {subView === 'registry' ? 'PTB-XL CLINICAL DATABASE SCHEMA' : `RECORD ${selectedPatient?.record_id} • FOLD ${selectedPatient?.strat_fold}`}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.375rem' }}>
          <button
            className={`btn-control btn-control-sm ${subView === 'registry' ? 'btn-control-primary' : 'btn-control-secondary'}`}
            onClick={() => setSubView('registry')}
          >
            1. Patient Database
          </button>
          <button
            className={`btn-control btn-control-sm ${subView === 'detect' ? 'btn-control-primary' : 'btn-control-secondary'}`}
            onClick={() => {
              if (!selectedPatient && patients.length > 0) handleSelectPatient(patients[0]);
              else setSubView('detect');
            }}
          >
            2. Detect Workspace
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SUB-VIEW 1: PATIENT REGISTRY TABLE                       */}
      {/* ======================================================== */}
      {subView === 'registry' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Open Information Metrics (Instruction #21, #40) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-hairline)' }}>
            <div>
              <div className="tech-label">PATIENT RECORDS</div>
              <div className="mono-metric" style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                {patients.length} active
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>PTB-XL stratified subset</div>
            </div>

            <div>
              <div className="tech-label">PRIORITY CRITICAL</div>
              <div className="mono-metric" style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--status-critical)', marginTop: '0.25rem' }}>
                {patients.filter(p => p.risk_level === 'High').length} flagged
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Acute STEMI / MI indications</div>
            </div>

            <div>
              <div className="tech-label">NORMAL SINUS (NORM)</div>
              <div className="mono-metric" style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--status-normal)', marginTop: '0.25rem' }}>
                {patients.filter(p => p.diagnostic_superclasses.includes('NORM')).length} verified
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Standard repolarization</div>
            </div>

            <div>
              <div className="tech-label">SAMPLING RESOLUTION</div>
              <div className="mono-metric" style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                100 Hz
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>1000 points × 12 leads</div>
            </div>
          </div>

          {/* Search & Class Filter Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ flex: 1, maxWidth: '360px' }}>
              <input
                type="text"
                placeholder="Search patient, ID (#14022), or record..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.45rem 0.75rem',
                  fontSize: '0.8125rem',
                  fontFamily: 'var(--font-sans)',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-strong)',
                  borderRadius: 'var(--radius-sm)',
                  outline: 'none',
                  color: 'var(--text-primary)'
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <span className="tech-label" style={{ marginRight: '0.375rem' }}>SUPERCLASS FILTER:</span>
              {['ALL', 'NORM', 'MI', 'STTC', 'CD', 'HYP'].map((cls) => (
                <button
                  key={cls}
                  onClick={() => setFilterClass(cls)}
                  className={`btn-control btn-control-sm ${filterClass === cls ? 'btn-control-primary' : 'btn-control-secondary'}`}
                  style={{ minWidth: '40px' }}
                >
                  {cls}
                </button>
              ))}
            </div>
          </div>

          {/* Clinical Database Table */}
          <div className="data-panel" style={{ padding: '0', overflow: 'hidden' }}>
            <table className="clinical-table">
              <thead>
                <tr>
                  <th style={{ width: '180px' }}>Patient / Identifier</th>
                  <th style={{ width: '150px' }}>Demographics</th>
                  <th style={{ width: '160px' }}>Record / Date</th>
                  <th style={{ width: '100px' }}>Resting HR</th>
                  <th>Diagnostic Superclasses</th>
                  <th style={{ width: '130px' }}>Clinical Risk</th>
                  <th style={{ width: '130px', textAlign: 'right' }}>Inspection</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map((p) => {
                  const isHigh = p.risk_level === 'High';
                  const isMod = p.risk_level === 'Moderate';

                  return (
                    <tr key={p.patient_id}>
                      <td>
                        <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{p.name}</div>
                        <div className="mono-metric" style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                          ID: #{p.patient_id}
                        </div>
                      </td>

                      <td style={{ color: 'var(--text-secondary)' }}>
                        {p.age}y • {p.sex} • {p.weight_kg}kg
                      </td>

                      <td>
                        <div className="mono-metric" style={{ fontSize: '0.75rem', fontWeight: '500' }}>{p.record_id}</div>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{p.recorded_date}</div>
                      </td>

                      <td>
                        <span className="mono-metric" style={{ fontWeight: '600', fontSize: '0.875rem' }}>{p.heart_rate_bpm}</span>
                        <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginLeft: '3px' }}>BPM</span>
                      </td>

                      <td>
                        <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                          {p.diagnostic_superclasses.map((cls) => (
                            <span
                              key={cls}
                              className={`clinical-badge ${cls === 'NORM' ? 'clinical-badge-normal' : cls === 'MI' ? 'clinical-badge-critical' : 'clinical-badge-warning'}`}
                            >
                              {cls}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td>
                        <span className={`clinical-badge ${isHigh ? 'clinical-badge-critical' : isMod ? 'clinical-badge-warning' : 'clinical-badge-normal'}`}>
                          {p.risk_level}
                        </span>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn-control btn-control-secondary btn-control-sm"
                          onClick={() => handleSelectPatient(p)}
                        >
                          Detect & Analyze
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-VIEW 2: DETECT WORKSPACE (THE MEDICAL INSTRUMENT)    */}
      {/* ======================================================== */}
      {subView === 'detect' && selectedPatient && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          {/* Patient Clinical Dossier Ribbon */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', background: 'var(--bg-surface)', border: '1px solid var(--border-hairline)', borderRadius: 'var(--radius-sm)', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.125rem', fontWeight: '600' }}>{selectedPatient.name}</span>
                  <span className="mono-metric" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    #{selectedPatient.patient_id}
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {selectedPatient.age} yrs • {selectedPatient.sex} • Record: {selectedPatient.record_id} • Strat Fold: {selectedPatient.strat_fold} (Validation)
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
              <div>
                <div className="tech-label">RESTING RATE</div>
                <div className="mono-metric" style={{ fontSize: '1.25rem', fontWeight: '600' }}>
                  {selectedPatient.heart_rate_bpm} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>BPM</span>
                </div>
              </div>

              <div>
                <div className="tech-label">TRIAGE ASSESSMENT</div>
                <span className={`clinical-badge ${selectedPatient.risk_level === 'High' ? 'clinical-badge-critical' : selectedPatient.risk_level === 'Moderate' ? 'clinical-badge-warning' : 'clinical-badge-normal'}`}>
                  {selectedPatient.risk_level} Priority
                </span>
              </div>

              <button
                className="btn-control btn-control-primary"
                onClick={handleRunInference}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? 'Processing Model...' : 'Re-Run Deep Learning Inference'}
              </button>
            </div>
          </div>

          {/* Main Inspection Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.75rem' }}>
            {/* Left: 12-Lead Diagnostic Waveform Viewport */}
            <div className="data-panel" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="data-panel-header">
                <div>
                  <div className="data-panel-title">12-Lead Voltage Tracings</div>
                  <div className="tech-label" style={{ marginTop: '2px' }}>
                    WFDB 100 Hz • 10.0 SECONDS WINDOW • 1000 TIMESTEPS
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.375rem' }}>
                  <button
                    className={`btn-control btn-control-sm ${viewMode === 'single' ? 'btn-control-primary' : 'btn-control-secondary'}`}
                    onClick={() => setViewMode('single')}
                  >
                    Single Lead Focus
                  </button>
                  <button
                    className={`btn-control btn-control-sm ${viewMode === '12lead' ? 'btn-control-primary' : 'btn-control-secondary'}`}
                    onClick={() => setViewMode('12lead')}
                  >
                    12-Lead Matrix
                  </button>
                </div>
              </div>

              <div className="data-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {viewMode === 'single' ? (
                  <>
                    {/* Lead Selector Pill Bar */}
                    <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                      {LEADS.map((ld) => (
                        <button
                          key={ld}
                          className={`btn-control btn-control-sm ${selectedLead === ld ? 'btn-control-primary' : 'btn-control-secondary'}`}
                          style={{ minWidth: '38px', padding: '0.25rem 0.5rem', fontFamily: 'var(--font-mono)' }}
                          onClick={() => setSelectedLead(ld)}
                        >
                          {ld}
                        </button>
                      ))}
                    </div>

                    {/* Single Lead Canvas Viewport */}
                    <div className="instrument-viewport" style={{ height: '320px', width: '100%' }}>
                      <div className="instrument-corner-stamp">
                        LEAD {selectedLead} • 25 mm/s • 10 mm/mV CALIBRATED
                      </div>
                      <canvas
                        ref={canvasRef}
                        width={780}
                        height={320}
                        style={{ width: '100%', height: '100%', display: 'block' }}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    {/* 12-Lead Multi Grid Viewport */}
                    <div className="instrument-viewport" style={{ height: '400px', width: '100%' }}>
                      <div className="instrument-corner-stamp">
                        STANDARD 12-LEAD RHYTHM MATRIX (3×4 CLINICAL VIEW)
                      </div>
                      <canvas
                        ref={multiCanvasRef}
                        width={780}
                        height={400}
                        style={{ width: '100%', height: '100%', display: 'block' }}
                      />
                    </div>
                  </>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  <span>Horizontal Axis: 0.0s – 10.0s (1000 pts)</span>
                  <span>Vertical Calibration: 1.0 mV = 100 vertical units</span>
                </div>
              </div>
            </div>

            {/* Right: Model Inferences & Dominant Result (Instructions #45, #46) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="data-panel">
                <div className="data-panel-header">
                  <div>
                    <div className="data-panel-title">Model Classification</div>
                    <div className="tech-label" style={{ marginTop: '2px' }}>MULTI-LABEL SIGMOID ACTIVATIONS</div>
                  </div>
                  <span className="clinical-badge clinical-badge-neutral" style={{ fontSize: '0.625rem' }}>
                    1D-CNN RESNET
                  </span>
                </div>

                <div className="data-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Dominant Primary Result (Instruction #45) */}
                  <div style={{ padding: '0.875rem', background: 'var(--bg-subtle)', border: '1px solid var(--border-hairline)', borderRadius: 'var(--radius-sm)' }}>
                    <div className="tech-label">DOMINANT PREDICTION</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '0.25rem' }}>
                      <span style={{ fontSize: '1.25rem', fontWeight: '700', letterSpacing: '-0.02em', color: selectedPatient.primary_class === 'NORM' ? 'var(--status-normal)' : 'var(--status-critical)' }}>
                        {selectedPatient.primary_class} — {DIAGNOSTIC_CLASSES.find(c => c.code === selectedPatient.primary_class)?.name}
                      </span>
                      <span className="mono-metric" style={{ fontSize: '1.125rem', fontWeight: '600' }}>
                        {Math.round((analysisResult?.probabilities?.[selectedPatient.primary_class] || 0.94) * 100)}%
                      </span>
                    </div>
                  </div>

                  {/* Multi-Label Probabilities Spectrum */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                    <div className="tech-label">INDEPENDENT SUPERCLASS PROBABILITIES</div>
                    {DIAGNOSTIC_CLASSES.map((cls) => {
                      const prob = analysisResult?.probabilities?.[cls.code] || 0.0;
                      const pct = Math.round(prob * 100);
                      const isPositive = prob >= 0.5;

                      return (
                        <div key={cls.code}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', marginBottom: '0.125rem' }}>
                            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '600' }}>
                              {cls.code} <span style={{ color: 'var(--text-muted)', fontWeight: '400' }}>({cls.name})</span>
                            </span>
                            <span className="mono-metric" style={{ fontWeight: '600', color: isPositive ? 'var(--status-critical)' : 'var(--text-muted)' }}>
                              {pct}% {isPositive && '• DETECTED'}
                            </span>
                          </div>
                          <div style={{ height: '4px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-xs)', overflow: 'hidden' }}>
                            <div
                              style={{
                                width: `${pct}%`,
                                height: '100%',
                                background: isPositive ? 'var(--accent-navy)' : '#a1a1aa'
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Clinical Interpretation Dossier */}
                  <div style={{ borderTop: '1px solid var(--border-hairline)', paddingTop: '1rem' }}>
                    <div className="tech-label" style={{ marginBottom: '0.375rem' }}>CLINICAL INTERPRETATION</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {analysisResult?.clinical_summary || selectedPatient.clinical_notes}
                    </div>
                  </div>
                </div>
              </div>

              {/* Workstation Actions */}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className="btn-control btn-control-secondary btn-control-sm"
                  style={{ flex: 1 }}
                  onClick={() => alert(`Clinical report for Patient #${selectedPatient.patient_id} ready for export.`)}
                >
                  Export Diagnostic Dossier
                </button>
                <button
                  className="btn-control btn-control-secondary btn-control-sm"
                  onClick={() => setSubView('registry')}
                >
                  Select Other Patient
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
