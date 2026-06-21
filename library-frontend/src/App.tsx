import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import RoleProtectedRoute from './components/auth/RoleProtectedRoute';
import Navbar from './components/layout/Navbar';
import Dashboard from './pages/Dashboard';
import Books from './pages/Books';
import Members from './pages/Members';
import Borrowings from './pages/Borrowings';
import LoginPage from './pages/auth/LoginPage';
import UnauthorizedPage from './pages/auth/UnauthorizedPage';
import Users from './pages/Users';
import './App.css';

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="app-container">
    <Navbar />
    <main className="main-content">
      <div className="container">
        {children}
      </div>
    </main>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />

          {/* Unauthorized page – accessible to any authenticated user */}
          <Route path="/unauthorized" element={
            <ProtectedRoute>
              <UnauthorizedPage />
            </ProtectedRoute>
          } />

          {/* Management Routes – ADMIN and LIBRARIAN only */}
          <Route path="/" element={
            <RoleProtectedRoute>
              <MainLayout><Dashboard /></MainLayout>
            </RoleProtectedRoute>
          } />
          <Route path="/books" element={
            <RoleProtectedRoute>
              <MainLayout><Books /></MainLayout>
            </RoleProtectedRoute>
          } />
          <Route path="/members" element={
            <RoleProtectedRoute>
              <MainLayout><Members /></MainLayout>
            </RoleProtectedRoute>
          } />
          <Route path="/borrowings" element={
            <RoleProtectedRoute>
              <MainLayout><Borrowings /></MainLayout>
            </RoleProtectedRoute>
          } />
          <Route path="/users" element={
            <RoleProtectedRoute roles={['ADMIN']}>
              <MainLayout><Users /></MainLayout>
            </RoleProtectedRoute>
          } />

          {/* Redirects */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
