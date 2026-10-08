import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LEADS, DIAGNOSTIC_CLASSES } from '../data/mockPatients';
import { fetchPatients, fetchPatientECG, runPrediction } from '../services/api';

const viewVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15, ease: 'easeIn' } }
};

// Single Lead Canvas
function SingleLeadCanvas({ ecgData, selectedLead }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!ecgData || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Grid
    ctx.strokeStyle = '#1a2230';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 25) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = 0; y < height; y += 25) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }

    // Zero line
    ctx.strokeStyle = '#273449';
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(0, height / 2); ctx.lineTo(width, height / 2); ctx.stroke();
    ctx.setLineDash([]);

    // Waveform
    const signal = ecgData.leads[selectedLead];
    if (!signal?.length) return;

    ctx.strokeStyle = '#38bdf8';
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
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
  }, [ecgData, selectedLead]);

  return <canvas ref={canvasRef} width={780} height={280} style={{ width: '100%', height: '100%', display: 'block' }} />;
}

// 12-Lead Canvas
function MultiLeadCanvas({ ecgData }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ecgData || !ref.current) return;
    const canvas = ref.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const cols = 4, rows = 3;
    const cellW = width / cols, cellH = height / rows;
    const order = [['I','aVR','V1','V4'],['II','aVL','V2','V5'],['III','aVF','V3','V6']];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const lead = order[r][c];
        const ox = c * cellW, oy = r * cellH;

        ctx.strokeStyle = '#1e2838';
        ctx.lineWidth = 1;
        ctx.strokeRect(ox, oy, cellW, cellH);

        ctx.font = '600 10px IBM Plex Mono, monospace';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(lead, ox + 6, oy + 14);

        const sig = ecgData.leads[lead];
        if (sig) {
          const slice = sig.slice(0, 250);
          const cy = oy + cellH / 2;
          const sy = cellH / 3.6;
          const sx = cellW / slice.length;
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          slice.forEach((v, i) => {
            const x = ox + i * sx, y = cy - v * sy;
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
          });
          ctx.stroke();
        }
      }
    }
  }, [ecgData]);

  return <canvas ref={ref} width={780} height={360} style={{ width: '100%', height: '100%', display: 'block' }} />;
}

