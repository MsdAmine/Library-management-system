import React from 'react';

export interface User {
  id?: number | string | null;
  email?: string;
  role?: string;
  [key: string]: any;
}

export interface AuthContextType {
  token: string | null;
  user: User | null;
  role: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  logout: () => void;
}

export declare const parseJwt: (token: string | null) => any;
export declare const AuthProvider: React.FC<{ children: React.ReactNode }>;
export declare const useAuth: () => AuthContextType;
declare const AuthContext: React.Context<AuthContextType | null>;
export default AuthContext;
