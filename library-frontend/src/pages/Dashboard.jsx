import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Users, 
  ArrowLeftRight, 
  BarChart3, 
  ShieldCheck, 
  Sparkles, 
  ArrowUpRight,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { analyticsService } from '../api/analyticsService';
import { fineService } from '../api/fineService';

const Dashboard = () => {
  const { user, role } = useAuth();
  const [metrics, setMetrics] = useState({
    totalBooks: 0,
    activeMembers: 0,
    activeLoans: 0,
    pendingFines: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchDashboardMetrics = async () => {
      try {
        setLoading(true);
        const [analyticsResult, finesResult] = await Promise.allSettled([
          analyticsService.getAnalytics(),
          fineService.getAllFines(),
        ]);

        if (!isMounted) return;

        let totalBooks = 0;
        let activeMembers = 0;
        let activeLoans = 0;
        let pendingFines = 0;

        if (analyticsResult.status === 'fulfilled' && analyticsResult.value) {
          const data = analyticsResult.value;
          totalBooks = data.bookStats?.totalTitles || data.books?.totalTitles || 0;
          activeMembers = data.memberStats?.totalMembers || data.members?.totalMembers || 0;
          activeLoans = data.borrowingStats?.activeBorrowings || data.borrowings?.activeBorrowings || 0;
          pendingFines = data.borrowingStats?.overdueBorrowings || data.borrowings?.overdueBorrowings || 0;
        }

        if (finesResult.status === 'fulfilled' && Array.isArray(finesResult.value)) {
          const unpaid = finesResult.value.filter(
            (f) => f.status === 'PENDING' || f.status === 'UNPAID' || !f.paid
          );
          if (unpaid.length > 0) {
            pendingFines = unpaid.length;
          }
        }

        setMetrics({
          totalBooks,
          activeMembers,
          activeLoans,
          pendingFines,
        });
      } catch (err) {
        console.error('Failed to load dashboard metrics:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDashboardMetrics();
    return () => {
      isMounted = false;
    };
  }, []);

  const userName = user?.email?.split('@')[0] || 'Administrator';

  const statCards = [
    {
      label: 'Total Books',
      value: metrics.totalBooks.toLocaleString(),
      helper: 'In catalog',
      icon: BookOpen,
      iconBg: 'bg-indigo-50 border-indigo-100/90',
      iconColor: 'text-indigo-600',
    },
    {
      label: 'Active Members',
      value: metrics.activeMembers.toLocaleString(),
      helper: 'Registered patrons',
      icon: Users,
      iconBg: 'bg-cyan-50 border-cyan-100/90',
      iconColor: 'text-cyan-600',
    },
    {
      label: 'Active Loans',
      value: metrics.activeLoans.toLocaleString(),
      helper: 'Circulating now',
      icon: ArrowLeftRight,
      iconBg: 'bg-amber-50 border-amber-100/90',
      iconColor: 'text-amber-600',
    },
    {
      label: 'Pending Fines',
      value: metrics.pendingFines.toLocaleString(),
      helper: metrics.pendingFines > 0 ? 'Requires review' : 'All settled',
      icon: AlertCircle,
      iconBg: 'bg-rose-50 border-rose-100/90',
      iconColor: 'text-rose-600',
    },
  ];

  const modules = [
    {
      title: 'Book Catalog',
      desc: 'Browse inventory, track shelf copies, and manage ISBN catalog records.',
      link: '/catalog',
      icon: BookOpen,
      color: 'from-indigo-500 to-indigo-600',
      badge: 'Inventory',
      action: 'Manage catalog',
    },
    {
      title: 'Library Members',
      desc: 'Manage patron accounts, membership cards, and borrower privileges.',
      link: '/members',
      icon: Users,
      color: 'from-cyan-500 to-teal-600',
      badge: 'Community',
      action: 'View directory',
    },
    {
      title: 'Active Loans',
      desc: 'Process book checkouts, handle returns, and inspect overdue items.',
      link: '/loans',
      icon: ArrowLeftRight,
      color: 'from-amber-500 to-orange-600',
      badge: 'Circulation',
      action: 'Process loans',
    },
    {
      title: 'Analytics & Reports',
      desc: 'Analyze borrowing velocity, inventory turnover, and circulation trends.',
      link: '/analytics',
      icon: BarChart3,
      color: 'from-violet-500 to-purple-600',
      badge: 'Insights',
      action: 'Explore metrics',
    },
  ];

  return (
    <div className="space-y-5 sm:space-y-6 animate-in fade-in duration-300">
      {/* 1. Sleek, Compact Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 p-5 sm:p-6 shadow-md shadow-indigo-500/10 text-white shrink-0">
        <div className="absolute top-0 right-0 -mr-12 -mt-12 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
                Welcome back, {userName}!
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur-md border border-white/25 shadow-2xs">
                <ShieldCheck className="h-3 w-3" />
                {role || 'STAFF'}
              </span>
            </div>
            <p className="text-indigo-100 text-xs sm:text-sm">
              Signed in as <span className="font-semibold text-white">{user?.email || 'Authenticated User'}</span> &bull; Library Management Administration Portal
            </p>
          </div>

          <div className="hidden md:flex items-center gap-2 text-xs font-medium text-indigo-100 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 shrink-0">
            <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
            <span>Active Session</span>
          </div>
        </div>
      </div>

      {/* 2. Metrics Overview Bar (4 Subtle Stat Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 shrink-0">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div 
              key={stat.label}
              className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all duration-150 flex items-center gap-3.5"
            >
              <div className={`h-10 w-10 sm:h-11 sm:w-11 rounded-xl flex items-center justify-center shrink-0 border ${stat.iconBg}`}>
                <Icon className={`h-5 w-5 ${stat.iconColor}`} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">
                  {stat.label}
                </div>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                    {loading ? (
                      <span className="inline-block h-5 w-10 bg-slate-100 animate-pulse rounded"></span>
                    ) : (
                      stat.value
                    )}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium truncate hidden sm:inline">
                    {stat.helper}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Quick Access Modules Grid */}
      <div className="space-y-3 shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Quick Access Modules</span>
          </h2>
          <span className="text-xs text-slate-500 font-medium hidden sm:inline">
            Direct navigation to core operations
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {modules.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.title}
                to={item.link}
                className="group relative bg-white hover:bg-slate-50/90 border border-slate-200/90 hover:border-indigo-300 rounded-2xl p-4 sm:p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-500/10 flex flex-col justify-between shadow-xs"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className={`h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-gradient-to-tr ${item.color} flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 group-hover:text-indigo-600 bg-slate-100 group-hover:bg-indigo-50 px-2 py-0.5 rounded-full border border-slate-200 group-hover:border-indigo-200 transition-colors">
                      {item.badge}
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {item.desc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-600 group-hover:text-indigo-600 transition-colors">
                  <span>{item.action}</span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
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
