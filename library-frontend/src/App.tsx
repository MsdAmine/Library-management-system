import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Navbar from './components/layout/Navbar';
import Dashboard from './pages/Dashboard';
import Books from './pages/Books';
import Members from './pages/Members';
import Borrowings from './pages/Borrowings';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
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
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <MainLayout><Dashboard /></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/books" element={
            <ProtectedRoute>
              <MainLayout><Books /></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/members" element={
            <ProtectedRoute>
              <MainLayout><Members /></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/borrowings" element={
            <ProtectedRoute>
              <MainLayout><Borrowings /></MainLayout>
            </ProtectedRoute>
          } />

          {/* Redirects */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
