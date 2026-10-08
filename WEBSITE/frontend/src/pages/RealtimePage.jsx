import React, { useState, useEffect, useRef } from 'react';
import { generate12LeadECG, DIAGNOSTIC_CLASSES } from '../data/mockPatients';

export default function RealtimePage() {
  const [isStreaming, setIsStreaming] = useState(true);
  const [selectedSignalType, setSelectedSignalType] = useState('NORM');
  const [heartRate, setHeartRate] = useState(72);
  const [samplingRate] = useState(100);
  const windowDurationSec = 4.5;
  const bufferTargetSamples = Math.round(windowDurationSec * samplingRate);

  const [bufferProgress, setBufferProgress] = useState(0);
  const [lastPrediction, setLastPrediction] = useState(null);
  const [predictionHistory, setPredictionHistory] = useState([]);
  const [sampleCounter, setSampleCounter] = useState(0);

  const canvasRef = useRef(null);
  const streamTimerRef = useRef(null);
  const bufferRef = useRef([]);

  const signalSources = useRef({
    NORM: generate12LeadECG('NORM', 72, 100, 30)['II'],
    MI: generate12LeadECG('MI', 94, 100, 30)['II'],
    STTC: generate12LeadECG('STTC', 82, 100, 30)['II'],
    CD: generate12LeadECG('CD', 58, 100, 30)['II']
  });

  // Stream at 100 Hz (10 samples per 100ms tick)
  useEffect(() => {
    if (!isStreaming) {
      if (streamTimerRef.current) clearInterval(streamTimerRef.current);
      return;
    }

    streamTimerRef.current = setInterval(() => {
      setSampleCounter((prevIndex) => {
        const source = signalSources.current[selectedSignalType] || signalSources.current.NORM;
        const newSamples = [];
        for (let i = 0; i < 10; i++) {
          const idx = (prevIndex + i) % source.length;
          newSamples.push(source[idx] + (Math.random() - 0.5) * 0.02);
        }

        bufferRef.current = [...bufferRef.current, ...newSamples];
        if (bufferRef.current.length > bufferTargetSamples * 2) {
          bufferRef.current = bufferRef.current.slice(-bufferTargetSamples * 2);
        }

        const prog = Math.min(100, (bufferRef.current.length / bufferTargetSamples) * 100);
        setBufferProgress(prog);

        if (bufferRef.current.length >= bufferTargetSamples && (prevIndex % bufferTargetSamples < 10)) {
          triggerInference(selectedSignalType);
        }

        return prevIndex + 10;
      });
    }, 100);

    return () => { if (streamTimerRef.current) clearInterval(streamTimerRef.current); };
  }, [isStreaming, selectedSignalType]);

  const triggerInference = (type) => {
    const ts = new Date().toLocaleTimeString();
    let probs, cls, risk, msg;

    if (type === 'MI') {
      cls = 'MI'; risk = 'Critical';
      probs = { NORM: 0.04, MI: 0.95, STTC: 0.84, CD: 0.11, HYP: 0.06 };
      msg = 'ST elevation and hyperacute T waves detected. Acute STEMI pattern.';
      setHeartRate(94);
    } else if (type === 'STTC') {
      cls = 'STTC'; risk = 'Moderate';
      probs = { NORM: 0.11, MI: 0.24, STTC: 0.89, CD: 0.14, HYP: 0.36 };
      msg = 'Inverted T-waves and ST depression detected. Ischemic pattern.';
      setHeartRate(82);
    } else if (type === 'CD') {
      cls = 'CD'; risk = 'Moderate';
      probs = { NORM: 0.12, MI: 0.09, STTC: 0.22, CD: 0.93, HYP: 0.27 };
      msg = 'Widened QRS (>120 ms). Conduction delay with bradycardia.';
      setHeartRate(58);
    } else {
      cls = 'NORM'; risk = 'Standard';
      probs = { NORM: 0.96, MI: 0.02, STTC: 0.03, CD: 0.03, HYP: 0.02 };
      msg = 'Normal sinus rhythm. Standard repolarization verified.';
      setHeartRate(72);
    }

    const result = { timestamp: ts, detectedClass: cls, risk, message: msg, confidence: Math.round(probs[cls] * 100), probabilities: probs };
    setLastPrediction(result);
    setPredictionHistory((prev) => [result, ...prev.slice(0, 6)]);
  };

  // Canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = '#18202c'; ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 25) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = 0; y < h; y += 25) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

    // Midline
    ctx.strokeStyle = '#253346'; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2); ctx.stroke();
    ctx.setLineDash([]);

    // Waveform
    const buf = bufferRef.current.slice(-600);
    if (buf.length < 2) return;
    ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 1.8; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.beginPath();
    const cy = h / 2, sy = h / 3.4, sx = w / 600;
    buf.forEach((v, i) => { const x = i * sx, y = cy - v * sy; i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); });
    ctx.stroke();

    // Head marker
    ctx.fillStyle = '#7dd3fc';
    ctx.beginPath();
    ctx.arc(buf.length * sx, cy - buf[buf.length - 1] * sy, 3, 0, 2 * Math.PI);
    ctx.fill();
  }, [sampleCounter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-hairline)', paddingBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1.125rem', fontWeight: '600', letterSpacing: '-0.02em' }}>
            Real-Time Stream
          </h2>
          <div className="tech-label" style={{ marginTop: '2px' }}>
            ARDUINO AD8232 · 4.5s INFERENCE CYCLES
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', background: 'var(--bg-surface)', border: '1px solid var(--border-hairline)', padding: '0.3rem 0.5rem', borderRadius: 'var(--radius-sm)' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isStreaming ? 'var(--status-normal)' : 'var(--status-warning)' }} />
            <span className="mono-metric" style={{ fontSize: '0.625rem', color: 'var(--text-secondary)' }}>
              {isStreaming ? 'STREAMING' : 'PAUSED'}
            </span>
          </div>
          <button className={`btn-control btn-control-sm ${isStreaming ? 'btn-control-secondary' : 'btn-control-primary'}`}
            onClick={() => setIsStreaming(!isStreaming)}>
            {isStreaming ? 'Pause' : 'Resume'}
          </button>
        </div>
      </div>

      {/* Oscilloscope */}
      <div className="data-panel" style={{ padding: '0', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
        <div style={{ padding: '0.5rem 1rem', background: '#090d16', borderBottom: '1px solid #1a2230', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="mono-metric" style={{ fontSize: '0.6875rem', color: '#7dd3fc', fontWeight: '600' }}>LEAD II</span>
            <span style={{ fontSize: '0.625rem', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>{samplingRate} Hz</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
            <span className="tech-label" style={{ color: '#94a3b8' }}>HR</span>
            <span className="mono-metric" style={{ fontSize: '1.125rem', fontWeight: '700', color: '#fff' }}>{heartRate}</span>
            <span style={{ fontSize: '0.625rem', color: '#94a3b8' }}>bpm</span>
          </div>
        </div>

        <div className="instrument-viewport" style={{ height: '280px', borderRadius: 0, border: 'none' }}>
          <canvas ref={canvasRef} width={900} height={280} style={{ width: '100%', height: '100%', display: 'block' }} />
        </div>

        {/* Buffer bar */}
        <div style={{ padding: '0.5rem 1rem', background: 'var(--bg-surface)', borderTop: '1px solid var(--border-hairline)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.625rem', color: 'var(--text-secondary)', marginBottom: '3px' }}>
              <span className="tech-label">4.5s SLIDING BUFFER</span>
              <span className="mono-metric">{Math.min(bufferTargetSamples, bufferRef.current.length)}/{bufferTargetSamples} ({Math.round(bufferProgress)}%)</span>
            </div>
            <div style={{ height: '3px', background: 'var(--bg-subtle)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ width: `${bufferProgress}%`, height: '100%', background: 'var(--brand-primary)', transition: 'width 0.1s linear' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Signal Selector */}
      <div className="data-panel" style={{ boxShadow: 'var(--shadow-card)' }}>
        <div className="data-panel-header">
          <div>
            <div className="data-panel-title">Signal Injector</div>
            <div className="tech-label" style={{ marginTop: '2px' }}>TEST MODE · SIMULATED CONDITIONS</div>
          </div>
        </div>
        <div className="data-panel-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
            {[
              { id: 'NORM', label: 'Normal Sinus', desc: '72 bpm' },
              { id: 'MI', label: 'Acute STEMI', desc: '94 bpm · ST↑' },
              { id: 'STTC', label: 'Ischemic ST/T', desc: '82 bpm · T↓' },
              { id: 'CD', label: 'Conduction Delay', desc: '58 bpm · Wide QRS' }
            ].map((mode) => (
              <button key={mode.id}
                onClick={() => { setSelectedSignalType(mode.id); triggerInference(mode.id); }}
                className={`btn-control ${selectedSignalType === mode.id ? 'btn-control-primary' : 'btn-control-secondary'}`}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '0.5rem 0.75rem', gap: '2px' }}
              >
                <span style={{ fontWeight: '600', fontSize: '0.75rem' }}>{mode.label}</span>
                <span style={{ fontSize: '0.625rem', color: selectedSignalType === mode.id ? '#cbd5e1' : 'var(--text-muted)' }}>{mode.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results & Log — side by side */}
      <div className="workspace-grid">
        {/* Latest prediction */}
        <div className="data-panel" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="data-panel-header">
            <div>
              <div className="data-panel-title">Latest Prediction</div>
              <div className="tech-label" style={{ marginTop: '2px' }}>MODEL OUTPUT</div>
            </div>
            {lastPrediction && (
              <span className={`clinical-badge ${lastPrediction.risk === 'Critical' ? 'clinical-badge-critical' : lastPrediction.risk === 'Moderate' ? 'clinical-badge-warning' : 'clinical-badge-normal'}`}>
                {lastPrediction.detectedClass} · {lastPrediction.confidence}%
              </span>
            )}
          </div>
          <div className="data-panel-body">
            {lastPrediction ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{
                  padding: '0.75rem', borderRadius: 'var(--radius-sm)',
                  background: lastPrediction.risk === 'Critical' ? 'var(--status-critical-bg)' : lastPrediction.risk === 'Moderate' ? 'var(--status-warning-bg)' : 'var(--status-normal-bg)',
                  border: `1px solid ${lastPrediction.risk === 'Critical' ? 'var(--status-critical-border)' : lastPrediction.risk === 'Moderate' ? 'var(--status-warning-border)' : 'var(--status-normal-border)'}`
                }}>
                  <div style={{ fontWeight: '600', fontSize: '0.8125rem', color: lastPrediction.risk === 'Critical' ? 'var(--status-critical)' : lastPrediction.risk === 'Moderate' ? 'var(--status-warning)' : 'var(--status-normal)', marginBottom: '0.125rem' }}>
                    {lastPrediction.detectedClass === 'NORM' ? 'Normal Rhythm' : `Flagged: ${lastPrediction.detectedClass}`}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>{lastPrediction.message}</div>
                  <div className="mono-metric" style={{ fontSize: '0.625rem', color: 'var(--text-muted)', marginTop: '0.375rem' }}>
                    {lastPrediction.timestamp}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  <div className="tech-label">PROBABILITIES</div>
                  {DIAGNOSTIC_CLASSES.map((c) => {
                    const pct = Math.round((lastPrediction.probabilities?.[c.code] || 0) * 100);
                    return (
                      <div key={c.code}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.625rem', marginBottom: '2px' }}>
                          <span className="mono-metric"><strong>{c.code}</strong> — {c.name}</span>
                          <span className="mono-metric">{pct}%</span>
                        </div>
                        <div style={{ height: '3px', background: 'var(--bg-subtle)', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: 'var(--brand-primary)' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textAlign: 'center', padding: '1.5rem 0', fontFamily: 'var(--font-mono)' }}>
                Buffering initial 4.5s window...
              </div>
            )}
          </div>
        </div>

        {/* Audit Log */}
        <div className="data-panel" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="data-panel-header">
            <div>
              <div className="data-panel-title">Inference Log</div>
              <div className="tech-label" style={{ marginTop: '2px' }}>HISTORY</div>
            </div>
            <span className="mono-metric" style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>
              {predictionHistory.length} events
            </span>
          </div>
          <div className="data-panel-body" style={{ maxHeight: '300px', overflowY: 'auto', padding: '0.375rem 1rem' }}>
            {predictionHistory.length === 0 ? (
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', padding: '1rem 0', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
                No events yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {predictionHistory.map((item, idx) => (
                  <div key={idx} style={{
                    padding: '0.375rem 0',
                    borderBottom: idx < predictionHistory.length - 1 ? '1px solid var(--border-hairline)' : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <span className="mono-metric" style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>{item.timestamp}</span>
                        <span style={{ fontWeight: '600', fontSize: '0.6875rem' }}>{item.detectedClass}</span>
                      </div>
                      <div style={{ fontSize: '0.625rem', color: 'var(--text-secondary)' }}>
                        {item.confidence}% · {item.risk}
                      </div>
                    </div>
                    <span className={`clinical-badge ${item.risk === 'Critical' ? 'clinical-badge-critical' : item.risk === 'Moderate' ? 'clinical-badge-warning' : 'clinical-badge-normal'}`}>
                      {item.detectedClass}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
