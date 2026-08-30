import React from 'react';

export interface ProtectedRouteProps {
  allowedRoles?: string[];
  children?: React.ReactNode;
}

declare const ProtectedRoute: React.FC<ProtectedRouteProps>;
export default ProtectedRoute;
