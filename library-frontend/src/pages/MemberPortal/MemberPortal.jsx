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
  ChevronRight,
  BookmarkPlus,
  BookmarkCheck,
  BookmarkX,
  Trash2,
  Loader2,
  Users,
  CreditCard,
  Receipt,
  ShieldAlert,
  ShieldCheck,
  Ban
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import borrowingService from '../../api/borrowingService';
import reservationService from '../../api/reservationService';
import fineService from '../../api/fineService';
import PayFineModal from './PayFineModal';

const MAX_QUOTA = 5;
const FINE_PER_DAY = 1.50;
const MAX_OUTSTANDING_FINE_CAP = 10.00;

/**
 * Personal Member Dashboard Component for Logged-in Patrons (Role.USER).
 */
const MemberPortal = () => {
  const { user, role } = useAuth();
  const memberId = user?.id || user?.userId || localStorage.getItem('userId');

  // Tab navigation: 'active' | 'holds' | 'fines' | 'history'
  const [activeTab, setActiveTab] = useState('active');

  // Data states
  const [activeLoans, setActiveLoans] = useState([]);
  const [holds, setHolds] = useState([]);
  const [fines, setFines] = useState([]);
  const [historyRecords, setHistoryRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [cancellingHoldId, setCancellingHoldId] = useState(null);

  // Pay Fine Modal state
  const [selectedFineForPayment, setSelectedFineForPayment] = useState(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);

  // Pagination for history
  const [historyPage, setHistoryPage] = useState(0);
  const [historyTotalPages, setHistoryTotalPages] = useState(0);
  const [historyTotalElements, setHistoryTotalElements] = useState(0);

  // Fetch Member's Active Loans, Holds, Fines, and History
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

      // 2. Fetch member holds
      try {
        const holdsData = await reservationService.getMyHolds();
        setHolds(Array.isArray(holdsData) ? holdsData : []);
      } catch (holdErr) {
        console.warn('Failed to load holds:', holdErr);
      }

      // 3. Fetch member fine ledger
      try {
        const finesData = await fineService.getMyFines();
        setFines(Array.isArray(finesData) ? finesData : []);
      } catch (fineErr) {
        console.warn('Failed to load fines:', fineErr);
      }

      // 4. Fetch history records
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

  // Compute Hold Metrics
  const pendingHolds = holds.filter((h) => h.status === 'PENDING');
  const pendingHoldsCount = pendingHolds.length;

  // Compute Fine Metrics from Domain Ledger
  const pendingFines = fines.filter((f) => f.status === 'PENDING');
  const pendingFinesTotal = pendingFines.reduce((acc, f) => acc + (parseFloat(f.amount) || 0), 0);
  const paidFinesTotal = fines.filter((f) => f.status === 'PAID').reduce((acc, f) => acc + (parseFloat(f.amount) || 0), 0);
  const isBorrowingBlockedByFine = pendingFinesTotal > MAX_OUTSTANDING_FINE_CAP;

  // Helper for overdue calculation on active loans
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

  const overdueLoansCount = activeLoans.filter((item) => getOverdueDetails(item.dueDate).isOverdue).length;

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return '—';
    return new Date(dateTimeStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Handle Cancel Hold
  const handleCancelHold = async (reservation) => {
    if (!window.confirm(`Are you sure you want to cancel your hold for "${reservation.bookTitle || 'this book'}"?`)) {
      return;
    }

    setCancellingHoldId(reservation.id);
    setError('');
    setActionSuccess('');

    try {
      await reservationService.cancelHold(reservation.id);
      setActionSuccess(`Hold request for "${reservation.bookTitle || 'Book'}" has been successfully cancelled.`);
      await fetchMemberData();
      setTimeout(() => setActionSuccess(''), 4500);
    } catch (err) {
      setError(reservationService.getErrorMessage(err));
    } finally {
      setCancellingHoldId(null);
    }
  };

  const handleOpenPayFine = (fine) => {
    setSelectedFineForPayment(fine);
    setIsPayModalOpen(true);
  };

  const handlePaymentSuccess = (fine, ref) => {
    setActionSuccess(`Payment of $${Number(fine.amount).toFixed(2)} received successfully (Ref: ${ref}). Your ledger balance has been updated.`);
    fetchMemberData();
    setTimeout(() => setActionSuccess(''), 6000);
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
              View your current book checkouts, manage waitlist holds, settle overdue fines, and track your complete borrowing ledger.
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

      {/* Outstanding Fine Policy Cap Banner */}
      {isBorrowingBlockedByFine && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-gradient-to-r from-rose-500 via-rose-600 to-rose-700 text-white shadow-lg shadow-rose-500/20 border border-rose-400/40">
          <div className="flex items-start gap-3.5">
            <div className="h-10 w-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
              <ShieldAlert className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white">
                Borrowing Privileges Suspended: Outstanding Balance ${pendingFinesTotal.toFixed(2)}
              </h2>
              <p className="text-xs text-rose-100 font-medium mt-0.5">
                Your total pending fines exceed the library checkout limit of ${MAX_OUTSTANDING_FINE_CAP.toFixed(2)}. Please settle outstanding fines to resume borrowing.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('fines')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white text-rose-700 hover:bg-rose-50 text-xs font-extrabold shadow-md transition-all cursor-pointer shrink-0"
          >
            <span>Settle Fines Now</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Account Status & Quota KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
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
                ? 'No active loans. You can borrow up to 5 books.'
                : activeCount >= MAX_QUOTA
                ? 'Limit reached. Return a book to borrow more.'
                : `You can borrow ${remainingQuota} more.`}
            </p>
          </div>
        </div>

        {/* Card 2: Active Holds / Waitlist */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0 shadow-xs">
                <BookmarkCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Waitlist Holds</p>
                <p className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                  {pendingHoldsCount}
                </p>
              </div>
            </div>
            <span
              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                pendingHoldsCount > 0
                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              {pendingHoldsCount > 0 ? 'Active Holds' : 'No Holds'}
            </span>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <p className="text-[11px] text-slate-500 font-medium">
              {pendingHoldsCount > 0
                ? `${pendingHoldsCount} ${pendingHoldsCount === 1 ? 'book reservation' : 'book reservations'} in queue.`
                : 'No pending waitlist reservations.'}
            </p>
          </div>
        </div>

        {/* Card 3: Return Status & Overdue Alerts */}
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
                ? 'Please return overdue items to the library desk.'
                : activeCount > 0
                ? 'All borrowed titles are within 14-day window.'
                : 'No books currently due.'}
            </p>
          </div>
        </div>

        {/* Card 4: Fine Ledger & Outstanding Balance */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className={`h-11 w-11 rounded-2xl border flex items-center justify-center shrink-0 shadow-xs ${
                pendingFinesTotal > 0
                  ? 'bg-amber-50 border-amber-200 text-amber-600'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-600'
              }`}>
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Pending Fines</p>
                <p className={`text-2xl font-extrabold tracking-tight mt-0.5 ${
                  pendingFinesTotal > 0 ? 'text-amber-600' : 'text-slate-900'
                }`}>
                  ${pendingFinesTotal.toFixed(2)}
                </p>
              </div>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              isBorrowingBlockedByFine
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : pendingFinesTotal > 0
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}>
              {isBorrowingBlockedByFine ? 'Blocked' : pendingFinesTotal > 0 ? 'Payable' : 'Clear'}
            </span>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <p className="text-[11px] text-slate-500 font-medium">
              {pendingFines.length > 0
                ? `${pendingFines.length} pending fine${pendingFines.length === 1 ? '' : 's'} on record.`
                : 'No pending fines on account.'}
            </p>
            {pendingFines.length > 0 && (
              <button
                onClick={() => setActiveTab('fines')}
                className="text-[11px] font-bold text-amber-700 hover:text-amber-900 flex items-center gap-1"
              >
                <span>View</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Tabs Container */}
      <div className="bg-white border border-slate-200/90 rounded-3xl shadow-xs overflow-hidden">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 pt-4 bg-slate-50/50 overflow-x-auto">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('active')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-semibold text-xs sm:text-sm transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'active'
                  ? 'border-indigo-600 text-indigo-600 font-bold bg-white rounded-t-xl shadow-xs'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Clock className="h-4 w-4" />
              <span>Active Loans ({activeCount})</span>
            </button>

            <button
              onClick={() => setActiveTab('holds')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-semibold text-xs sm:text-sm transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'holds'
                  ? 'border-purple-600 text-purple-600 font-bold bg-white rounded-t-xl shadow-xs'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <BookmarkCheck className="h-4 w-4" />
              <span>My Holds &amp; Reservations ({pendingHoldsCount})</span>
            </button>

            <button
              onClick={() => setActiveTab('fines')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-semibold text-xs sm:text-sm transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'fines'
                  ? 'border-amber-600 text-amber-600 font-bold bg-white rounded-t-xl shadow-xs'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <DollarSign className="h-4 w-4" />
              <span>Fines &amp; Payment Ledger ({pendingFines.length > 0 ? `${pendingFines.length} Pending` : 'Clean'})</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-semibold text-xs sm:text-sm transition-all cursor-pointer whitespace-nowrap ${
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
          {actionSuccess && (
            <div className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-semibold">{actionSuccess}</div>
            </div>
          )}

          {error && (
            <div className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm">
              <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-semibold">{error}</div>
            </div>
          )}

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3 text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              <p className="text-xs font-semibold">Loading member records...</p>
            </div>
          ) : activeTab === 'active' ? (
            /* Active Loans Tab */
            activeLoans.length === 0 ? (
              <div className="py-12 text-center flex flex-col items-center justify-center space-y-4">
                <div className="h-16 w-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500 shadow-xs">
                  <BookOpen className="h-8 w-8" />
                </div>
                <div className="space-y-1 max-w-sm">
                  <h3 className="text-base font-bold text-slate-900">No active book checkouts</h3>
                  <p className="text-xs text-slate-500">
                    You currently don't have any borrowed books. Explore our online library catalog to borrow up to {MAX_QUOTA} books.
                  </p>
                </div>
                <Link
                  to="/catalog"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all"
                >
                  <Search className="h-3.5 w-3.5" />
                  <span>Search Catalog</span>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeLoans.map((item) => {
                  const overdue = getOverdueDetails(item.dueDate);
                  return (
                    <div
                      key={item.id}
                      className={`p-5 rounded-2xl border transition-all shadow-xs flex flex-col justify-between space-y-4 ${
                        overdue.isOverdue
                          ? 'bg-rose-50/40 border-rose-200'
                          : overdue.isDueToday
                          ? 'bg-amber-50/40 border-amber-200'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                            Loan #{item.id}
                          </span>
                          <h4 className="text-sm font-bold text-slate-900 leading-snug">
                            {item.book?.title || 'Unknown Title'}
                          </h4>
                          <p className="text-xs text-slate-500 font-medium">
                            Author: {item.book?.author || 'Unknown'} {item.book?.isbn ? `• ISBN: ${item.book.isbn}` : ''}
                          </p>
                        </div>

                        <span
                          className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border shrink-0 ${
                            overdue.isOverdue
                              ? 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse'
                              : overdue.isDueToday
                              ? 'bg-amber-100 text-amber-800 border-amber-300'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {overdue.statusText}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-slate-100">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Borrowed</p>
                          <p className="font-semibold text-slate-700 mt-0.5">{formatDate(item.borrowDate)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Due Date</p>
                          <p className={`font-semibold mt-0.5 ${overdue.isOverdue ? 'text-rose-600' : 'text-slate-900'}`}>
                            {formatDate(item.dueDate)}
                          </p>
                        </div>
                      </div>

                      {overdue.isOverdue && (
                        <div className="p-3 rounded-xl bg-rose-100/70 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                            <span>Estimated Overdue Fee:</span>
                          </div>
                          <span className="font-extrabold text-rose-950">${overdue.estimatedFine}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )
          ) : activeTab === 'holds' ? (
            /* Holds Tab */
            holds.length === 0 ? (
              <div className="py-12 text-center flex flex-col items-center justify-center space-y-4">
                <div className="h-16 w-16 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shadow-xs">
                  <BookmarkPlus className="h-8 w-8" />
                </div>
                <div className="space-y-1 max-w-sm">
                  <h3 className="text-base font-bold text-slate-900">No active book reservations</h3>
                  <p className="text-xs text-slate-500">
                    When high-demand books are fully checked out, you can place a hold to reserve your spot in the waitlist.
                  </p>
                </div>
                <Link
                  to="/catalog"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-sm transition-all"
                >
                  <Search className="h-3.5 w-3.5" />
                  <span>Browse Books to Reserve</span>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/90 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      <th className="py-3.5 px-4 sm:px-6">Book Title</th>
                      <th className="py-3.5 px-4">Reserved On</th>
                      <th className="py-3.5 px-4 text-center">Waitlist Position</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                      <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {holds.map((hold) => {
                      const isPending = hold.status === 'PENDING';
                      return (
                        <tr key={hold.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 sm:px-6 font-bold text-slate-900">
                            <div className="flex flex-col">
                              <span>{hold.bookTitle || 'Unknown Title'}</span>
                              <span className="text-[11px] text-slate-500 font-normal">
                                by {hold.bookAuthor || 'Unknown Author'} {hold.bookIsbn ? `• ISBN: ${hold.bookIsbn}` : ''}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">{formatDateTime(hold.reservationDate)}</td>
                          <td className="py-3.5 px-4 text-center">
                            {isPending && hold.queuePosition ? (
                              <span className="inline-flex items-center justify-center h-6 min-w-6 px-2 rounded-full text-xs font-extrabold bg-purple-100 text-purple-800 border border-purple-200">
                                #{hold.queuePosition} in Queue
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs">—</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                isPending
                                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                                  : hold.status === 'FULFILLED'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-slate-100 text-slate-600 border-slate-200'
                              }`}
                            >
                              {hold.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 sm:px-6 text-right">
                            {isPending ? (
                              <button
                                onClick={() => handleCancelHold(hold)}
                                disabled={cancellingHoldId === hold.id}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-700 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                              >
                                {cancellingHoldId === hold.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <BookmarkX className="h-3.5 w-3.5" />
                                )}
                                <span>Cancel Hold</span>
                              </button>
                            ) : (
                              <span className="text-slate-400 text-[11px] font-medium italic">Completed</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          ) : activeTab === 'fines' ? (
            /* Fines & Payment Ledger Tab */
            fines.length === 0 ? (
              <div className="py-12 text-center flex flex-col items-center justify-center space-y-4">
                <div className="h-16 w-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-xs">
                  <ShieldCheck className="h-8 w-8" />
                </div>
                <div className="space-y-1 max-w-sm">
                  <h3 className="text-base font-bold text-slate-900">Zero Outstanding Fines</h3>
                  <p className="text-xs text-slate-500">
                    Your account has a clean financial ledger with zero accrued overdue fees. All borrowings are in good standing!
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Ledger Header KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/90">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-amber-800">Total Unpaid Fines</p>
                    <p className="text-2xl font-extrabold text-amber-950 mt-1">
                      ${pendingFinesTotal.toFixed(2)}
                    </p>
                    <p className="text-[11px] text-amber-700 mt-1">
                      {pendingFines.length} pending record{pendingFines.length === 1 ? '' : 's'}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/90">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">Total Settled Fines</p>
                    <p className="text-2xl font-extrabold text-emerald-950 mt-1">
                      ${paidFinesTotal.toFixed(2)}
                    </p>
                    <p className="text-[11px] text-emerald-700 mt-1">
                      Paid &amp; verified transactions
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Borrowing Cap Status</p>
                    <p className={`text-sm font-extrabold mt-1.5 ${isBorrowingBlockedByFine ? 'text-rose-600' : 'text-emerald-700'}`}>
                      {isBorrowingBlockedByFine ? 'Over $10.00 Limit (Blocked)' : 'Eligible for Borrowing'}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Policy threshold: $10.00 max
                    </p>
                  </div>
                </div>

                {/* Ledger Table */}
                <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/90 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                        <th className="py-3.5 px-4 sm:px-6">Book Title / ID</th>
                        <th className="py-3.5 px-4">Due Date</th>
                        <th className="py-3.5 px-4">Return Date</th>
                        <th className="py-3.5 px-4 text-right">Amount</th>
                        <th className="py-3.5 px-4 text-center">Status</th>
                        <th className="py-3.5 px-4">Settlement Details</th>
                        <th className="py-3.5 px-4 sm:px-6 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {fines.map((fine) => {
                        const isPending = fine.status === 'PENDING';
                        return (
                          <tr key={fine.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3.5 px-4 sm:px-6 font-bold text-slate-900">
                              <div className="flex flex-col">
                                <span>{fine.bookTitle || 'Book Fine'}</span>
                                <span className="text-[11px] text-slate-500 font-normal">
                                  Fine #{fine.id} • Loan #{fine.borrowingRecordId}
                                </span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-slate-600">{formatDate(fine.dueDate)}</td>
                            <td className="py-3.5 px-4 font-semibold text-slate-800">
                              {formatDate(fine.returnDate)}
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono font-extrabold text-sm text-slate-900">
                              ${Number(fine.amount).toFixed(2)}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              {isPending && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
                                  <Clock className="h-3 w-3" /> PENDING
                                </span>
                              )}
                              {fine.status === 'PAID' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <CheckCircle2 className="h-3 w-3" /> PAID
                                </span>
                              )}
                              {fine.status === 'WAIVED' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-50 text-purple-700 border border-purple-200">
                                  <Sparkles className="h-3 w-3" /> WAIVED
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 max-w-xs">
                              {fine.paymentReference && (
                                <div className="text-[11px] font-mono text-slate-700 font-semibold truncate">
                                  Ref: {fine.paymentReference}
                                </div>
                              )}
                              {fine.notes && (
                                <div className="text-[11px] text-slate-500 italic truncate" title={fine.notes}>
                                  {fine.notes}
                                </div>
                              )}
                              {fine.settledAt && (
                                <div className="text-[10px] text-slate-400">
                                  Settled: {formatDate(fine.settledAt)}
                                </div>
                              )}
                              {!fine.paymentReference && !fine.notes && (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 sm:px-6 text-right">
                              {isPending ? (
                                <button
                                  onClick={() => handleOpenPayFine(fine)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-xs transition-all cursor-pointer"
                                >
                                  <CreditCard className="h-3.5 w-3.5" />
                                  <span>Pay Fine</span>
                                </button>
                              ) : (
                                <span className="text-[11px] text-emerald-600 font-semibold inline-flex items-center gap-1">
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  <span>Settled</span>
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          ) : (
            /* Borrowing History View */
            historyRecords.length === 0 ? (
              <div className="py-12 text-center flex flex-col items-center justify-center space-y-4">
                <div className="h-16 w-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 shadow-xs">
                  <History className="h-8 w-8" />
                </div>
                <div className="space-y-1 max-w-sm">
                  <h3 className="text-base font-bold text-slate-900">No borrowing history yet</h3>
                  <p className="text-xs text-slate-500">
                    Past returned books and completed loan transactions will be recorded here for your review.
                  </p>
                </div>
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
                        <th className="py-3.5 px-4 sm:px-6 text-right">Fine Paid</th>
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

      {/* Pay Fine Modal Dialog */}
      <PayFineModal
        isOpen={isPayModalOpen}
        onClose={() => {
          setIsPayModalOpen(false);
          setSelectedFineForPayment(null);
        }}
        fine={selectedFineForPayment}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
};

export default MemberPortal;
