import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth.js';
import { AuthGuard } from './components/AuthGuard.js';
import { AppLayout } from './components/AppLayout.js';
import { LoginPage } from './pages/LoginPage.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { ShipmentsPage } from './pages/ShipmentsPage.js';
import { ShipmentDetailPage } from './pages/ShipmentDetailPage.js';
import { DocumentsPage } from './pages/DocumentsPage.js';
import { SettingsPage } from './pages/SettingsPage.js';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Application Routes */}
          <Route
            path="/"
            element={
              <AuthGuard>
                <AppLayout />
              </AuthGuard>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="shipments" element={<ShipmentsPage />} />
            <Route path="shipments/:id" element={<ShipmentDetailPage />} />
            <Route path="documents" element={<DocumentsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
