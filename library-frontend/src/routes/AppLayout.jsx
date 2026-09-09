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

  // Refined role badges using modern high-contrast pastels
  const getRoleBadgeClasses = (userRole) => {
    switch (userRole) {
      case 'ADMIN':
        return 'bg-purple-50 text-purple-700 border-purple-200 ring-1 ring-purple-100';
      case 'LIBRARIAN':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-100';
      case 'USER':
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200 ring-1 ring-blue-100';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-xl transition-all shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            
            {/* Brand / Logo */}
            <div className="flex items-center gap-3">
              <NavLink 
                to="/" 
                className="group flex items-center gap-2.5 transition-transform duration-200 active:scale-95"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-500 shadow-md shadow-indigo-500/20 ring-1 ring-indigo-500/20 group-hover:shadow-indigo-500/35 transition-all">
                  <BookOpen className="h-5 w-5 text-white transform group-hover:rotate-6 transition-transform" />
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
                    Library Admin
                    <span className="inline-block h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Management System</span>
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
                    className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'text-indigo-600 bg-indigo-50/80 font-semibold border border-indigo-200/70 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span>{item.name}</span>
                    {isActive && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-indigo-600 rounded-full"></span>
                    )}
                  </NavLink>
                );
              })}
            </nav>

            {/* User Profile & Actions */}
            <div className="hidden md:flex items-center gap-3">
              {/* Role Badge */}
              {role && (
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold tracking-wide border shadow-xs ${getRoleBadgeClasses(role)}`}>
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>{role}</span>
                </div>
              )}

              {/* User Identity Info */}
              <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200 text-sm">
                <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shadow-xs font-medium">
                  <UserIcon className="h-4 w-4" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-semibold text-slate-800 max-w-[140px] truncate" title={user?.email}>
                    {user?.email || 'Authenticated User'}
                  </span>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                id="navbar-logout-btn"
                className="group flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-rose-700 bg-white hover:bg-rose-50 rounded-xl border border-slate-200 hover:border-rose-200 transition-all duration-200 shadow-xs ml-1 cursor-pointer"
                title="Sign out of your session"
              >
                <LogOut className="h-3.5 w-3.5 text-slate-400 group-hover:text-rose-600 group-hover:-translate-x-0.5 transition-transform" />
                <span>Logout</span>
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="flex md:hidden items-center gap-2">
              {role && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getRoleBadgeClasses(role)}`}>
                  {role}
                </span>
              )}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>

          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-200 bg-white/95 backdrop-blur-xl px-4 pt-2 pb-4 space-y-1 shadow-md">
            <div className="py-2 mb-2 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-600 truncate">{user?.email}</span>
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
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${
                    isActive
                      ? 'text-indigo-700 bg-indigo-50 font-semibold border border-indigo-200'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}

            <div className="pt-2 border-t border-slate-100 mt-2">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-200 transition-colors cursor-pointer"
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
      <footer className="border-t border-slate-200/80 bg-white/60 py-4 text-center text-xs text-slate-500 backdrop-blur-xs">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="font-medium text-slate-500">Library Management System &copy; {new Date().getFullYear()}</span>
          <span className="flex items-center gap-1.5 text-slate-500">
            <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
            Vite &bull; Tailwind CSS &bull; Spring Boot REST API
          </span>
        </div>
      </footer>
    </div>
  );
};

export default AppLayout;

