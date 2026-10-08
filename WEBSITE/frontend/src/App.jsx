import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import RealtimePage from './pages/RealtimePage';

export default function App() {
  const [activePage, setActivePage] = useState('home');
  const [backendConnected, setBackendConnected] = useState(false);

  // Poll backend health status
  useEffect(() => {
    let isMounted = true;
    async function checkBackend() {
      try {
        const res = await fetch('http://localhost:8000/api/health', { signal: AbortSignal.timeout(1200) });
        if (res.ok && isMounted) setBackendConnected(true);
      } catch {
        if (isMounted) setBackendConnected(false);
      }
    }

    checkBackend();
    const interval = setInterval(checkBackend, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="app-shell">
      <Navbar
        activePage={activePage}
        setActivePage={setActivePage}
        backendConnected={backendConnected}
      />

      <main className="content-viewport">
        {activePage === 'home' && <HomePage onNavigate={(page) => setActivePage(page)} />}
        {activePage === 'dashboard' && <DashboardPage />}
        {activePage === 'realtime' && <RealtimePage />}
      </main>

      <footer className="app-footer">
        <div className="footer-container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>CardioSense</span>
            <span>•</span>
            <span>PTB-XL v1.0.2 12-Lead Diagnostic Engine & Real-Time Telemetry</span>
          </div>

          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
            FASTAPI BACKEND :8000 • REACT 18 VITE • 5 DIAGNOSTIC SUPERCLASSES
          </div>
        </div>
      </footer>
    </div>
  );
}
