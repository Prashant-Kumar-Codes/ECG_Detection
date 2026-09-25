import React, { useState, useEffect, useRef } from 'react';
import { generate12LeadECG, DIAGNOSTIC_CLASSES } from '../data/mockPatients';

export default function RealtimePage() {
  const [isStreaming, setIsStreaming] = useState(true);
  const [selectedSignalType, setSelectedSignalType] = useState('NORM'); // 'NORM', 'MI', 'STTC', 'CD'
  const [heartRate, setHeartRate] = useState(72);
  const [samplingRate] = useState(100);
  const windowDurationSec = 4.5;
  const bufferTargetSamples = Math.round(windowDurationSec * samplingRate); // 450 samples

  const [bufferProgress, setBufferProgress] = useState(0);
  const [lastPrediction, setLastPrediction] = useState(null);
  const [predictionHistory, setPredictionHistory] = useState([]);
  const [sampleCounter, setSampleCounter] = useState(0);

  const canvasRef = useRef(null);
  const streamTimerRef = useRef(null);
  const bufferRef = useRef([]);

  // Source signals for continuous simulation
  const signalSources = useRef({
    NORM: generate12LeadECG('NORM', 72, 100, 30)['II'],
    MI: generate12LeadECG('MI', 94, 100, 30)['II'],
    STTC: generate12LeadECG('STTC', 82, 100, 30)['II'],
    CD: generate12LeadECG('CD', 58, 100, 30)['II']
  });

  // Stream tick interval: 10 samples every 100ms = 100 Hz
  useEffect(() => {
    if (!isStreaming) {
      if (streamTimerRef.current) clearInterval(streamTimerRef.current);
      return;
    }

    const intervalMs = 100;
    const samplesPerTick = 10;

    streamTimerRef.current = setInterval(() => {
      setSampleCounter((prevIndex) => {
        const sourceArray = signalSources.current[selectedSignalType] || signalSources.current.NORM;
        const newSamples = [];

        for (let i = 0; i < samplesPerTick; i++) {
          const idx = (prevIndex + i) % sourceArray.length;
          // Realistic small ADC quantization noise (Instruction #25)
          const adcNoise = (Math.random() - 0.5) * 0.02;
          newSamples.push(sourceArray[idx] + adcNoise);
        }

        bufferRef.current = [...bufferRef.current, ...newSamples];

        if (bufferRef.current.length > bufferTargetSamples * 2) {
          bufferRef.current = bufferRef.current.slice(-bufferTargetSamples * 2);
        }

        const currentBufLen = bufferRef.current.length;
        const prog = Math.min(100, (currentBufLen / bufferTargetSamples) * 100);
        setBufferProgress(prog);

        if (currentBufLen >= bufferTargetSamples && (prevIndex % bufferTargetSamples < samplesPerTick)) {
          triggerInference(selectedSignalType);
        }

        return prevIndex + samplesPerTick;
      });
    }, intervalMs);

    return () => {
      if (streamTimerRef.current) clearInterval(streamTimerRef.current);
    };
  }, [isStreaming, selectedSignalType]);

  // Model inference trigger on 4.5-sec buffer
  const triggerInference = (currentType) => {
    const timeNow = new Date().toLocaleTimeString();
    let probs = {};
    let detectedClass = 'NORM';
    let risk = 'Low';
    let message = 'Normal Sinus Rhythm. Standard PR interval and narrow QRS complexes.';

    if (currentType === 'MI') {
      detectedClass = 'MI';
      risk = 'Critical';
      probs = { NORM: 0.04, MI: 0.95, STTC: 0.84, CD: 0.11, HYP: 0.06 };
      message = 'ACUTE STEMI FLAG: Significant ST segment elevation and hyperacute T waves detected in lead trace.';
      setHeartRate(94);
    } else if (currentType === 'STTC') {
      detectedClass = 'STTC';
      risk = 'Moderate';
      probs = { NORM: 0.11, MI: 0.24, STTC: 0.89, CD: 0.14, HYP: 0.36 };
      message = 'ISCHEMIA WARNING: Inverted T-waves and ST depression detected across continuous window.';
      setHeartRate(82);
    } else if (currentType === 'CD') {
      detectedClass = 'CD';
      risk = 'Moderate';
      probs = { NORM: 0.12, MI: 0.09, STTC: 0.22, CD: 0.93, HYP: 0.27 };
      message = 'CONDUCTION IMPAIRMENT: Widened QRS complex duration (>120 ms). Bradycardia rhythm.';
      setHeartRate(58);
    } else {
      detectedClass = 'NORM';
      risk = 'Standard';
      probs = { NORM: 0.96, MI: 0.02, STTC: 0.03, CD: 0.03, HYP: 0.02 };
      message = 'Normal Sinus Rhythm. Verified standard repolarization and rhythm consistency.';
      setHeartRate(72);
    }

    const newResult = {
      timestamp: timeNow,
      detectedClass,
      risk,
      message,
      confidence: Math.round(probs[detectedClass] * 100),
      probabilities: probs,
      windowDuration: `${windowDurationSec}s (${bufferTargetSamples} pts)`
    };

    setLastPrediction(newResult);
    setPredictionHistory((prev) => [newResult, ...prev.slice(0, 6)]);
  };

  // Oscilloscope Canvas Rendering (Instruction #25: clean, thin, no neon glow)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Fine dark telemetry grid
    const gridSize = 25;
    ctx.strokeStyle = '#18202c';
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

    // Midline
    ctx.strokeStyle = '#253346';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Rolling Waveform
    const displayWindow = 600;
    const buf = bufferRef.current.slice(-displayWindow);
    if (buf.length < 2) return;

    ctx.strokeStyle = '#38bdf8'; // Precision medical cyan trace
    ctx.lineWidth = 1.8;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();

    const centerY = height / 2;
    const scaleY = height / 3.4;
    const stepX = width / displayWindow;

    buf.forEach((v, i) => {
      const x = i * stepX;
      const y = centerY - v * scaleY;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    ctx.stroke();

    // Subtle phosphor head marker (no heavy neon blur)
    const headX = buf.length * stepX;
    ctx.fillStyle = '#7dd3fc';
    ctx.beginPath();
    ctx.arc(headX, centerY - buf[buf.length - 1] * scaleY, 3, 0, 2 * Math.PI);
    ctx.fill();
  }, [sampleCounter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Telemetry Header Ribbon */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-hairline)', paddingBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            Real-Time Hardware Stream & Continuous Inference Buffer
          </h2>
          <div className="tech-label" style={{ marginTop: '0.125rem' }}>
            ARDUINO AD8232 SERIAL TELEMETRY • AUTOMATED 4.5S INFERENCE CYCLES
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-surface)', border: '1px solid var(--border-hairline)', padding: '0.35rem 0.65rem', borderRadius: 'var(--radius-sm)' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isStreaming ? 'var(--status-normal)' : 'var(--status-warning)' }} />
            <span className="mono-metric" style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>
              {isStreaming ? 'UART COM3 (115200) • STREAMING' : 'FEED PAUSED'}
            </span>
          </div>

          <button
            className={`btn-control btn-control-sm ${isStreaming ? 'btn-control-secondary' : 'btn-control-primary'}`}
            onClick={() => setIsStreaming(!isStreaming)}
          >
            {isStreaming ? 'Pause Feed' : 'Resume Telemetry'}
          </button>
        </div>
      </div>

      {/* Main Oscilloscope Console Viewport */}
      <div className="data-panel" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '0.65rem 1.25rem', background: '#090d16', borderBottom: '1px solid #1a2230', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#f8fafc' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span className="mono-metric" style={{ fontSize: '0.75rem', color: '#7dd3fc', fontWeight: '600' }}>
              LEAD II • SINGLE-CHANNEL RHYTHM
            </span>
            <span style={{ fontSize: '0.6875rem', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
              CLOCK: {samplingRate} Hz (10 ms tick)
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.375rem' }}>
            <span className="tech-label" style={{ color: '#94a3b8' }}>RESTING HR</span>
            <span className="mono-metric" style={{ fontSize: '1.25rem', fontWeight: '700', color: '#ffffff' }}>
              {heartRate}
            </span>
            <span style={{ fontSize: '0.6875rem', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>BPM</span>
          </div>
        </div>

        {/* Live Canvas */}
        <div className="instrument-viewport" style={{ height: '320px', width: '100%', borderRadius: 0, border: 'none' }}>
          <canvas
            ref={canvasRef}
            width={900}
            height={320}
            style={{ width: '100%', height: '100%', display: 'block' }}
          />
        </div>

        {/* 4.5s Buffer Accumulator Ribbon */}
        <div style={{ padding: '0.75rem 1.25rem', background: 'var(--bg-surface)', borderTop: '1px solid var(--border-hairline)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
              <span className="tech-label">4.5-SECOND SLIDING WINDOW BUFFER</span>
              <span className="mono-metric">
                {Math.min(bufferTargetSamples, bufferRef.current.length)} / {bufferTargetSamples} SAMPLES ({Math.round(bufferProgress)}%)
              </span>
            </div>
            <div style={{ height: '4px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-xs)', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${bufferProgress}%`,
                  height: '100%',
                  background: 'var(--accent-navy)',
                  transition: 'width 0.1s linear'
                }}
              />
            </div>
          </div>

          <div className="tech-label" style={{ whiteSpace: 'nowrap' }}>
            CYCLE: EVERY 4.5S
          </div>
        </div>
      </div>

      {/* Signal Injector Controls (Testing Benchmark) */}
      <div className="data-panel">
        <div className="data-panel-header">
          <div>
            <div className="data-panel-title">Hardware Telemetry Test Injector</div>
            <div className="tech-label" style={{ marginTop: '2px' }}>SIMULATE REAL-TIME ANOMALIES FOR DEBUGGING</div>
          </div>
        </div>

        <div className="data-panel-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
            {[
              { id: 'NORM', label: '1. Healthy Sinus (NORM)', desc: 'Standard 72 BPM tracing' },
              { id: 'MI', label: '2. Acute STEMI (MI)', desc: 'ST elevation & 94 BPM' },
              { id: 'STTC', label: '3. Ischemic ST/T (STTC)', desc: 'T-wave inverted 82 BPM' },
              { id: 'CD', label: '4. Conduction Delay (CD)', desc: 'Broadened QRS 58 BPM' }
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => {
                  setSelectedSignalType(mode.id);
                  triggerInference(mode.id);
                }}
                className={`btn-control ${selectedSignalType === mode.id ? 'btn-control-primary' : 'btn-control-secondary'}`}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '0.625rem 0.875rem', gap: '0.125rem' }}
              >
                <span style={{ fontWeight: '600', fontSize: '0.75rem' }}>{mode.label}</span>
                <span style={{ fontSize: '0.6875rem', color: selectedSignalType === mode.id ? '#cbd5e1' : 'var(--text-muted)' }}>
                  {mode.desc}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Real-Time Detection Result & Telemetry Audit Log */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.75rem' }}>
        {/* Latest Classification Result */}
        <div className="data-panel">
          <div className="data-panel-header">
            <div>
              <div className="data-panel-title">Latest Window Prediction (4.5s Window)</div>
              <div className="tech-label" style={{ marginTop: '2px' }}>DEEP LEARNING MODEL OUTPUT</div>
            </div>
            {lastPrediction && (
              <span className={`clinical-badge ${lastPrediction.risk === 'Critical' ? 'clinical-badge-critical' : lastPrediction.risk === 'Moderate' ? 'clinical-badge-warning' : 'clinical-badge-normal'}`}>
                {lastPrediction.detectedClass} • {lastPrediction.confidence}%
              </span>
            )}
          </div>

          <div className="data-panel-body">
            {lastPrediction ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ padding: '0.875rem', borderRadius: 'var(--radius-sm)', background: lastPrediction.risk === 'Critical' ? 'var(--status-critical-bg)' : lastPrediction.risk === 'Moderate' ? 'var(--status-warning-bg)' : 'var(--status-normal-bg)', border: `1px solid ${lastPrediction.risk === 'Critical' ? 'var(--status-critical-border)' : lastPrediction.risk === 'Moderate' ? 'var(--status-warning-border)' : 'var(--status-normal-border)'}` }}>
                  <div style={{ fontWeight: '600', fontSize: '0.875rem', color: lastPrediction.risk === 'Critical' ? 'var(--status-critical)' : lastPrediction.risk === 'Moderate' ? 'var(--status-warning)' : 'var(--status-normal)', marginBottom: '0.25rem' }}>
                    {lastPrediction.detectedClass === 'NORM' ? 'Sinus Rhythm (Normal)' : `Pathology Flagged: ${lastPrediction.detectedClass}`}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                    {lastPrediction.message}
                  </div>
                  <div className="mono-metric" style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                    Timestamp: {lastPrediction.timestamp} • Duration: {lastPrediction.windowDuration}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div className="tech-label">SUPERCLASS PROBABILITIES BREAKDOWN</div>
                  {DIAGNOSTIC_CLASSES.map((cls) => {
                    const prob = lastPrediction.probabilities?.[cls.code] || 0.0;
                    const pct = Math.round(prob * 100);
                    return (
                      <div key={cls.code}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', marginBottom: '0.125rem' }}>
                          <span className="mono-metric"><strong>{cls.code}</strong> — {cls.name}</span>
                          <span className="mono-metric">{pct}%</span>
                        </div>
                        <div style={{ height: '4px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-xs)', overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: 'var(--accent-navy)' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', textAlign: 'center', padding: '2rem 0', fontFamily: 'var(--font-mono)' }}>
                Buffering initial 4.5s signal window from telemetry feed...
              </div>
            )}
          </div>
        </div>

        {/* Telemetry Audit Log */}
        <div className="data-panel">
          <div className="data-panel-header">
            <div>
              <div className="data-panel-title">Telemetry Audit Log</div>
              <div className="tech-label" style={{ marginTop: '2px' }}>HISTORICAL INFERENCE LOGS</div>
            </div>
            <span className="mono-metric" style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
              {predictionHistory.length} EVENTS
            </span>
          </div>

          <div className="data-panel-body" style={{ maxHeight: '340px', overflowY: 'auto', padding: '0.5rem 1.25rem' }}>
            {predictionHistory.length === 0 ? (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', padding: '1.5rem 0', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
                No events recorded yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {predictionHistory.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '0.5rem 0',
                      borderBottom: idx < predictionHistory.length - 1 ? '1px solid var(--border-hairline)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="mono-metric" style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                          {item.timestamp}
                        </span>
                        <span style={{ fontWeight: '600', fontSize: '0.75rem' }}>
                          {item.detectedClass}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>
                        Confidence: {item.confidence}% • {item.risk} Priority
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
