import React from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Users, 
  ArrowLeftRight, 
  BarChart3, 
  Shield, 
  Sparkles, 
  ArrowUpRight,
  Mail,
  Clock,
  Database
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user, role } = useAuth();

  const stats = [
    {
      title: 'Book Catalog',
      desc: 'Browse & manage inventory',
      link: '/catalog',
      icon: BookOpen,
      color: 'from-indigo-500 to-indigo-600',
      badge: 'Inventory',
    },
    {
      title: 'Library Members',
      desc: 'Registered patrons & cards',
      link: '/members',
      icon: Users,
      color: 'from-cyan-500 to-teal-600',
      badge: 'Community',
    },
    {
      title: 'Active Loans',
      desc: 'Checkouts & return logs',
      link: '/loans',
      icon: ArrowLeftRight,
      color: 'from-amber-500 to-orange-600',
      badge: 'Circulation',
    },
    {
      title: 'Analytics & Reports',
      desc: 'Borrowing trends & metrics',
      link: '/analytics',
      icon: BarChart3,
      color: 'from-violet-500 to-purple-600',
      badge: 'Insights',
    },
  ];

  return (
    <div className="h-full flex flex-col justify-between gap-4 sm:gap-5 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 p-5 sm:p-6 shadow-xl shadow-indigo-500/15 text-white shrink-0">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full text-xs font-semibold bg-white/15 text-indigo-100 backdrop-blur-md border border-white/20">
            <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
            <span>Authentication Session Active</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Welcome back, {user?.email?.split('@')[0] || 'Administrator'}!
          </h1>
          <p className="text-indigo-100 text-sm max-w-2xl leading-relaxed">
            You are signed in as <span className="font-semibold text-white">{user?.email}</span> with active role privileges for <span className="font-semibold bg-white/20 px-2 py-0.5 rounded-md text-white">{role || 'USER'}</span>.
          </p>
        </div>
      </div>

      {/* Account Identity Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3 shrink-0">
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <Shield className="h-4 w-4 text-indigo-600" />
            Account Identity
          </h3>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            {role}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-0.5">
          <div className="flex items-center gap-2.5 text-slate-700">
            <Mail className="h-4 w-4 text-slate-400 shrink-0" />
            <span className="text-slate-500 text-xs font-medium">Email:</span>
            <span className="font-semibold text-slate-900 truncate text-xs sm:text-sm">{user?.email || 'N/A'}</span>
          </div>
          <div className="flex items-center gap-2.5 text-slate-700">
            <Clock className="h-4 w-4 text-slate-400 shrink-0" />
            <span className="text-slate-500 text-xs font-medium">Auth State:</span>
            <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold text-xs bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
              Verified &amp; Stored
            </span>
          </div>
          <div className="flex items-center gap-2.5 text-slate-700">
            <Database className="h-4 w-4 text-slate-400 shrink-0" />
            <span className="text-slate-500 text-xs font-medium">User ID:</span>
            <span className="font-mono text-xs font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{user?.id || user?.userId || 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="space-y-3 shrink-0">
        <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <span>Quick Access Modules</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.title}
                to={item.link}
                className="group relative overflow-hidden bg-white hover:bg-slate-50/80 border border-slate-200/90 hover:border-indigo-300 rounded-2xl p-4 sm:p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/10 flex flex-col justify-between shadow-xs"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-gradient-to-tr ${item.color} flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 group-hover:text-indigo-600 bg-slate-100 group-hover:bg-indigo-50 px-2.5 py-0.5 rounded-full border border-slate-200 group-hover:border-indigo-200 transition-colors">
                    {item.badge}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors flex items-center justify-between">
                    {item.title}
                    <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">{item.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
