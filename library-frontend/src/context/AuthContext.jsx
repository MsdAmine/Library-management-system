import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

// Utility function to safely decode JWT payload
export const parseJwt = (token) => {
  if (!token) return null;
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Invalid JWT token format:', error);
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      const decoded = parseJwt(savedToken);
      if (decoded) {
        // Check if token has expired
        if (decoded.exp && decoded.exp * 1000 < Date.now()) {
          localStorage.removeItem('token');
          localStorage.removeItem('role');
          return null;
        }
        return {
          email: decoded.sub || '',
          role: decoded.role || localStorage.getItem('role') || 'USER',
          id: decoded.userId || null,
          ...decoded,
        };
      }
    }
    return null;
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      const decoded = parseJwt(token);
      if (decoded && (!decoded.exp || decoded.exp * 1000 > Date.now())) {
        setUser({
          email: decoded.sub || '',
          role: decoded.role || localStorage.getItem('role') || 'USER',
          id: decoded.userId || null,
          ...decoded,
        });
      } else {
        logout();
      }
    } else {
      setUser(null);
    }
  }, [token]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/authenticate', { email, password });
      const { token: receivedToken, role: receivedRole } = response.data;

      if (!receivedToken) {
        throw new Error('No token returned from authentication server');
      }

      localStorage.setItem('token', receivedToken);
      if (receivedRole) {
        localStorage.setItem('role', receivedRole);
      }

      const decoded = parseJwt(receivedToken);
      const userRole = receivedRole || decoded?.role || 'USER';

      const userData = {
        email: decoded?.sub || email,
        role: userRole,
        id: decoded?.userId || null,
        ...(decoded || {}),
      };

      setToken(receivedToken);
      setUser(userData);

      return { success: true, user: userData, token: receivedToken };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setToken(null);
    setUser(null);
  };

  const isAuthenticated = !!token && !!user;
  const role = user?.role || localStorage.getItem('role') || null;

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        role,
        isAuthenticated,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
