import React from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Users, 
  ArrowLeftRight, 
  BarChart3, 
  Shield, 
  CheckCircle, 
  Sparkles, 
  ArrowUpRight,
  Key,
  Mail,
  Clock,
  Database
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user, role, token } = useAuth();

  const stats = [
    {
      title: 'Book Catalog',
      desc: 'Browse & manage catalog',
      link: '/catalog',
      icon: BookOpen,
      color: 'from-indigo-500 to-blue-600',
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
      color: 'from-purple-500 to-pink-600',
      badge: 'Insights',
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900/60 via-slate-900/80 to-slate-900/90 border border-indigo-500/20 p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Authentication Session Active</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Welcome back, {user?.email?.split('@')[0] || 'Administrator'}!
            </h1>
            <p className="text-slate-400 text-sm sm:text-base max-w-xl">
              You are signed in as <span className="font-semibold text-slate-200">{user?.email}</span> with active role privileges for <span className="font-semibold text-indigo-300">{role || 'USER'}</span>.
            </p>
          </div>

          {/* Quick Status Tag */}
          <div className="flex items-center gap-3 bg-slate-950/60 border border-slate-800 rounded-xl p-4 shrink-0 backdrop-blur-sm">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-400">Backend Status</div>
              <div className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
                Connected (Port 8080)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Authentication & Security Diagnostic Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Profile Card */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Shield className="h-4 w-4 text-indigo-400" />
              Account Identity
            </h3>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {role}
            </span>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2.5 text-slate-300">
              <Mail className="h-4 w-4 text-slate-500 shrink-0" />
              <span className="text-slate-400 text-xs">Email:</span>
              <span className="font-medium text-slate-200 truncate">{user?.email || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-300">
              <Clock className="h-4 w-4 text-slate-500 shrink-0" />
              <span className="text-slate-400 text-xs">Auth State:</span>
              <span className="inline-flex items-center gap-1 text-emerald-400 font-medium text-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                Verified & Stored
              </span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-300">
              <Database className="h-4 w-4 text-slate-500 shrink-0" />
              <span className="text-slate-400 text-xs">User ID:</span>
              <span className="font-mono text-xs text-slate-300">{user?.id || user?.userId || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* JWT Details Card */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-3 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Key className="h-4 w-4 text-amber-400" />
              JWT Auth Interceptor Status
            </h3>
            <span className="text-xs text-slate-500 font-mono">Authorization: Bearer &lt;token&gt;</span>
          </div>
          <p className="text-xs text-slate-400">
            Requests made through <code className="text-indigo-300">src/api/axios.js</code> automatically append this token to all backend REST endpoints under <code className="text-indigo-300">/api/v1/*</code>.
          </p>
          <div className="bg-slate-950/80 rounded-lg p-3 border border-slate-800 font-mono text-xs text-slate-400 break-all select-all">
            <span className="text-indigo-400">Token: </span>
            {token ? `${token.substring(0, 48)}...${token.substring(token.length - 20)}` : 'No active token found in storage'}
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
          <span>Quick Access Modules</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {stats.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.title}
                to={item.link}
                className="group relative overflow-hidden bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700 rounded-xl p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/5 flex flex-col justify-between"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`h-11 w-11 rounded-xl bg-gradient-to-tr ${item.color} flex items-center justify-center text-white shadow-md shadow-slate-950/40 group-hover:scale-105 transition-transform`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 group-hover:text-slate-400 bg-slate-800/50 px-2 py-0.5 rounded-full border border-slate-700/50">
                    {item.badge}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors flex items-center justify-between">
                    {item.title}
                    <ArrowUpRight className="h-4 w-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">{item.desc}</p>
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
