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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-indigo-400" />
            Library Analytics & Reporting
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            System overview and circulation performance metrics.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Total Inventory</span>
            <BookOpen className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-extrabold text-white mt-2">
            {stats?.totalBooks ?? '—'}
          </div>
          <div className="text-xs text-slate-500 mt-1">Books currently in library catalog</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Registered Members</span>
            <Users className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-extrabold text-white mt-2">
            {stats?.totalMembers ?? '—'}
          </div>
          <div className="text-xs text-slate-500 mt-1">Active library patrons</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Active Loans</span>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-white mt-2">
            {stats?.activeLoans ?? '—'}
          </div>
          <div className="text-xs text-slate-500 mt-1">Currently issued books</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Overdue Items</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-white mt-2">
            {stats?.overdueLoans ?? '0'}
          </div>
          <div className="text-xs text-slate-500 mt-1">Pending return past due date</div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
