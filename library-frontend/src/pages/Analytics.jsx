import React, { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Users, BookOpen, Clock, Activity } from 'lucide-react';
import api from '../api/axios';

const Analytics = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get('/analytics');
        setStats(res.data);
      } catch (err) {
        console.warn('Backend analytics endpoint not loaded or returning mock:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
              <BarChart3 className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Library Analytics & Reporting
            </h1>
          </div>
          <p className="text-sm text-slate-500">
            System overview, inventory health, and circulation performance metrics.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Inventory */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs transition-all hover:border-indigo-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Inventory</span>
            <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center">
              <BookOpen className="h-4 w-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-3">
            {stats?.totalBooks ?? '—'}
          </div>
          <div className="text-xs text-slate-500 mt-1 font-medium">Books currently in catalog</div>
        </div>

        {/* Registered Members */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs transition-all hover:border-cyan-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Registered Members</span>
            <div className="h-8 w-8 rounded-lg bg-cyan-50 text-cyan-700 border border-cyan-100 flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-3">
            {stats?.totalMembers ?? '—'}
          </div>
          <div className="text-xs text-slate-500 mt-1 font-medium">Active library patrons</div>
        </div>

        {/* Active Loans */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs transition-all hover:border-emerald-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Loans</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-3">
            {stats?.activeLoans ?? '—'}
          </div>
          <div className="text-xs text-slate-500 mt-1 font-medium">Currently issued books</div>
        </div>

        {/* Overdue Items */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs transition-all hover:border-amber-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Overdue Items</span>
            <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-700 border border-amber-100 flex items-center justify-center">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-3">
            {stats?.overdueLoans ?? '0'}
          </div>
          <div className="text-xs text-slate-500 mt-1 font-medium">Pending return past due date</div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
