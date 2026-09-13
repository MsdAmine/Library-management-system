import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Clock, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  DollarSign, 
  Layers, 
  Sparkles, 
  RefreshCw, 
  ArrowRight, 
  BookMarked, 
  History, 
  AlertCircle,
  FileText,
  BadgeAlert,
  Search,
  ExternalLink,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import borrowingService from '../../api/borrowingService';

const MAX_QUOTA = 5;
const FINE_PER_DAY = 1.50;

/**
 * Personal Member Dashboard Component for Logged-in Patrons (Role.USER).
 */
const MemberPortal = () => {
  const { user, role } = useAuth();
  const memberId = user?.id || user?.userId || localStorage.getItem('userId');

  // Tab navigation
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'history'

  // Data states
  const [activeLoans, setActiveLoans] = useState([]);
  const [historyRecords, setHistoryRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Pagination for history
  const [historyPage, setHistoryPage] = useState(0);
  const [historyTotalPages, setHistoryTotalPages] = useState(0);
  const [historyTotalElements, setHistoryTotalElements] = useState(0);

  // Fetch Member's Active Loans and History
  const fetchMemberData = useCallback(async () => {
    if (!memberId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Fetch active loans
      const activeData = await borrowingService.getMemberActiveBorrowings(memberId);
      setActiveLoans(Array.isArray(activeData) ? activeData : []);

      // 2. Fetch history records
      const historyData = await borrowingService.getMemberHistory(memberId, {
        page: historyPage,
        size: 10,
        sort: 'borrowDate,desc',
      });
      setHistoryRecords(historyData.content || []);
      setHistoryTotalPages(historyData.totalPages || 0);
      setHistoryTotalElements(historyData.totalElements || 0);
    } catch (err) {
      console.error('Failed to load member portal data:', err);
      setError(borrowingService.getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [memberId, historyPage]);

  useEffect(() => {
    fetchMemberData();
  }, [fetchMemberData]);

  // Compute Loan Metrics
  const activeCount = activeLoans.length;
  const quotaPercentage = Math.min(100, Math.round((activeCount / MAX_QUOTA) * 100));
  const remainingQuota = Math.max(0, MAX_QUOTA - activeCount);

  // Helper for overdue calculation
  const getOverdueDetails = (dueDateStr) => {
    if (!dueDateStr) return { isOverdue: false, days: 0, estimatedFine: 0, statusText: 'Active' };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const due = new Date(dueDateStr + 'T00:00:00');
    due.setHours(0, 0, 0, 0);

    const diffTime = today - due;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      return {
        isOverdue: true,
        days: diffDays,
        estimatedFine: (diffDays * FINE_PER_DAY).toFixed(2),
        statusText: `${diffDays} ${diffDays === 1 ? 'day' : 'days'} overdue`,
      };
    } else if (diffDays === 0) {
      return {
        isOverdue: false,
        days: 0,
        estimatedFine: '0.00',
        statusText: 'Due today',
        isDueToday: true,
      };
    } else {
      const remainingDays = Math.abs(diffDays);
      return {
        isOverdue: false,
        days: remainingDays,
        estimatedFine: '0.00',
        statusText: `${remainingDays} ${remainingDays === 1 ? 'day' : 'days'} left`,
      };
    }
  };

  // Compute total estimated active fines
  const totalEstimatedFines = activeLoans.reduce((acc, item) => {
    const details = getOverdueDetails(item.dueDate);
    return acc + (details.isOverdue ? parseFloat(details.estimatedFine) : 0);
  }, 0);

  const overdueLoansCount = activeLoans.filter((item) => getOverdueDetails(item.dueDate).isOverdue).length;

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Patron Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 p-6 sm:p-8 shadow-xl shadow-indigo-500/15 text-white">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 text-indigo-100 backdrop-blur-md border border-white/20">
              <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
              <span>Library Member Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Welcome, {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.email?.split('@')[0] || 'Patron'}!
            </h1>
            <p className="text-indigo-100 text-xs sm:text-sm max-w-xl font-medium">
              View your current book checkouts, check upcoming return dates, track borrowing history, and explore new library titles.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchMemberData}
              disabled={loading}
              className="p-2.5 rounded-xl text-indigo-100 hover:text-white bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-sm transition-all cursor-pointer shadow-xs"
              title="Refresh Account Data"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <Link
              to="/catalog"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-indigo-950 bg-white hover:bg-indigo-50 shadow-md shadow-indigo-950/20 transition-all cursor-pointer"
            >
              <BookOpen className="h-4 w-4 text-indigo-600" />
              <span>Browse Catalog</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Account Status & Quota KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Card 1: Active Loan Quota Gauge */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 shadow-xs">
                <BookMarked className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Borrowing Quota</p>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-2xl font-extrabold text-slate-900 tracking-tight">{activeCount}</span>
                  <span className="text-xs font-semibold text-slate-500">/ {MAX_QUOTA} books</span>
                </div>
              </div>
            </div>
            <span
              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                activeCount >= MAX_QUOTA
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : activeCount >= 3
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}
            >
              {activeCount >= MAX_QUOTA ? 'At Limit' : `${remainingQuota} Available`}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  activeCount >= MAX_QUOTA
                    ? 'bg-rose-500'
                    : activeCount >= 3
                    ? 'bg-amber-500'
                    : 'bg-indigo-600'
                }`}
                style={{ width: `${quotaPercentage}%` }}
              ></div>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              {activeCount === 0
                ? 'No active loans. You can check out up to 5 books.'
                : activeCount >= MAX_QUOTA
                ? 'Maximum borrowing limit reached. Please return a book to borrow more.'
                : `You can borrow ${remainingQuota} more ${remainingQuota === 1 ? 'book' : 'books'}.`}
            </p>
          </div>
        </div>

        {/* Card 2: Return Status & Overdue Alerts */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              <div
                className={`h-11 w-11 rounded-2xl border flex items-center justify-center shrink-0 shadow-xs ${
                  overdueLoansCount > 0
                    ? 'bg-rose-50 border-rose-200 text-rose-600'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-600'
                }`}
              >
                {overdueLoansCount > 0 ? <AlertTriangle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Loan Status</p>
                <p
                  className={`text-2xl font-extrabold tracking-tight mt-0.5 ${
                    overdueLoansCount > 0 ? 'text-rose-600' : 'text-emerald-700'
                  }`}
                >
                  {overdueLoansCount > 0 ? `${overdueLoansCount} Overdue` : 'All On Time'}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <p className="text-[11px] text-slate-500 font-medium">
              {overdueLoansCount > 0
                ? 'Please return overdue items to the library desk to avoid additional fines.'
                : activeCount > 0
                ? 'All borrowed titles are currently within their standard 14-day loan window.'
                : 'No books currently due.'}
            </p>
          </div>
        </div>

        {/* Card 3: Personal Fine Summary */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0 shadow-xs">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Overdue Fines</p>
                <p className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                  ${totalEstimatedFines.toFixed(2)}
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              $1.50 / day
            </span>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <p className="text-[11px] text-slate-500 font-medium">
              {totalEstimatedFines > 0
                ? 'Estimated overdue fees accrued on current unreturned loans.'
                : 'Zero accumulated fines. Your account is in good standing!'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Tabs Container */}
      <div className="bg-white border border-slate-200/90 rounded-3xl shadow-xs overflow-hidden">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 pt-4 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('active')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-semibold text-xs sm:text-sm transition-all cursor-pointer ${
                activeTab === 'active'
                  ? 'border-indigo-600 text-indigo-600 font-bold bg-white rounded-t-xl shadow-xs'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Clock className="h-4 w-4" />
              <span>Active Loans ({activeCount})</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-semibold text-xs sm:text-sm transition-all cursor-pointer ${
                activeTab === 'history'
                  ? 'border-indigo-600 text-indigo-600 font-bold bg-white rounded-t-xl shadow-xs'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <History className="h-4 w-4" />
              <span>Borrowing History ({historyTotalElements})</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {error && (
            <div className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm">
              <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold">Error loading loans: </span>
                <span>{error}</span>
              </div>
            </div>
          )}

          {loading ? (
            <div className="space-y-4 py-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 border border-slate-100 rounded-2xl animate-pulse">
                  <div className="h-12 w-12 bg-slate-100 rounded-xl"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-1/3 bg-slate-200 rounded"></div>
                    <div className="h-3 w-1/4 bg-slate-100 rounded"></div>
                  </div>
                  <div className="h-8 w-24 bg-slate-100 rounded-xl"></div>
                </div>
              ))}
            </div>
          ) : activeTab === 'active' ? (
            /* Active Loans View */
            activeLoans.length === 0 ? (
              <div className="py-12 text-center flex flex-col items-center justify-center space-y-4">
                <div className="h-16 w-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
                  <BookOpen className="h-8 w-8" />
                </div>
                <div className="space-y-1 max-w-sm">
                  <h3 className="text-base font-bold text-slate-900">No active book loans</h3>
                  <p className="text-xs text-slate-500">
                    You do not currently have any books checked out. Browse the catalog to find your next read!
                  </p>
                </div>
                <Link
                  to="/catalog"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                >
                  <Search className="h-4 w-4" />
                  <span>Explore Book Catalog</span>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/90 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      <th className="py-3.5 px-4 sm:px-6">Book Title &amp; Details</th>
                      <th className="py-3.5 px-4">Borrow Date</th>
                      <th className="py-3.5 px-4">Due Date</th>
                      <th className="py-3.5 px-4 text-center">Remaining Time</th>
                      <th className="py-3.5 px-4 sm:px-6 text-right">Est. Fine</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {activeLoans.map((loan) => {
                      const overdue = getOverdueDetails(loan.dueDate);

                      return (
                        <tr key={loan.id} className="hover:bg-slate-50/80 transition-colors group">
                          {/* Book Details */}
                          <td className="py-4 px-4 sm:px-6">
                            <div className="flex items-center gap-3.5">
                              <div className="h-11 w-11 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0 group-hover:border-indigo-400 transition-colors shadow-xs">
                                <BookOpen className="h-5 w-5" />
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors text-sm">
                                  {loan.book?.title || 'Unknown Title'}
                                </span>
                                <span className="text-[11px] text-slate-500 font-medium">
                                  by {loan.book?.author || 'Unknown Author'} &bull;{' '}
                                  <span className="font-mono text-[10px] text-slate-400">ISBN: {loan.book?.isbn || 'N/A'}</span>
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Borrow Date */}
                          <td className="py-4 px-4 text-slate-700 font-medium">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 text-slate-400" />
                              <span>{formatDate(loan.borrowDate)}</span>
                            </div>
                          </td>

                          {/* Due Date */}
                          <td className="py-4 px-4 font-semibold text-slate-800">
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5 text-indigo-500" />
                              <span>{formatDate(loan.dueDate)}</span>
                            </div>
                          </td>

                          {/* Days Remaining / Overdue Status Badge */}
                          <td className="py-4 px-4 text-center">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border shadow-xs ${
                                overdue.isOverdue
                                  ? 'bg-rose-50 text-rose-700 border-rose-200 ring-1 ring-rose-100'
                                  : overdue.isDueToday
                                  ? 'bg-amber-50 text-amber-700 border-amber-200 ring-1 ring-amber-100'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-100'
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  overdue.isOverdue
                                    ? 'bg-rose-500 animate-pulse'
                                    : overdue.isDueToday
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-500'
                                }`}
                              />
                              {overdue.statusText}
                            </span>
                          </td>

                          {/* Estimated Fine */}
                          <td className="py-4 px-4 sm:px-6 text-right font-mono font-bold">
                            {overdue.isOverdue ? (
                              <span className="text-rose-600">${overdue.estimatedFine}</span>
                            ) : (
                              <span className="text-slate-400">$0.00</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            /* History View */
            historyRecords.length === 0 ? (
              <div className="py-12 text-center flex flex-col items-center justify-center space-y-3">
                <div className="h-14 w-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                  <History className="h-7 w-7" />
                </div>
                <h3 className="text-base font-bold text-slate-900">No borrowing history yet</h3>
                <p className="text-xs text-slate-500 max-w-sm">
                  Once you borrow and return library books, past circulation records will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/90 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                        <th className="py-3.5 px-4 sm:px-6">Book Title</th>
                        <th className="py-3.5 px-4">Borrow Date</th>
                        <th className="py-3.5 px-4">Due Date</th>
                        <th className="py-3.5 px-4">Return Date</th>
                        <th className="py-3.5 px-4 text-center">Status</th>
                        <th className="py-3.5 px-4 sm:px-6 text-right">Fine</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {historyRecords.map((item) => {
                        const isReturned = item.status === 'RETURNED';
                        const fine = parseFloat(item.fineAmount || 0);

                        return (
                          <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3.5 px-4 sm:px-6 font-bold text-slate-900">
                              <div className="flex flex-col">
                                <span>{item.book?.title || 'Unknown Title'}</span>
                                <span className="text-[11px] text-slate-500 font-normal">
                                  by {item.book?.author || 'Unknown Author'}
                                </span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-slate-600">{formatDate(item.borrowDate)}</td>
                            <td className="py-3.5 px-4 text-slate-600">{formatDate(item.dueDate)}</td>
                            <td className="py-3.5 px-4 font-semibold text-slate-800">
                              {formatDate(item.returnDate)}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                  isReturned
                                    ? 'bg-slate-100 text-slate-700 border-slate-200'
                                    : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                }`}
                              >
                                {item.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 sm:px-6 text-right font-mono font-semibold">
                              {fine > 0 ? (
                                <span className="text-rose-600">${fine.toFixed(2)}</span>
                              ) : (
                                <span className="text-slate-400">$0.00</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* History Pagination */}
                {historyTotalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs">
                    <span className="text-slate-500 font-medium">
                      Page <span className="font-bold text-slate-900">{historyPage + 1}</span> of{' '}
                      <span className="font-bold text-slate-900">{historyTotalPages}</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setHistoryPage((p) => Math.max(0, p - 1))}
                        disabled={historyPage === 0 || loading}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer font-semibold"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setHistoryPage((p) => Math.min(historyTotalPages - 1, p + 1))}
                        disabled={historyPage >= historyTotalPages - 1 || loading}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer font-semibold"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default MemberPortal;
