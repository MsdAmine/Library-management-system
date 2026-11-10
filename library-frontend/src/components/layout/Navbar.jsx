import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  BookOpen, 
  Users, 
  ArrowLeftRight, 
  BarChart3, 
  LogOut, 
  Menu, 
  X, 
  ShieldCheck, 
  User as UserIcon,
  Layers
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const isUser = role === 'USER';

  // Navigation items based on role
  const navItems = isUser
    ? [
        { name: 'My Loans & Portal', path: '/', icon: Layers },
        { name: 'Browse Catalog', path: '/catalog', icon: BookOpen },
      ]
    : [
        { name: 'Dashboard', path: '/', icon: Layers },
        { name: 'Catalog', path: '/catalog', icon: BookOpen },
        { name: 'Members', path: '/members', icon: Users },
        { name: 'Circulation & Loans', path: '/loans', icon: ArrowLeftRight },
        { name: 'Analytics', path: '/analytics', icon: BarChart3 },
      ];

  // Helper to determine active route
  const isRouteActive = (path) => {
    return path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
  };

  // Role badge color variants
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

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-xl transition-all shadow-xs">
      {/* Full width container spanning edge-to-edge with balanced padding */}
      <div className="h-16 w-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        
        {/* Left Section: Brand Logo & Navigation Links grouped together */}
        <div className="flex items-center gap-4 lg:gap-6 xl:gap-8 min-w-0">
          {/* Brand / Logo */}
          <NavLink 
            to="/" 
            className="group flex items-center gap-2.5 sm:gap-3 whitespace-nowrap shrink-0 transition-transform duration-200 active:scale-95"
          >
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-500 shadow-md shadow-indigo-500/20 ring-1 ring-indigo-500/20 group-hover:shadow-indigo-500/35 transition-all">
              <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-white transform group-hover:rotate-6 transition-transform" />
            </div>
            <div className="flex flex-col whitespace-nowrap">
              <span className="font-bold text-slate-900 text-base sm:text-lg flex items-center gap-1.5 leading-tight">
                Library
                <span className="inline-block h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
              </span>
              <span className="text-[9px] sm:text-[10px] text-indigo-600 font-semibold tracking-wider block">MANAGEMENT SYSTEM</span>
            </div>
          </NavLink>

          {/* Desktop Navigation Links — Directly beside logo */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = isRouteActive(item.path);

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 text-xs xl:text-sm font-medium rounded-xl transition-all duration-150 ${
                    isActive
                      ? 'text-indigo-600 bg-indigo-50 font-semibold border border-indigo-200/80 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 border border-transparent'
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Right Section: User Profile & Actions (Docked to right with guaranteed room) */}
        <div className="hidden lg:flex items-center gap-2.5 xl:gap-3.5 shrink-0">
          {/* Role Badge */}
          {role && (
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold tracking-wide border shadow-2xs shrink-0 ${getRoleBadgeClasses(role)}`}>
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>{role}</span>
            </div>
          )}

          {/* User Identity Info */}
          <div className="flex items-center gap-2 pl-2.5 xl:pl-3 border-l border-slate-200 shrink-0">
            <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shadow-2xs font-medium shrink-0">
              <UserIcon className="h-4 w-4" />
            </div>
            <span className="max-w-[120px] xl:max-w-[180px] truncate text-xs xl:text-sm text-slate-600 font-medium" title={user?.email}>
              {user?.email || 'Authenticated User'}
            </span>
          </div>

          {/* Logout Button (Never clipped or hidden) */}
          <button
            onClick={handleLogout}
            id="navbar-logout-btn"
            className="group shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-rose-700 bg-slate-50 hover:bg-rose-50 rounded-xl border border-slate-200 hover:border-rose-200 transition-all duration-200 shadow-2xs cursor-pointer ml-1"
            title="Sign out of your session"
          >
            <LogOut className="h-3.5 w-3.5 text-slate-400 group-hover:text-rose-600 group-hover:-translate-x-0.5 transition-transform" />
            <span>Logout</span>
          </button>
        </div>

        {/* Mobile menu button (< 1024px) */}
        <div className="flex lg:hidden items-center gap-2 shrink-0">
          {role && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getRoleBadgeClasses(role)}`}>
              {role}
            </span>
          )}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none cursor-pointer transition-colors"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

      </div>

      {/* Responsive Mobile / Tablet Navigation Drawer (< 1024px) */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-slate-200 bg-white/95 backdrop-blur-xl px-4 sm:px-6 pt-3 pb-5 space-y-1.5 shadow-lg animate-in slide-in-from-top-2 duration-200">
          {/* Identity in mobile drawer */}
          <div className="py-2.5 px-3 mb-2 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-7 w-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 shrink-0">
                <UserIcon className="h-3.5 w-3.5" />
              </div>
              <span className="text-xs font-semibold text-slate-700 truncate">{user?.email || 'Authenticated User'}</span>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${getRoleBadgeClasses(role)}`}>
              {role}
            </span>
          </div>

          {/* Nav links */}
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = isRouteActive(item.path);

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-indigo-700 bg-indigo-50 font-semibold border border-indigo-200 shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </NavLink>
            );
          })}

          {/* Mobile logout */}
          <div className="pt-2 border-t border-slate-100 mt-2">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-200 transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
