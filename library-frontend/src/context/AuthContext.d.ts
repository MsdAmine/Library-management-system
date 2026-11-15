import React from 'react';

export interface User {
  id?: number | string | null;
  email?: string;
  role?: string;
  firstName?: string;
  lastName?: string;
  sub?: string;
  exp?: number;
  userId?: number;
}

export interface AuthContextType {
  token: string | null;
  user: User | null;
  role: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; user: User; token: string }>;
  logout: () => void;
}

export declare const parseJwt: (token: string | null) => User | null;
export declare const AuthProvider: React.FC<{ children: React.ReactNode }>;
export declare const useAuth: () => AuthContextType;
declare const AuthContext: React.Context<AuthContextType | null>;
export default AuthContext;
