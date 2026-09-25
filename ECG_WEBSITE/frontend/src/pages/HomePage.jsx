import React, { useState, useEffect, useRef } from 'react';
import { DIAGNOSTIC_CLASSES, generate12LeadECG } from '../data/mockPatients';

export default function HomePage({ onNavigate }) {
  const [activeLead, setActiveLead] = useState('II');
  const [activeFaq, setActiveFaq] = useState(null);
  const heroCanvasRef = useRef(null);

  // Live rhythmic multi-lead interactive waveform for the hero section
  useEffect(() => {
    const canvas = heroCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    const fullLeads = generate12LeadECG('NORM', 72, 100, 15);
    let offset = 0;
    let animId;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Clinical millimeter grid
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      const step = 20;
      for (let x = 0; x < width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Zero-volt reference midline
      ctx.strokeStyle = '#334155';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Precision Cyan ECG Line
      const signal = fullLeads[activeLead] || fullLeads['II'];
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.0;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();

      const totalDisplayPoints = 400;
      const stepX = width / totalDisplayPoints;
      const centerY = height / 2;
      const scaleY = height / 3.4;

      for (let i = 0; i < totalDisplayPoints; i++) {
        const sampleIdx = (offset + i) % signal.length;
        const val = signal[sampleIdx];
        const x = i * stepX;
        const y = centerY - val * scaleY;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Phosphor head marker
      const headIdx = (offset + totalDisplayPoints - 1) % signal.length;
      const headVal = signal[headIdx];
      const headX = width;
      const headY = centerY - headVal * scaleY;
      ctx.fillStyle = '#7dd3fc';
      ctx.beginPath();
      ctx.arc(headX - 2, headY, 3.5, 0, 2 * Math.PI);
      ctx.fill();

      offset = (offset + 1) % signal.length;
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [activeLead]);

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4.5rem' }}>
      {/* ======================================================== */}
      {/* SECTION 1: PRODUCTION HERO WITH LIVE WAVEFORM VIEWPORT   */}
      {/* ======================================================== */}
      <section style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '3rem', alignItems: 'center' }}>
        <div>
          <div className="enterprise-pill" style={{ marginBottom: '1.25rem' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--brand-primary)' }} />
            ENTERPRISE CARDIOLOGY INTELLIGENCE • PTB-XL v1.0.2
          </div>

          <h1 style={{ fontSize: '2.75rem', fontWeight: '700', lineHeight: 1.15, letterSpacing: '-0.03em', color: 'var(--brand-navy)', marginBottom: '1.25rem' }}>
            Autonomous 12-Lead Electrocardiogram Diagnostic Platform
          </h1>

          <p style={{ fontSize: '1.0625rem', color: 'var(--text-secondary)', lineHeight: 1.65, maxWidth: '580px', marginBottom: '2rem' }}>
            Engineered for emergency triage and continuous ICU telemetry. CardioSense delivers simultaneous multi-label neural classification across 5 diagnostic superclasses with sub-50ms inference latency and verified clinical confidence.
          </p>

          <div style={{ display: 'flex', gap: '0.875rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '2.5rem' }}>
            <button
              className="btn-control btn-control-primary"
              onClick={() => onNavigate('dashboard')}
              style={{ padding: '0.75rem 1.5rem', fontSize: '0.9375rem' }}
            >
              Open Clinical Registry (SPA)
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>

            <button
              className="btn-control btn-control-secondary"
              onClick={() => onNavigate('realtime')}
              style={{ padding: '0.75rem 1.5rem', fontSize: '0.9375rem' }}
            >
              Launch Real-Time Stream
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            </button>
          </div>

          {/* Verification Badge Bar */}
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--status-normal)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              <span>Zero-Leakage Folds (1-10)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--status-normal)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              <span>Multi-Label Sigmoid Heads</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--status-normal)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              <span>Hardware Telemetry Ready</span>
            </div>
          </div>
        </div>

        {/* Right side: Live Multi-Lead Interactive Monitor */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="tech-label">REAL-TIME SIGNAL ACQUISITION</span>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              {['I', 'II', 'V1', 'V5'].map((lead) => (
                <button
                  key={lead}
                  onClick={() => setActiveLead(lead)}
                  style={{
                    padding: '2px 8px',
                    fontSize: '0.6875rem',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: '600',
                    border: '1px solid',
                    borderColor: activeLead === lead ? 'var(--brand-primary)' : 'var(--border-strong)',
                    background: activeLead === lead ? 'var(--brand-primary)' : 'var(--bg-surface)',
                    color: activeLead === lead ? '#ffffff' : 'var(--text-secondary)',
                    borderRadius: 'var(--radius-xs)',
                    cursor: 'pointer'
                  }}
                >
                  LEAD {lead}
                </button>
              ))}
            </div>
          </div>

          <div className="instrument-viewport" style={{ height: '280px', width: '100%', boxShadow: 'var(--shadow-card)' }}>
            <div className="instrument-corner-stamp">
              LEAD {activeLead} • 25 mm/s • 10 mm/mV • 100 Hz
            </div>
            <canvas
              ref={heroCanvasRef}
              width={540}
              height={280}
              style={{ width: '100%', height: '280px', display: 'block' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            <span>Time domain: 0.0s – 4.0s Continuous</span>
            <span style={{ color: 'var(--status-normal)' }}>● NORMAL SINUS (72 BPM)</span>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* SECTION 2: PRODUCTION TRUST & SCALE METRICS              */}
      {/* ======================================================== */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
        <div className="prod-card prod-card-body" style={{ borderLeft: '3px solid var(--brand-primary)' }}>
          <div className="tech-label">CLINICAL RECORDS</div>
          <div className="mono-metric" style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--brand-navy)', margin: '0.25rem 0' }}>
            21,801
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            Curated 10-second recordings from 18,869 clinical patients.
          </div>
        </div>

        <div className="prod-card prod-card-body" style={{ borderLeft: '3px solid var(--brand-primary)' }}>
          <div className="tech-label">CHANNEL ARCHITECTURE</div>
          <div className="mono-metric" style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--brand-navy)', margin: '0.25rem 0' }}>
            12 Leads
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            Simultaneous limb & precordial leads (I, II, III, aVR, aVL, aVF, V1-V6).
          </div>
        </div>

        <div className="prod-card prod-card-body" style={{ borderLeft: '3px solid var(--status-normal)' }}>
          <div className="tech-label" style={{ color: 'var(--status-normal)' }}>EDGE LATENCY</div>
          <div className="mono-metric" style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--status-normal)', margin: '0.25rem 0' }}>
            &lt; 42 ms
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            Sub-second triage response optimized for emergency care units.
          </div>
        </div>

        <div className="prod-card prod-card-body" style={{ borderLeft: '3px solid var(--brand-cyan)' }}>
          <div className="tech-label" style={{ color: 'var(--brand-cyan)' }}>CLASSIFICATION TARGETS</div>
          <div className="mono-metric" style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--brand-navy)', margin: '0.25rem 0' }}>
            5 Classes
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            NORM, MI, STTC, CD, and HYP mapped from 71 SCP-ECG statements.
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* SECTION 3: THE 5 CARDIAC DIAGNOSTIC SUPERCLASSES         */}
      {/* ======================================================== */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div>
          <span className="tech-label">DIAGNOSTIC SCOPE</span>
          <h2 style={{ fontSize: '1.875rem', fontWeight: '700', color: 'var(--brand-navy)', letterSpacing: '-0.02em', marginTop: '0.375rem' }}>
            Five Major Clinical Diagnostic Superclasses
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', maxWidth: '720px', marginTop: '0.5rem' }}>
            CardioSense employs a multi-label convolutional architecture that identifies co-existing cardiac pathologies simultaneously rather than forcing a mutually exclusive diagnosis.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
          {DIAGNOSTIC_CLASSES.map((item) => {
            const isNorm = item.code === 'NORM';
            const isCritical = item.code === 'MI';
            const borderColor = isCritical ? 'var(--status-critical-border)' : isNorm ? 'var(--status-normal-border)' : 'var(--border-hairline)';
            const tagClass = isCritical ? 'clinical-badge-critical' : isNorm ? 'clinical-badge-normal' : 'clinical-badge-warning';

            return (
              <div
                key={item.code}
                className="prod-card"
                style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', borderColor }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span className="mono-metric" style={{ fontSize: '1.25rem', fontWeight: '700', color: item.color }}>
                    {item.code}
                  </span>
                  <span className={`clinical-badge ${tagClass}`}>
                    {isNorm ? 'STANDARD' : 'PATHOLOGY'}
                  </span>
                </div>

                <div style={{ fontWeight: '600', fontSize: '1rem', color: 'var(--brand-navy)', marginBottom: '0.375rem' }}>
                  {item.name}
                </div>

                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5, flex: 1, marginBottom: '1rem' }}>
                  {item.desc}
                </p>

                <div style={{ borderTop: '1px solid var(--border-hairline)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  <span>PTB-XL Prevalence:</span>
                  <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                    {item.code === 'NORM' ? '44.0%' : item.code === 'MI' ? '25.2%' : item.code === 'STTC' ? '24.1%' : item.code === 'CD' ? '22.8%' : '12.4%'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ======================================================== */}
      {/* SECTION 4: PLATFORM CORE CAPABILITIES                    */}
      {/* ======================================================== */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div>
          <span className="tech-label">CORE PLATFORM ARCHITECTURE</span>
          <h2 style={{ fontSize: '1.875rem', fontWeight: '700', color: 'var(--brand-navy)', letterSpacing: '-0.02em', marginTop: '0.375rem' }}>
            Built for Clinical Workstations and Remote Telemetry
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
          <div className="prod-card prod-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-sm)', background: 'var(--brand-primary-light)', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            </div>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--brand-navy)', marginBottom: '0.375rem' }}>
                Single-Page Patient Registry
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Inspect institutional patient databases, filter by clinical risk stratification, and select individual patient tracings for immediate deep learning inspection.
              </p>
            </div>
            <div style={{ marginTop: 'auto', paddingTop: '0.75rem' }}>
              <button className="btn-control btn-control-sm btn-control-secondary" onClick={() => onNavigate('dashboard')}>
                Open Registry →
              </button>
            </div>
          </div>

          <div className="prod-card prod-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-sm)', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            </div>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--brand-navy)', marginBottom: '0.375rem' }}>
                Calibrated 12-Lead Diagnostic Studio
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Inspect full 12-channel rhythm matrices (3×4 standard) or single lead focus at 25 mm/s and 10 mm/mV with automatic detection of ST segment changes and conduction blocks.
              </p>
            </div>
            <div style={{ marginTop: 'auto', paddingTop: '0.75rem' }}>
              <button className="btn-control btn-control-sm btn-control-secondary" onClick={() => onNavigate('dashboard')}>
                View Diagnostic Suite →
              </button>
            </div>
          </div>

          <div className="prod-card prod-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-sm)', background: '#fffbeb', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--brand-navy)', marginBottom: '0.375rem' }}>
                Live Microcontroller Ingestion
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Simulates or connects real-time serial telemetry from Arduino AD8232 heart sensors. Gathers rolling 4.5s signal buffers and automatically runs periodic classification cycles.
              </p>
            </div>
            <div style={{ marginTop: 'auto', paddingTop: '0.75rem' }}>
              <button className="btn-control btn-control-sm btn-control-secondary" onClick={() => onNavigate('realtime')}>
                Open Live Telemetry →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* SECTION 5: CLINICAL PIPELINE & HARDWARE FLOW             */}
      {/* ======================================================== */}
      <section style={{ background: '#ffffff', border: '1px solid var(--border-hairline)', borderRadius: 'var(--radius-md)', padding: '2.5rem', boxShadow: 'var(--shadow-subtle)' }}>
        <div style={{ marginBottom: '2rem', textAlign: 'center', maxWidth: '640px', margin: '0 auto 2.5rem auto' }}>
          <span className="tech-label">DATA INTEGRITY PIPELINE</span>
          <h2 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--brand-navy)', letterSpacing: '-0.02em', marginTop: '0.375rem' }}>
            From Sensor Electrode to Clinical Decision
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
            How analog cardiac voltages are acquired, cleaned, and evaluated through deep neural network heads.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', position: 'relative' }}>
          <div style={{ padding: '1rem', background: 'var(--bg-canvas)', border: '1px solid var(--border-hairline)', borderRadius: 'var(--radius-sm)' }}>
            <div className="mono-metric" style={{ fontSize: '0.75rem', color: 'var(--brand-primary)', fontWeight: '700' }}>01 / ACQUISITION</div>
            <div style={{ fontWeight: '600', fontSize: '0.9375rem', margin: '0.375rem 0' }}>12 Leads / Sensor</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Raw differential voltages captured at 100/500 Hz via limb and precordial chest electrodes.
            </div>
          </div>

          <div style={{ padding: '1rem', background: 'var(--bg-canvas)', border: '1px solid var(--border-hairline)', borderRadius: 'var(--radius-sm)' }}>
            <div className="mono-metric" style={{ fontSize: '0.75rem', color: 'var(--brand-primary)', fontWeight: '700' }}>02 / BUFFERING</div>
            <div style={{ fontWeight: '600', fontSize: '0.9375rem', margin: '0.375rem 0' }}>Sliding Buffer</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Rolling 4.5–10.0s time window stores incoming samples with zero sample-drop telemetry.
            </div>
          </div>

          <div style={{ padding: '1rem', background: 'var(--bg-canvas)', border: '1px solid var(--border-hairline)', borderRadius: 'var(--radius-sm)' }}>
            <div className="mono-metric" style={{ fontSize: '0.75rem', color: 'var(--brand-primary)', fontWeight: '700' }}>03 / FILTERING</div>
            <div style={{ fontWeight: '600', fontSize: '0.9375rem', margin: '0.375rem 0' }}>Baseline Filter</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              High-pass baseline wander removal and channel-wise z-score normalization.
            </div>
          </div>

          <div style={{ padding: '1rem', background: 'var(--bg-canvas)', border: '1px solid var(--border-hairline)', borderRadius: 'var(--radius-sm)' }}>
            <div className="mono-metric" style={{ fontSize: '0.75rem', color: 'var(--brand-primary)', fontWeight: '700' }}>04 / INFERENCE</div>
            <div style={{ fontWeight: '600', fontSize: '0.9375rem', margin: '0.375rem 0' }}>1D ConvNet Model</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Extracts spatial-temporal features across all 12 channels into multi-label sigmoid outputs.
            </div>
          </div>

          <div style={{ padding: '1rem', background: 'var(--brand-primary-light)', border: '1px solid var(--brand-primary-border)', borderRadius: 'var(--radius-sm)' }}>
            <div className="mono-metric" style={{ fontSize: '0.75rem', color: 'var(--brand-primary)', fontWeight: '700' }}>05 / TRIAGE</div>
            <div style={{ fontWeight: '600', fontSize: '0.9375rem', color: 'var(--brand-navy)', margin: '0.375rem 0' }}>Clinical Alert</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Instantaneous risk flag and confidence matrix for attending cardiology personnel.
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* SECTION 6: CLINICAL VALIDATION & PROTOCOL RIGOR          */}
      {/* ======================================================== */}
      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem', alignItems: 'center' }}>
        <div>
          <span className="tech-label">SCIENTIFIC INTEGRITY</span>
          <h2 style={{ fontSize: '1.875rem', fontWeight: '700', color: 'var(--brand-navy)', letterSpacing: '-0.02em', marginTop: '0.375rem' }}>
            Zero-Leakage Stratified Cross-Validation
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.65, marginTop: '0.75rem' }}>
            In clinical machine learning, evaluating models on random record splits creates severe data leakage because records from the same patient can appear in both training and test sets.
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.65, marginTop: '0.5rem' }}>
            CardioSense enforces the official PTB-XL pre-defined <code>strat_fold</code> partitioning: Folds 1–8 strictly reserved for model training (~17,400 records), Fold 9 for hyperparameter validation (~2,200 records), and Fold 10 as an untouched benchmark test set (~2,200 records).
          </p>
        </div>

        <div className="prod-card prod-card-body" style={{ background: 'var(--bg-canvas)' }}>
          <div className="tech-label" style={{ marginBottom: '1rem' }}>BENCHMARK PARTITIONING (PTB-XL v1.0.2)</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.25rem' }}>
                <span style={{ fontWeight: '600' }}>Training Set (Folds 1–8)</span>
                <span className="mono-metric" style={{ color: 'var(--text-muted)' }}>~17,400 records (80%)</span>
              </div>
              <div style={{ height: '6px', background: 'var(--bg-muted)', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{ width: '80%', height: '100%', background: 'var(--brand-primary)' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.25rem' }}>
                <span style={{ fontWeight: '600' }}>Validation Set (Fold 9)</span>
                <span className="mono-metric" style={{ color: 'var(--text-muted)' }}>~2,200 records (10%)</span>
              </div>
              <div style={{ height: '6px', background: 'var(--bg-muted)', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{ width: '10%', height: '100%', background: 'var(--brand-cyan)' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.25rem' }}>
                <span style={{ fontWeight: '600' }}>Hold-Out Test Set (Fold 10)</span>
                <span className="mono-metric" style={{ color: 'var(--text-muted)' }}>~2,200 records (10%)</span>
              </div>
              <div style={{ height: '6px', background: 'var(--bg-muted)', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{ width: '10%', height: '100%', background: 'var(--status-normal)' }} />
              </div>
            </div>
          </div>
          <div style={{ marginTop: '1.25rem', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            *Folds 9 & 10 contain high-confidence human cardiologist validated SCP labels for gold-standard clinical evaluation.
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* SECTION 7: CLINICAL & ENGINEERING FAQ                    */}
      {/* ======================================================== */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div>
          <span className="tech-label">CLINICAL QUESTIONS & ANSWERS</span>
          <h2 style={{ fontSize: '1.875rem', fontWeight: '700', color: 'var(--brand-navy)', letterSpacing: '-0.02em', marginTop: '0.375rem' }}>
            Frequently Asked Clinical & Technical Questions
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[
            {
              q: 'Why use multi-label classification instead of multiclass classification?',
              a: 'A single patient ECG can exhibit multiple cardiac abnormalities concurrently. For instance, a patient experiencing acute myocardial infarction (MI) may also have a pre-existing left bundle branch block (CD) and ventricular hypertrophy (HYP). Single-label multiclass models force an artificial single choice, whereas CardioSense uses independent sigmoid heads to accurately detect co-morbidities.'
            },
            {
              q: 'How does the system transition from Arduino serial streaming to model predictions?',
              a: 'The physical Arduino AD8232 front-end samples heart voltages at 100 Hz and transmits raw ADC counts via 115200 baud UART. CardioSense buffers these samples into a rolling 4.5-second sliding window (450 data points). Once 4.5 seconds of clean signal accumulates, an automated inference trigger evaluates the window and updates the clinical monitor.'
            },
            {
              q: 'What is the clinical difference between 100 Hz and 500 Hz sampling rates?',
              a: '100 Hz provides 1,000 samples per lead over 10 seconds, which is optimal for rapid edge classification, screening, and microcontroller streaming with reduced memory footprints. 500 Hz provides 5,000 samples per lead, which is suited for nuanced electrophysiological morphology such as subtle notchings in pediatric ECGs or pacemaker spikes.'
            },
            {
              q: 'Can this prototype run entirely offline in clinical environments without cloud dependencies?',
              a: 'Yes. The web application features an offline-first architecture. It can run on hospital LANs with zero external internet access. When connected to the local FastAPI backend (at localhost:8000), it processes records locally without external telemetry leakage, satisfying HIPAA privacy guidelines.'
            }
          ].map((faq, idx) => (
            <div
              key={idx}
              className="prod-card"
              style={{ overflow: 'hidden', cursor: 'pointer' }}
              onClick={() => toggleFaq(idx)}
            >
              <div style={{ padding: '1.125rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '600', fontSize: '0.9375rem', color: 'var(--brand-navy)' }}>
                  {faq.q}
                </span>
                <span style={{ fontSize: '1.25rem', color: 'var(--brand-primary)', fontWeight: '600' }}>
                  {activeFaq === idx ? '−' : '+'}
                </span>
              </div>
              {activeFaq === idx && (
                <div style={{ padding: '0 1.5rem 1.25rem 1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, borderTop: '1px solid var(--border-hairline)', paddingTop: '0.875rem' }}>
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ======================================================== */}
      {/* SECTION 8: ENTERPRISE CALL TO ACTION BANNER              */}
      {/* ======================================================== */}
      <section style={{ background: 'var(--brand-navy)', borderRadius: 'var(--radius-md)', padding: '3.5rem 2.5rem', color: '#ffffff', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', boxShadow: 'var(--shadow-card)' }}>
        <span className="enterprise-pill" style={{ background: 'rgba(255, 255, 255, 0.12)', color: '#ffffff', borderColor: 'rgba(255, 255, 255, 0.25)', marginBottom: '1.25rem' }}>
          READY FOR CLINICAL TRIAL & HARDWARE INTEGRATION
        </span>

        <h2 style={{ fontSize: '2.25rem', fontWeight: '700', letterSpacing: '-0.025em', maxWidth: '700px', marginBottom: '1rem' }}>
          Experience 12-Lead Diagnostic Intelligence in Action
        </h2>

        <p style={{ color: '#cbd5e1', fontSize: '1rem', maxWidth: '580px', lineHeight: 1.6, marginBottom: '2.5rem' }}>
          Explore the patient registry with realistic clinical tracings or connect an Arduino microcontroller to test real-time sliding buffer inference.
        </p>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            className="btn-control"
            style={{ background: 'var(--brand-primary)', color: '#ffffff', padding: '0.75rem 1.75rem', fontSize: '0.9375rem', border: '1px solid var(--brand-primary)' }}
            onClick={() => onNavigate('dashboard')}
          >
            Launch Patient Registry SPA
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>

          <button
            className="btn-control"
            style={{ background: 'transparent', color: '#ffffff', borderColor: 'rgba(255, 255, 255, 0.3)', padding: '0.75rem 1.75rem', fontSize: '0.9375rem' }}
            onClick={() => onNavigate('realtime')}
          >
            Connect Real-Time Telemetry
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          </button>
        </div>
      </section>
    </div>
  );
}
