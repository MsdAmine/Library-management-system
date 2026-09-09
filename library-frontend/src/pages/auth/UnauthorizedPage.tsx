import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, ShieldAlert, LogOut, ArrowLeft } from 'lucide-react';

const UnauthorizedPage = () => {
  const { logout, user, role } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-rose-200/40 rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="w-full max-w-md relative z-10">
        <div className="bg-white border border-slate-200/90 rounded-3xl p-8 text-center shadow-xl shadow-slate-200/60 space-y-6">
          <div className="h-16 w-16 mx-auto rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shadow-xs">
            <ShieldAlert className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Access Restricted</h1>
            <p className="text-sm text-slate-500 font-medium">
              Your active account (<span className="text-slate-800 font-semibold">{user?.email || 'User'}</span>) with role <span className="font-bold text-rose-600">{role || 'USER'}</span> does not have permissions to access this resource.
            </p>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate('/')}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm rounded-xl border border-slate-200 shadow-xs transition cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Home</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-rose-600/20 transition cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
