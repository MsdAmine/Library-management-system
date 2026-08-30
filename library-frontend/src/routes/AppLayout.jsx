import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  BookOpen, 
  Users, 
  ArrowLeftRight, 
  BarChart3, 
  LogOut, 
  Menu, 
  X, 
  ShieldCheck, 
  Sparkles,
  User as UserIcon,
  Layers
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AppLayout = () => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: Layers },
    { name: 'Catalog', path: '/catalog', icon: BookOpen },
    { name: 'Members', path: '/members', icon: Users },
    { name: 'Loans', path: '/loans', icon: ArrowLeftRight },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
  ];

  // Helper for role badge color
  const getRoleBadgeClasses = (userRole) => {
    switch (userRole) {
      case 'ADMIN':
        return 'bg-purple-500/15 text-purple-400 border-purple-500/30 ring-purple-500/20';
      case 'LIBRARIAN':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 ring-emerald-500/20';
      case 'USER':
      default:
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30 ring-blue-500/20';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-900/75 backdrop-blur-xl transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            
            {/* Brand / Logo */}
            <div className="flex items-center gap-3">
              <NavLink 
                to="/" 
                className="group flex items-center gap-2.5 transition-transform duration-200 active:scale-95"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 shadow-lg shadow-indigo-500/25 ring-1 ring-white/20 group-hover:shadow-indigo-500/40 transition-all">
                  <BookOpen className="h-5 w-5 text-white transform group-hover:rotate-6 transition-transform" />
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                    Library Admin
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                  </span>
                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Management System</span>
                </div>
              </NavLink>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.path === '/' 
                  ? location.pathname === '/' 
                  : location.pathname.startsWith(item.path);

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={`relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'text-white bg-slate-800 shadow-inner shadow-slate-900/50 border border-slate-700/60'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                    <span>{item.name}</span>
                    {isActive && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-indigo-500 rounded-full"></span>
                    )}
                  </NavLink>
                );
              })}
            </nav>

            {/* User Profile & Actions */}
            <div className="hidden md:flex items-center gap-3">
              {/* Role Badge */}
              {role && (
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide border shadow-xs ${getRoleBadgeClasses(role)}`}>
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>{role}</span>
                </div>
              )}

              {/* User Identity Info */}
              <div className="flex items-center gap-2 pl-2 border-l border-slate-800 text-sm">
                <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                  <UserIcon className="h-4 w-4" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-medium text-slate-200 max-w-[140px] truncate" title={user?.email}>
                    {user?.email || 'Authenticated User'}
                  </span>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                id="navbar-logout-btn"
                className="group flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-600 rounded-lg border border-rose-500/20 hover:border-rose-500 transition-all duration-200 shadow-sm ml-1 cursor-pointer"
                title="Sign out of your session"
              >
                <LogOut className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
                <span>Logout</span>
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="flex md:hidden items-center gap-2">
              {role && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getRoleBadgeClasses(role)}`}>
                  {role}
                </span>
              )}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>

          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-800 bg-slate-900/95 backdrop-blur-xl px-4 pt-2 pb-4 space-y-1">
            <div className="py-2 mb-2 border-b border-slate-800/80 flex items-center justify-between">
              <span className="text-xs text-slate-400 truncate">{user?.email}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getRoleBadgeClasses(role)}`}>
                {role}
              </span>
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.path === '/' 
                ? location.pathname === '/' 
                : location.pathname.startsWith(item.path);

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                    isActive
                      ? 'text-white bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}

            <div className="pt-2 border-t border-slate-800/80 mt-2">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-rose-400 bg-rose-500/10 hover:bg-rose-600 hover:text-white rounded-lg border border-rose-500/20 transition-colors cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Modern subtle footer */}
      <footer className="border-t border-slate-800/60 bg-slate-900/40 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Library Management System &copy; {new Date().getFullYear()}</span>
          <span className="flex items-center gap-1 text-slate-400">
            <Sparkles className="h-3 w-3 text-indigo-400" />
            Vite &bull; Tailwind CSS &bull; Spring Boot REST API
          </span>
        </div>
      </footer>
    </div>
  );
};

export default AppLayout;
