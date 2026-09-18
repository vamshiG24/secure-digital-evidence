import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import AppLayout from './layouts/AppLayout';
import { Skeleton } from './components/ui';
import './index.css';

// Route-level code splitting keeps the initial bundle small
const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const CasesPage = lazy(() => import('./pages/CasesPage'));
const CaseDetailPage = lazy(() => import('./pages/CaseDetailPage'));
const EvidencePage = lazy(() => import('./pages/EvidencePage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const AuditLogsPage = lazy(() => import('./pages/AuditLogsPage'));
const UsersPage = lazy(() => import('./pages/UsersPage'));
const AiStudioPage = lazy(() => import('./pages/AiStudioPage'));
const UserProfilePage = lazy(() => import('./pages/UserProfilePage'));

function PageFallback() {
  return (
    <div style={{ display: 'grid', gap: 16 }} aria-busy="true" aria-label="Loading page">
      <Skeleton h={28} w={240} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        {[0, 1, 2, 3].map(i => <Skeleton key={i} h={110} r={16} />)}
      </div>
      <Skeleton h={320} r={16} />
    </div>
  );
}

/** Blocks routes by role on the client (the API enforces the same rules). */
function RoleRoute({ roles, children }) {
  const { user } = useAuth();
  if (!user) return null;
  return roles.includes(user.role) ? children : <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route element={<AppLayout />}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/cases" element={<CasesPage />} />
                <Route path="/cases/:id" element={<CaseDetailPage />} />
                <Route path="/evidence" element={<EvidencePage />} />
                <Route path="/ai-studio" element={<AiStudioPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/audit-logs" element={<RoleRoute roles={['admin']}><AuditLogsPage /></RoleRoute>} />
                <Route path="/users" element={<RoleRoute roles={['admin', 'investigator']}><UsersPage /></RoleRoute>} />
                <Route path="/profile" element={<UserProfilePage />} />
                <Route path="/settings" element={<Navigate to="/profile" replace />} />
              </Route>
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
        <Toaster
          position="top-right"
          gutter={10}
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: 12,
              background: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              fontSize: 14,
              fontWeight: 500,
              boxShadow: 'var(--shadow-lg)',
              border: '1px solid var(--border)',
              padding: '12px 16px',
            },
            success: { iconTheme: { primary: 'var(--success)', secondary: '#fff' } },
            error: { iconTheme: { primary: 'var(--danger)', secondary: '#fff' } },
          }}
        />
      </AuthProvider>
    </ThemeProvider>
  );
}
