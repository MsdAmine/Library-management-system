import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  BookOpen,
  ArrowLeftRight,
  Clock,
  DollarSign,
  Users,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  PieChart,
  ArrowUpRight,
  Layers,
  Activity,
  AlertCircle,
  Percent,
} from 'lucide-react';
import analyticsService, { DEFAULT_ANALYTICS } from '../../api/analyticsService';
import { useAuth } from '../../context/AuthContext';
import UnauthorizedPage from '../auth/UnauthorizedPage';

// Formatters
const formatCurrency = (val) => {
  const num = Number(val) || 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

const formatNumber = (val) => {
  const num = Number(val) || 0;
  return new Intl.NumberFormat('en-US').format(num);
};

const formatPercent = (val) => {
  if (isNaN(val) || !isFinite(val)) return '0.0%';
  return `${Math.min(100, Math.max(0, val)).toFixed(1)}%`;
};

const AnalyticsDashboard = () => {
  const { role, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Role check: Only ADMIN and LIBRARIAN can access analytics
  const hasAccess = role === 'ADMIN' || role === 'LIBRARIAN';

  const [data, setData] = useState(DEFAULT_ANALYTICS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchAnalytics = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setErrorMessage('');

    try {
      const result = await analyticsService.getAnalytics();
      setData(result);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Analytics fetch error:', err);
      setErrorMessage(analyticsService.getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && hasAccess) {
      fetchAnalytics();
    }
  }, [isAuthenticated, hasAccess, fetchAnalytics]);

  // If user is authenticated but not authorized, render UnauthorizedPage
  if (isAuthenticated && !hasAccess) {
    return <UnauthorizedPage />;
  }

  // Extract normalized metrics safely
  const { bookStats, borrowingStats, memberStats } = data;

  // Calculated ratios & percentages
  const totalCopies = bookStats.totalCopies || 0;
  const availableCopies = bookStats.availableCopies || 0;
  const borrowedCopies = bookStats.borrowedCopies || 0;
  const totalTitles = bookStats.totalTitles || 0;

  const availablePct = totalCopies > 0 ? (availableCopies / totalCopies) * 100 : 0;
  const borrowedPct = totalCopies > 0 ? (borrowedCopies / totalCopies) * 100 : 0;
  const avgCopiesPerTitle = totalTitles > 0 ? (totalCopies / totalTitles).toFixed(1) : '0';

  const activeLoans = borrowingStats.activeBorrowings || 0;
  const overdueLoans = borrowingStats.overdueBorrowings || 0;
  const lifetimeLoans = borrowingStats.totalLifetimeBorrowings || 0;
  const totalFines = borrowingStats.totalFinesCollected || 0;

  const overduePctOfActive = activeLoans > 0 ? (overdueLoans / activeLoans) * 100 : 0;
  const onTimeLoans = Math.max(0, activeLoans - overdueLoans);
  const onTimePctOfActive = activeLoans > 0 ? (onTimeLoans / activeLoans) * 100 : 100;

  const totalMembers = memberStats.totalMembers || 0;
  const activeBorrowers = memberStats.activeBorrowers || 0;
  const memberParticipationPct = totalMembers > 0 ? (activeBorrowers / totalMembers) * 100 : 0;
  const avgLoansPerActiveBorrower = activeBorrowers > 0 ? (activeLoans / activeBorrowers).toFixed(1) : '0';

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-xs">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="h-11 w-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                  Library Analytics &amp; Reports
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {role} Access
                </span>
              </div>
              <p className="text-sm text-slate-500 font-medium">
                Real-time operational metrics, circulation health, inventory distribution, and patron engagement.
              </p>
            </div>
          </div>
        </div>

        {/* Action & Timestamp Bar */}
        <div className="flex items-center gap-3 self-start md:self-center flex-wrap">
          {lastUpdated && (
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-600 shadow-xs">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            </div>
          )}

          <button
            id="refresh-analytics-btn"
            onClick={() => fetchAnalytics(true)}
            disabled={loading || refreshing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:text-indigo-700 bg-white hover:bg-indigo-50/60 border border-slate-200 hover:border-indigo-200 shadow-xs transition-all duration-200 active:scale-95 disabled:opacity-50 cursor-pointer"
            title="Refresh aggregate metrics"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                refreshing || loading ? 'animate-spin text-indigo-600' : 'text-slate-500'
              }`}
            />
            <span>{refreshing ? 'Refreshing...' : 'Refresh Metrics'}</span>
          </button>
        </div>
      </div>

      {/* Error Alert with Retry */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
            <div>
              <p className="font-semibold">Unable to refresh aggregate metrics</p>
              <p className="text-xs text-rose-700">{errorMessage}</p>
            </div>
          </div>
          <button
            onClick={() => fetchAnalytics(true)}
            className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Metric KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
        {/* Card 1: Catalog Titles & Physical Copies */}
        <div className="bg-white border border-slate-200/90 hover:border-indigo-200 rounded-2xl p-5 shadow-xs transition-all duration-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Catalog Inventory
              </span>
              <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shadow-xs">
                <BookOpen className="h-4.5 w-4.5" />
              </div>
            </div>

            {loading ? (
              <div className="space-y-2 mt-4 animate-pulse">
                <div className="h-8 w-24 bg-slate-100 rounded"></div>
                <div className="h-4 w-32 bg-slate-100 rounded"></div>
              </div>
            ) : (
              <div className="mt-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                    {formatNumber(totalTitles)}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">Titles</span>
                </div>
                <div className="text-xs font-medium text-slate-500 mt-1">
                  <strong className="text-slate-800">{formatNumber(totalCopies)}</strong> physical copies
                </div>
              </div>
            )}
          </div>

          {/* Inline Stock Progress Bar */}
          <div className="pt-4 mt-2 border-t border-slate-100 space-y-1.5">
            <div className="flex justify-between text-[11px] font-semibold">
              <span className="text-emerald-700">{formatPercent(availablePct)} Available</span>
              <span className="text-indigo-600">{formatPercent(borrowedPct)} Borrowed</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
              <div
                className="bg-emerald-500 transition-all duration-500"
                style={{ width: `${availablePct}%` }}
                title={`Available: ${formatNumber(availableCopies)} copies`}
              ></div>
              <div
                className="bg-indigo-500 transition-all duration-500"
                style={{ width: `${borrowedPct}%` }}
                title={`Borrowed: ${formatNumber(borrowedCopies)} copies`}
              ></div>
            </div>
          </div>
        </div>

        {/* Card 2: Lifetime & Active Loans */}
        <div className="bg-white border border-slate-200/90 hover:border-emerald-200 rounded-2xl p-5 shadow-xs transition-all duration-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Circulation Volume
              </span>
              <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shadow-xs">
                <ArrowLeftRight className="h-4.5 w-4.5" />
              </div>
            </div>

            {loading ? (
              <div className="space-y-2 mt-4 animate-pulse">
                <div className="h-8 w-20 bg-slate-100 rounded"></div>
                <div className="h-4 w-28 bg-slate-100 rounded"></div>
              </div>
            ) : (
              <div className="mt-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                    {formatNumber(activeLoans)}
                  </span>
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    Active
                  </span>
                </div>
                <div className="text-xs font-medium text-slate-500 mt-1">
                  <strong className="text-slate-800">{formatNumber(lifetimeLoans)}</strong> lifetime loans
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="font-medium">Active Utilization:</span>
            <span className="font-bold text-slate-800">
              {totalCopies > 0 ? formatPercent((activeLoans / totalCopies) * 100) : '0%'}
            </span>
          </div>
        </div>

        {/* Card 3: Overdue Borrowings */}
        <div className={`bg-white border ${
          overdueLoans > 0 ? 'border-rose-200 ring-1 ring-rose-100' : 'border-slate-200/90 hover:border-amber-200'
        } rounded-2xl p-5 shadow-xs transition-all duration-200 flex flex-col justify-between`}>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Overdue Loans
              </span>
              <div className={`h-9 w-9 rounded-xl ${
                overdueLoans > 0
                  ? 'bg-rose-50 text-rose-600 border border-rose-200'
                  : 'bg-amber-50 text-amber-600 border border-amber-100'
              } flex items-center justify-center shadow-xs`}>
                <Clock className="h-4.5 w-4.5" />
              </div>
            </div>

            {loading ? (
              <div className="space-y-2 mt-4 animate-pulse">
                <div className="h-8 w-16 bg-slate-100 rounded"></div>
                <div className="h-4 w-32 bg-slate-100 rounded"></div>
              </div>
            ) : (
              <div className="mt-3">
                <div className="flex items-baseline gap-2">
                  <span className={`text-3xl font-extrabold tracking-tight ${
                    overdueLoans > 0 ? 'text-rose-600' : 'text-slate-900'
                  }`}>
                    {formatNumber(overdueLoans)}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">Items</span>
                </div>
                <div className="text-xs font-medium text-slate-500 mt-1">
                  Past return deadline
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 mt-2 border-t border-slate-100">
            {overdueLoans > 0 ? (
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 w-full justify-center">
                <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                <span>Action Required ({formatPercent(overduePctOfActive)} of loans)</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 w-full justify-center">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span>100% On-Time Compliance</span>
              </div>
            )}
          </div>
        </div>

        {/* Card 4: Total Fines Collected */}
        <div className="bg-white border border-slate-200/90 hover:border-amber-200 rounded-2xl p-5 shadow-xs transition-all duration-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Fines Collected
              </span>
              <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shadow-xs">
                <DollarSign className="h-4.5 w-4.5" />
              </div>
            </div>

            {loading ? (
              <div className="space-y-2 mt-4 animate-pulse">
                <div className="h-8 w-24 bg-slate-100 rounded"></div>
                <div className="h-4 w-28 bg-slate-100 rounded"></div>
              </div>
            ) : (
              <div className="mt-3">
                <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {formatCurrency(totalFines)}
                </div>
                <div className="text-xs font-medium text-slate-500 mt-1">
                  Overdue penalty revenue
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="font-medium">Currency Standard:</span>
            <span className="font-mono font-bold text-slate-800">USD ($)</span>
          </div>
        </div>

        {/* Card 5: Member Engagement */}
        <div className="bg-white border border-slate-200/90 hover:border-purple-200 rounded-2xl p-5 shadow-xs transition-all duration-200 flex flex-col justify-between sm:col-span-2 lg:col-span-1">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Patron Community
              </span>
              <div className="h-9 w-9 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shadow-xs">
                <Users className="h-4.5 w-4.5" />
              </div>
            </div>

            {loading ? (
              <div className="space-y-2 mt-4 animate-pulse">
                <div className="h-8 w-20 bg-slate-100 rounded"></div>
                <div className="h-4 w-32 bg-slate-100 rounded"></div>
              </div>
            ) : (
              <div className="mt-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                    {formatNumber(totalMembers)}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">Patrons</span>
                </div>
                <div className="text-xs font-medium text-slate-500 mt-1">
                  <strong className="text-purple-700">{formatNumber(activeBorrowers)}</strong> active borrowers
                </div>
              </div>
            )}
          </div>

          {/* Member Participation Progress Bar */}
          <div className="pt-4 mt-2 border-t border-slate-100 space-y-1.5">
            <div className="flex justify-between text-[11px] font-semibold">
              <span className="text-purple-700">{formatPercent(memberParticipationPct)} Active</span>
              <span className="text-slate-400">Ratio: {activeBorrowers}/{totalMembers}</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="bg-purple-600 h-full transition-all duration-500 rounded-full"
                style={{ width: `${memberParticipationPct}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Ratios & Analytical Breakdowns Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel 1: Inventory Health & Stock Distribution */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <PieChart className="h-4 w-4" />
              </div>
              <h2 className="text-base font-bold text-slate-900">Inventory Distribution</h2>
            </div>
            <span className="text-xs font-semibold text-slate-500">Stock Availability</span>
          </div>

          {/* Dual Bar Display */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-emerald-700">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                Available on Shelf ({formatNumber(availableCopies)})
              </span>
              <span className="flex items-center gap-1.5 text-indigo-700">
                <span className="h-2.5 w-2.5 rounded-full bg-indigo-500"></span>
                Borrowed ({formatNumber(borrowedCopies)})
              </span>
            </div>

            <div className="h-4 w-full bg-slate-100 rounded-xl overflow-hidden flex p-0.5 gap-0.5">
              <div
                className="bg-emerald-500 rounded-l-lg transition-all duration-500"
                style={{ width: `${availablePct}%` }}
                title={`Available: ${formatPercent(availablePct)}`}
              ></div>
              <div
                className="bg-indigo-600 rounded-r-lg transition-all duration-500"
                style={{ width: `${borrowedPct}%` }}
                title={`Borrowed: ${formatPercent(borrowedPct)}`}
              ></div>
            </div>
          </div>

          {/* Breakdown Data List */}
          <div className="space-y-3 pt-2 text-xs">
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-600 font-medium">Total Titles in Catalog</span>
              <span className="font-bold text-slate-900">{formatNumber(totalTitles)}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-600 font-medium">Total Physical Volumes</span>
              <span className="font-bold text-slate-900">{formatNumber(totalCopies)}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-600 font-medium">Avg. Copies per Title</span>
              <span className="font-bold text-indigo-600">{avgCopiesPerTitle}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-slate-600 font-medium">Shelf Availability Rate</span>
              <span className="font-bold text-emerald-600">{formatPercent(availablePct)}</span>
            </div>
          </div>
        </div>

        {/* Panel 2: Circulation Health & Return Compliance */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Activity className="h-4 w-4" />
              </div>
              <h2 className="text-base font-bold text-slate-900">Loan Health &amp; Compliance</h2>
            </div>
            <span className="text-xs font-semibold text-slate-500">Circulation Rate</span>
          </div>

          {/* Dual Bar Display for Loan Health */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-emerald-700">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                On-Time Loans ({formatNumber(onTimeLoans)})
              </span>
              <span className="flex items-center gap-1.5 text-rose-700">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500"></span>
                Overdue ({formatNumber(overdueLoans)})
              </span>
            </div>

            <div className="h-4 w-full bg-slate-100 rounded-xl overflow-hidden flex p-0.5 gap-0.5">
              <div
                className="bg-emerald-500 rounded-l-lg transition-all duration-500"
                style={{ width: `${onTimePctOfActive}%` }}
                title={`On-Time: ${formatPercent(onTimePctOfActive)}`}
              ></div>
              <div
                className="bg-rose-500 rounded-r-lg transition-all duration-500"
                style={{ width: `${overduePctOfActive}%` }}
                title={`Overdue: ${formatPercent(overduePctOfActive)}`}
              ></div>
            </div>
          </div>

          {/* Breakdown Data List */}
          <div className="space-y-3 pt-2 text-xs">
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-600 font-medium">Currently Active Loans</span>
              <span className="font-bold text-slate-900">{formatNumber(activeLoans)}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-600 font-medium">Compliance Rate</span>
              <span className="font-bold text-emerald-600">{formatPercent(onTimePctOfActive)}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-600 font-medium">Lifetime Transactions</span>
              <span className="font-bold text-slate-900">{formatNumber(lifetimeLoans)}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-slate-600 font-medium">Total Late Penalties</span>
              <span className="font-bold text-amber-600">{formatCurrency(totalFines)}</span>
            </div>
          </div>
        </div>

        {/* Panel 3: Patron Engagement & Density */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <Users className="h-4 w-4" />
              </div>
              <h2 className="text-base font-bold text-slate-900">Patron Participation</h2>
            </div>
            <span className="text-xs font-semibold text-slate-500">Community Metrics</span>
          </div>

          {/* Dual Bar Display for Member Participation */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-purple-700">
                <span className="h-2.5 w-2.5 rounded-full bg-purple-600"></span>
                Active Borrowers ({formatNumber(activeBorrowers)})
              </span>
              <span className="flex items-center gap-1.5 text-slate-500">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-300"></span>
                Inactive ({formatNumber(Math.max(0, totalMembers - activeBorrowers))})
              </span>
            </div>

            <div className="h-4 w-full bg-slate-100 rounded-xl overflow-hidden flex p-0.5 gap-0.5">
              <div
                className="bg-purple-600 rounded-l-lg transition-all duration-500"
                style={{ width: `${memberParticipationPct}%` }}
                title={`Active: ${formatPercent(memberParticipationPct)}`}
              ></div>
              <div
                className="bg-slate-300 rounded-r-lg transition-all duration-500"
                style={{ width: `${100 - memberParticipationPct}%` }}
                title={`Inactive: ${formatPercent(100 - memberParticipationPct)}`}
              ></div>
            </div>
          </div>

          {/* Breakdown Data List */}
          <div className="space-y-3 pt-2 text-xs">
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-600 font-medium">Registered Patron Cards</span>
              <span className="font-bold text-slate-900">{formatNumber(totalMembers)}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-600 font-medium">Active Patron Participation</span>
              <span className="font-bold text-purple-600">{formatPercent(memberParticipationPct)}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-600 font-medium">Avg. Loans / Active Patron</span>
              <span className="font-bold text-indigo-600">{avgLoansPerActiveBorrower}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-slate-600 font-medium">Patron Engagement Status</span>
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <Sparkles className="h-3 w-3" /> Healthy
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Navigation Footer Cards */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Direct Operational Shortcuts</h3>
            <p className="text-xs text-slate-500">Quickly jump to underlying records and circulation actions.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/catalog')}
            className="flex items-center justify-between p-4 bg-white hover:bg-indigo-50/40 rounded-2xl border border-slate-200 hover:border-indigo-200 shadow-xs transition group cursor-pointer text-left"
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <BookOpen className="h-4.5 w-4.5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors block">
                  Book Catalog
                </span>
                <span className="text-[11px] text-slate-500">Manage {formatNumber(totalTitles)} titles</span>
              </div>
            </div>
            <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
          </button>

          <button
            onClick={() => navigate('/loans')}
            className="flex items-center justify-between p-4 bg-white hover:bg-emerald-50/40 rounded-2xl border border-slate-200 hover:border-emerald-200 shadow-xs transition group cursor-pointer text-left"
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <ArrowLeftRight className="h-4.5 w-4.5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 group-hover:text-emerald-600 transition-colors block">
                  Loan Desk
                </span>
                <span className="text-[11px] text-slate-500">{formatNumber(activeLoans)} active checkouts</span>
              </div>
            </div>
            <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
          </button>

          <button
            onClick={() => navigate('/members')}
            className="flex items-center justify-between p-4 bg-white hover:bg-purple-50/40 rounded-2xl border border-slate-200 hover:border-purple-200 shadow-xs transition group cursor-pointer text-left"
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Users className="h-4.5 w-4.5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 group-hover:text-purple-600 transition-colors block">
                  Member Directory
                </span>
                <span className="text-[11px] text-slate-500">{formatNumber(totalMembers)} patrons registered</span>
              </div>
            </div>
            <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-purple-600 transition-colors" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
