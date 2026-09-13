import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import AppLayout from './routes/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MemberPortal from './pages/MemberPortal';
import BookList from './pages/Catalog/BookList';
import MemberList from './pages/Members/MemberList';
import Borrowings from './pages/Borrowings';
import Analytics from './pages/Analytics';
import Users from './pages/Users';
import UnauthorizedPage from './pages/auth/UnauthorizedPage';

/**
 * Smart Dashboard Dispatcher that renders MemberPortal for standard patrons (Role.USER)
 * and the administrative overview for ADMIN / LIBRARIAN roles.
 */
const RootDashboard = () => {
  const { role } = useAuth();
  if (role === 'USER') {
    return <MemberPortal />;
  }
  return <Dashboard />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Protected Application Routes with Common Layout */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            {/* Dynamic Dashboard based on User Role */}
            <Route path="/" element={<RootDashboard />} />
            <Route path="/portal" element={<MemberPortal />} />
            <Route path="/my-portal" element={<Navigate to="/" replace />} />

            {/* Catalog - Accessible to all authenticated roles */}
            <Route path="/catalog" element={<BookList />} />
            <Route path="/books" element={<Navigate to="/catalog" replace />} />

            {/* Member Directory - Admin & Librarian only */}
            <Route
              path="/members"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'LIBRARIAN']}>
                  <MemberList />
                </ProtectedRoute>
              }
            />

            {/* Circulation / Loans Management - Admin & Librarian only */}
            <Route
              path="/loans"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'LIBRARIAN']}>
                  <Borrowings />
                </ProtectedRoute>
              }
            />
            <Route path="/borrowings" element={<Navigate to="/loans" replace />} />

            {/* Analytics & Reports - Admin & Librarian only */}
            <Route
              path="/analytics"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'LIBRARIAN']}>
                  <Analytics />
                </ProtectedRoute>
              }
            />

            {/* System User Accounts - Admin only */}
            <Route
              path="/users"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <Users />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Fallback Route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
