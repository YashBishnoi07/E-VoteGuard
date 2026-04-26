import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import VotingPage from './pages/VotingPage';
import AdminDashboard from './pages/AdminDashboard';
import AuditLogPage from './pages/AuditLogPage';
import IDScannerPage from './pages/IDScannerPage';
import FraudAssistant from './components/FraudAssistant';

// Route guards
function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen bg-ev-navy flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-ev-gold/20 border-t-ev-gold rounded-full animate-spin" />
    </div>
  );
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen bg-ev-navy flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-ev-gold/20 border-t-ev-gold rounded-full animate-spin" />
    </div>
  );
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/vote" replace />;
  return (
    <>
      {children}
      <FraudAssistant />
    </>
  );
}

function AppRoutes() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/vote" element={<PrivateRoute><VotingPage /></PrivateRoute>} />
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/id-scanner" element={<AdminRoute><IDScannerPage /></AdminRoute>} />
          <Route path="/audit" element={<PrivateRoute><AuditLogPage /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#111827',
              color: '#F0F4F8',
              border: '1px solid #243044',
              backdropFilter: 'blur(16px)',
              borderRadius: '16px',
              fontSize: '13px',
              fontWeight: '600',
              padding: '12px 20px',
              boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)',
            },
            success: { iconTheme: { primary: '#00A86B', secondary: '#fff' } },
            error: { iconTheme: { primary: '#C0392B', secondary: '#fff' } },
          }}
        />
      </Router>
    </AuthProvider>
  );
}

export default App;
