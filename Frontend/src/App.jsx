import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import CitizenDashboard from './pages/Citizendash';
import WorkerDashboard from './pages/Workerdash';
import AdminDashboard from './pages/Admindash';

export function App() {
  return (
    <Routes>
      {/* 1. EcoMind AI Landing Page (Primary Entry Point) */}
      <Route path="/" element={<LandingPage />} />

      {/* 2. Authentication Pages (Login & Sign Up) */}
      <Route path="/login" element={<AuthPage defaultView="login" />} />
      <Route path="/signup" element={<AuthPage defaultView="signup" />} />

      {/* 3. Protected Dashboard Portals */}
      <Route path="/citizen" element={<CitizenDashboard />} />
      <Route path="/worker" element={<WorkerDashboard />} />
      <Route path="/admin" element={<AdminDashboard />} />

      {/* 4. Fallback Catch-all -> Redirect to Landing Page */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
