import React from 'react';

export default function Navbar({ activePage, setActivePage, backendConnected }) {
  return (
    <header className="app-header">
      <div className="header-container">
        {/* Brand identity — Instrument style */}
        <div
          className="header-brand"
          onClick={() => setActivePage('home')}
          role="button"
          tabIndex={0}
        >
          <div className="brand-symbol">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <div className="brand-meta">
            <span className="brand-title">CardioSense</span>
            <span className="brand-subtitle">PTB-XL Diagnostic Instrumentation</span>
          </div>
        </div>

        {/* Navigation — Editorial Numbered Links */}
        <nav className="header-nav">
          <button
            className={`nav-link-btn ${activePage === 'home' ? 'active' : ''}`}
            onClick={() => setActivePage('home')}
          >
            <span className="tech-label" style={{ fontSize: '0.625rem', color: activePage === 'home' ? 'var(--accent-navy)' : 'inherit' }}>01</span>
            <span>Overview</span>
          </button>

          <button
            className={`nav-link-btn ${activePage === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActivePage('dashboard')}
          >
            <span className="tech-label" style={{ fontSize: '0.625rem', color: activePage === 'dashboard' ? 'var(--accent-navy)' : 'inherit' }}>02</span>
            <span>Patients & Detect</span>
          </button>

          <button
            className={`nav-link-btn ${activePage === 'realtime' ? 'active' : ''}`}
            onClick={() => setActivePage('realtime')}
          >
            <span className="tech-label" style={{ fontSize: '0.625rem', color: activePage === 'realtime' ? 'var(--accent-navy)' : 'inherit' }}>03</span>
            <span>Live Stream</span>
          </button>

          {/* Telemetry Status Indicator */}
          <div className="header-telemetry-tag">
            <span
              className="telemetry-pulse"
              style={{ background: backendConnected ? 'var(--status-normal)' : 'var(--status-warning)' }}
            />
            <span>{backendConnected ? 'API :8000 LIVE' : 'CLIENT MODE'}</span>
          </div>
        </nav>
      </div>
    </header>
  );
}