export default function DashboardPage() {
  const [subView, setSubView] = useState('registry');
  const [patients, setPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState('ALL');

  const [selectedPatient, setSelectedPatient] = useState(null);
  const [ecgData, setEcgData] = useState(null);
  const [loadingECG, setLoadingECG] = useState(false);
  const [selectedLead, setSelectedLead] = useState('II');
  const [viewMode, setViewMode] = useState('single');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  useEffect(() => {
    async function load() {
      setLoadingPatients(true);
      const res = await fetchPatients();
      setPatients(res.data);
      setLoadingPatients(false);
    }
    load();
  }, []);

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

  const handleRunInference = async () => {
    if (!selectedPatient || !ecgData) return;
    setIsAnalyzing(true);
    const result = await runPrediction(selectedPatient.patient_id, ecgData.leads);
    setAnalysisResult(result);
    setIsAnalyzing(false);
  };

  const filteredPatients = patients.filter((p) => {
    const q = searchQuery.toLowerCase();
    const match = p.name.toLowerCase().includes(q) || String(p.patient_id).includes(q) || p.record_id.toLowerCase().includes(q);
    return filterClass === 'ALL' ? match : match && p.diagnostic_superclasses.includes(filterClass);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* Page Header & Tab Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-hairline)', paddingBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {subView === 'detect' && (
            <button className="btn-control btn-control-secondary btn-control-sm" onClick={() => setSubView('registry')}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              Back
            </button>
          )}
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: '600', letterSpacing: '-0.02em' }}>
              {subView === 'registry' ? 'Patient Registry' : selectedPatient?.name}
            </h2>
            <div className="tech-label" style={{ marginTop: '2px' }}>
              {subView === 'registry' ? 'PTB-XL DATABASE' : `#${selectedPatient?.patient_id} • ${selectedPatient?.record_id} • FOLD ${selectedPatient?.strat_fold}`}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.25rem' }}>
          <button
            className={`btn-control btn-control-sm ${subView === 'registry' ? 'btn-control-primary' : 'btn-control-secondary'}`}
            onClick={() => setSubView('registry')}
          >
            Registry
          </button>
          <button
            className={`btn-control btn-control-sm ${subView === 'detect' ? 'btn-control-primary' : 'btn-control-secondary'}`}
            onClick={() => {
              if (!selectedPatient && patients.length > 0) handleSelectPatient(patients[0]);
              else setSubView('detect');
            }}
          >
            Analysis
          </button>
        </div>
      </div>

      {/* Sub-views */}
      <AnimatePresence mode="wait">

        {/* ── REGISTRY VIEW ── */}
        {subView === 'registry' && (
          <motion.div key="registry" variants={viewVariants} initial="initial" animate="animate" exit="exit"
            style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
          >
            {/* Summary Metrics Bar */}
            <div className="metrics-grid">
              <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-surface)', border: '1px solid var(--border-hairline)', borderRadius: 'var(--radius-sm)' }}>
                <div className="tech-label">TOTAL RECORDS</div>
                <div className="mono-metric" style={{ fontSize: '1.375rem', fontWeight: '600', marginTop: '0.125rem' }}>{patients.length}</div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>PTB-XL subset</div>
              </div>
              <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-surface)', border: '1px solid var(--border-hairline)', borderRadius: 'var(--radius-sm)' }}>
                <div className="tech-label">CRITICAL</div>
                <div className="mono-metric" style={{ fontSize: '1.375rem', fontWeight: '600', color: 'var(--status-critical)', marginTop: '0.125rem' }}>
                  {patients.filter(p => p.risk_level === 'High').length}
                </div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>High priority</div>
              </div>
              <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-surface)', border: '1px solid var(--border-hairline)', borderRadius: 'var(--radius-sm)' }}>
                <div className="tech-label">NORMAL</div>
                <div className="mono-metric" style={{ fontSize: '1.375rem', fontWeight: '600', color: 'var(--status-normal)', marginTop: '0.125rem' }}>
                  {patients.filter(p => p.diagnostic_superclasses.includes('NORM')).length}
                </div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Sinus rhythm</div>
              </div>
              <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-surface)', border: '1px solid var(--border-hairline)', borderRadius: 'var(--radius-sm)' }}>
                <div className="tech-label">RESOLUTION</div>
                <div className="mono-metric" style={{ fontSize: '1.375rem', fontWeight: '600', marginTop: '0.125rem' }}>100 Hz</div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>12-lead × 1000 pts</div>
              </div>
            </div>

            {/* Search & Filter Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <input
                type="text"
                placeholder="Search patient, ID, or record..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '280px', maxWidth: '100%',
                  padding: '0.4rem 0.75rem', fontSize: '0.8125rem',
                  fontFamily: 'var(--font-sans)', background: 'var(--bg-surface)',
                  border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-sm)',
                  outline: 'none', color: 'var(--text-primary)'
                }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span className="tech-label" style={{ marginRight: '0.25rem' }}>FILTER:</span>
                {['ALL', 'NORM', 'MI', 'STTC', 'CD', 'HYP'].map((cls) => (
                  <button key={cls} onClick={() => setFilterClass(cls)}
                    className={`btn-control btn-control-sm ${filterClass === cls ? 'btn-control-primary' : 'btn-control-secondary'}`}
                    style={{ minWidth: '36px' }}
                  >
                    {cls}
                  </button>
                ))}
              </div>
            </div>

            {/* Patient Table */}
            <div className="data-panel table-scroll" style={{ boxShadow: 'var(--shadow-card)' }}>
              <table className="clinical-table">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Demographics</th>
                    <th>Record</th>
                    <th>HR</th>
                    <th>Classes</th>
                    <th>Risk</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.map((p) => (
                    <tr key={p.patient_id}>
                      <td>
                        <div style={{ fontWeight: '600' }}>{p.name}</div>
                        <div className="mono-metric" style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>#{p.patient_id}</div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                        {p.age}y · {p.sex} · {p.weight_kg}kg
                      </td>
                      <td>
                        <div className="mono-metric" style={{ fontSize: '0.75rem' }}>{p.record_id}</div>
                        <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>{p.recorded_date}</div>
                      </td>
                      <td>
                        <span className="mono-metric" style={{ fontWeight: '600' }}>{p.heart_rate_bpm}</span>
                        <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)', marginLeft: '2px' }}>bpm</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                          {p.diagnostic_superclasses.map((cls) => (
                            <span key={cls} className={`clinical-badge ${cls === 'NORM' ? 'clinical-badge-normal' : cls === 'MI' ? 'clinical-badge-critical' : 'clinical-badge-warning'}`}>
                              {cls}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <span className={`clinical-badge ${p.risk_level === 'High' ? 'clinical-badge-critical' : p.risk_level === 'Moderate' ? 'clinical-badge-warning' : 'clinical-badge-normal'}`}>
                          {p.risk_level}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn-control btn-control-secondary btn-control-sm" onClick={() => handleSelectPatient(p)}>
                          Analyze →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* ── DETECT / ANALYSIS VIEW ── */}
        {subView === 'detect' && selectedPatient && (
          <motion.div key="detect" variants={viewVariants} initial="initial" animate="animate" exit="exit"
            style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
          >
            {/* Patient Info Ribbon */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0.875rem 1.25rem', background: 'var(--bg-surface)',
              border: '1px solid var(--border-hairline)', borderRadius: 'var(--radius-md)',
              flexWrap: 'wrap', gap: '0.75rem', boxShadow: 'var(--shadow-subtle)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '0.9375rem' }}>
                    {selectedPatient.name}
                    <span className="mono-metric" style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>#{selectedPatient.patient_id}</span>
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>
                    {selectedPatient.age}y · {selectedPatient.sex} · {selectedPatient.record_id}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '1.5rem' }}>
                  <div>
                    <div className="tech-label">HR</div>
                    <div className="mono-metric" style={{ fontSize: '1rem', fontWeight: '600' }}>
                      {selectedPatient.heart_rate_bpm} <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>bpm</span>
                    </div>
                  </div>
                  <div>
                    <div className="tech-label">RISK</div>
                    <span className={`clinical-badge ${selectedPatient.risk_level === 'High' ? 'clinical-badge-critical' : selectedPatient.risk_level === 'Moderate' ? 'clinical-badge-warning' : 'clinical-badge-normal'}`}>
                      {selectedPatient.risk_level}
                    </span>
                  </div>
                </div>
              </div>
              <button className="btn-control btn-control-primary" onClick={handleRunInference} disabled={isAnalyzing}>
                {isAnalyzing ? 'Running...' : 'Run Inference'}
              </button>
            </div>

            {/* Main 2-Column Layout: ECG Viewer + Results */}
            <div className="workspace-grid">
              {/* Left: ECG Viewer */}
              <div className="data-panel" style={{ display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-card)' }}>
                <div className="data-panel-header">
                  <div>
                    <div className="data-panel-title">ECG Tracings</div>
                    <div className="tech-label" style={{ marginTop: '2px' }}>100 Hz · 10s WINDOW · 1000 SAMPLES</div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button className={`btn-control btn-control-sm ${viewMode === 'single' ? 'btn-control-primary' : 'btn-control-secondary'}`}
                      onClick={() => setViewMode('single')}>Single Lead</button>
                    <button className={`btn-control btn-control-sm ${viewMode === '12lead' ? 'btn-control-primary' : 'btn-control-secondary'}`}
                      onClick={() => setViewMode('12lead')}>12-Lead</button>
                  </div>
                </div>

                <div className="data-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {viewMode === 'single' ? (
                    <>
                      {/* Lead selector */}
                      <div style={{ display: 'flex', gap: '0.2rem', flexWrap: 'wrap' }}>
                        {LEADS.map((ld) => (
                          <button key={ld}
                            className={`btn-control btn-control-sm ${selectedLead === ld ? 'btn-control-primary' : 'btn-control-secondary'}`}
                            style={{ minWidth: '34px', padding: '0.2rem 0.4rem', fontFamily: 'var(--font-mono)' }}
                            onClick={() => setSelectedLead(ld)}
                          >{ld}</button>
                        ))}
                      </div>
                      {/* Canvas */}
                      <div className="instrument-viewport" style={{ height: '280px' }}>
                        <div className="instrument-corner-stamp">
                          {selectedLead} · 25 mm/s · 10 mm/mV
                        </div>
                        <SingleLeadCanvas ecgData={ecgData} selectedLead={selectedLead} />
                      </div>
                    </>
                  ) : (
                    <div className="instrument-viewport" style={{ height: '360px' }}>
                      <div className="instrument-corner-stamp">12-LEAD 3×4 MATRIX</div>
                      <MultiLeadCanvas ecgData={ecgData} />
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Classification Results */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="data-panel" style={{ boxShadow: 'var(--shadow-card)' }}>
                  <div className="data-panel-header">
                    <div>
                      <div className="data-panel-title">Classification</div>
                      <div className="tech-label" style={{ marginTop: '2px' }}>SIGMOID MULTI-LABEL</div>
                    </div>
                    <span className="clinical-badge clinical-badge-neutral">1D-CNN</span>
                  </div>

                  <div className="data-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Dominant result */}
                    <div style={{ padding: '0.75rem', background: 'var(--bg-canvas)', border: '1px solid var(--border-hairline)', borderRadius: 'var(--radius-sm)' }}>
                      <div className="tech-label">PRIMARY DIAGNOSIS</div>
                      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '0.25rem' }}>
                        <span style={{
                          fontSize: '1.125rem', fontWeight: '700', letterSpacing: '-0.02em',
                          color: selectedPatient.primary_class === 'NORM' ? 'var(--status-normal)' : 'var(--status-critical)'
                        }}>
                          {selectedPatient.primary_class} — {DIAGNOSTIC_CLASSES.find(c => c.code === selectedPatient.primary_class)?.name}
                        </span>
                        <span className="mono-metric" style={{ fontSize: '1rem', fontWeight: '600' }}>
                          {Math.round((analysisResult?.probabilities?.[selectedPatient.primary_class] || 0.94) * 100)}%
                        </span>
                      </div>
                    </div>

                    {/* Probability bars */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div className="tech-label">SUPERCLASS PROBABILITIES</div>
                      {DIAGNOSTIC_CLASSES.map((cls) => {
                        const prob = analysisResult?.probabilities?.[cls.code] || 0;
                        const pct = Math.round(prob * 100);
                        const positive = prob >= 0.5;
                        return (
                          <div key={cls.code}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', marginBottom: '2px' }}>
                              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '600' }}>
                                {cls.code} <span style={{ color: 'var(--text-muted)', fontWeight: '400' }}>({cls.name})</span>
                              </span>
                              <span className="mono-metric" style={{ fontWeight: '600', color: positive ? 'var(--status-critical)' : 'var(--text-muted)' }}>
                                {pct}%{positive && ' · DETECTED'}
                              </span>
                            </div>
                            <div style={{ height: '3px', background: 'var(--bg-subtle)', borderRadius: '2px', overflow: 'hidden' }}>
                              <div style={{ width: `${pct}%`, height: '100%', background: positive ? 'var(--brand-primary)' : '#a1a1aa', transition: 'width 0.3s ease' }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Clinical note */}
                    <div style={{ borderTop: '1px solid var(--border-hairline)', paddingTop: '0.75rem' }}>
                      <div className="tech-label" style={{ marginBottom: '0.25rem' }}>INTERPRETATION</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        {analysisResult?.clinical_summary || selectedPatient.clinical_notes}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn-control btn-control-secondary btn-control-sm" style={{ flex: 1 }}
                    onClick={() => alert(`Report for #${selectedPatient.patient_id} exported.`)}>
                    Export Report
                  </button>
                  <button className="btn-control btn-control-secondary btn-control-sm"
                    onClick={() => setSubView('registry')}>
                    Change Patient
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
