import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppLayout } from './layouts/AppLayout';

import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { BrandsPage } from './pages/BrandsPage';
import { AssetsPage } from './pages/AssetsPage';
import { SocialMonitorPage } from './pages/SocialMonitorPage';
import { AppMonitorPage } from './pages/AppMonitorPage';
import { ScansPage } from './pages/ScansPage';
import { DetectionsPage } from './pages/DetectionsPage';
import { ThreatInvestigationPage } from './pages/ThreatInvestigationPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Application Routes */}
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/brands" element={<BrandsPage />} />
            <Route path="/assets" element={<AssetsPage />} />
            <Route path="/social-monitor" element={<SocialMonitorPage />} />
            <Route path="/app-monitor" element={<AppMonitorPage />} />
            <Route path="/scans" element={<ScansPage />} />
            <Route path="/detections" element={<DetectionsPage />} />
            <Route path="/investigations/:id" element={<ThreatInvestigationPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
