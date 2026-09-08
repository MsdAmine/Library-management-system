import React, { useState, useEffect, useCallback } from 'react';
import { 
  ArrowLeftRight, 
  Search, 
  Plus, 
  Filter, 
  X, 
  RotateCcw, 
  Archive, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle,
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight, 
  BookOpen, 
  User as UserIcon, 
  Calendar, 
  Clock, 
  DollarSign, 
  Layers, 
  Sparkles, 
  RefreshCw, 
  ShieldCheck,
  Check,
  FileText,
  BadgeAlert,
  SlidersHorizontal
} from 'lucide-react';
import borrowingService from '../../api/borrowingService';
import { useAuth } from '../../context/AuthContext';
import CheckoutModal from './CheckoutModal';
import ReturnModal from './ReturnModal';
import ArchiveModal from './ArchiveModal';

const TABS = [
  { id: 'active', label: 'Active Loans', icon: Clock },
  { id: 'all', label: 'All Transactions', icon: Layers },
  { id: 'archived', label: 'Archived Records', icon: Archive, adminOnly: true },
];

const BorrowingList = () => {
  const { role, user } = useAuth();
  const isAdmin = role === 'ADMIN';
  const isLibrarian = role === 'LIBRARIAN';
  const canManageCirculation = isAdmin || isLibrarian;

  // Active Tab
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'all' | 'archived'

  // Data states
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  // Pagination states for 'all' tab
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Search & Filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'BORROWED' | 'OVERDUE' | 'RETURNED'

  // Modals state
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [selectedReturnRecord, setSelectedReturnRecord] = useState(null);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Fetch Borrowings based on current tab
  const fetchBorrowings = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    try {
      if (activeTab === 'archived') {
        const data = await borrowingService.getArchivedRecords();
        setRecords(Array.isArray(data) ? data : []);
        setTotalPages(1);
        setTotalElements(data.length || 0);
      } else if (activeTab === 'active') {
        // Fetch all transactions and filter active/overdue or get first 50
        const data = await borrowingService.getAllBorrowings({
          page: 0,
          size: 100,
          sort: 'borrowDate,desc',
        });
        const allItems = data.content || [];
        const activeItems = allItems.filter(r => r.status === 'BORROWED' || (r.status !== 'RETURNED' && !r.returnDate));
        setRecords(activeItems);
        setTotalPages(1);
        setTotalElements(activeItems.length);
      } else {
        // 'all' tab -> paginated
        const data = await borrowingService.getAllBorrowings({
          page: currentPage,
          size: pageSize,
          sort: 'borrowDate,desc',
        });
        setRecords(data.content || []);
        setTotalPages(data.totalPages || 0);
        setTotalElements(data.totalElements || 0);
      }
    } catch (err) {
      console.error('Failed to load borrowings:', err);
      setFetchError(borrowingService.getErrorMessage(err));
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, currentPage, pageSize]);

  useEffect(() => {
    fetchBorrowings();
  }, [fetchBorrowings]);

  // Compute Overdue Status dynamically for display
  const computeStatus = (record) => {
    if (record.status === 'RETURNED' || record.returnDate) {
      return 'RETURNED';
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(record.dueDate);
    dueDate.setHours(0, 0, 0, 0);

    if (today > dueDate) {
      return 'OVERDUE';
    }
    return 'BORROWED';
  };

  // Compute dynamic estimated fine or recorded fine
  const getFineAmount = (record, currentStatus) => {
    if (record.fineAmount !== undefined && record.fineAmount !== null && Number(record.fineAmount) > 0) {
      return Number(record.fineAmount).toFixed(2);
    }
    if (currentStatus === 'OVERDUE' && !record.returnDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dueDate = new Date(record.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays > 0) {
        return (diffDays * 1.50).toFixed(2);
      }
    }
    return '0.00';
  };

  // Local filtering for quick search and status
  const filteredRecords = records.filter((r) => {
    const status = computeStatus(r);
    
    // Status filter
    if (statusFilter !== 'ALL' && status !== statusFilter) {
      return false;
    }

    // Search query filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const memberName = `${r.user?.firstName || ''} ${r.user?.lastName || ''}`.toLowerCase();
      const memberEmail = (r.user?.email || '').toLowerCase();
      const bookTitle = (r.book?.title || '').toLowerCase();
      const bookAuthor = (r.book?.author || '').toLowerCase();
      const bookIsbn = (r.book?.isbn || '').toLowerCase();
      const recordId = String(r.id);

      return (
        memberName.includes(q) ||
        memberEmail.includes(q) ||
        bookTitle.includes(q) ||
        bookAuthor.includes(q) ||
        bookIsbn.includes(q) ||
        recordId.includes(q)
      );
    }

    return true;
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'RETURNED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Returned
          </span>
        );
      case 'OVERDUE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30 animate-pulse">
            <BadgeAlert className="h-3.5 w-3.5" />
            Overdue
          </span>
        );
      case 'BORROWED':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
            <Clock className="h-3.5 w-3.5" />
            Active Loan
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-200">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-md ${
            toastMessage.type === 'error'
              ? 'bg-rose-950/90 border-rose-500/40 text-rose-200'
              : 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
          }`}>
            {toastMessage.type === 'error' ? (
              <AlertCircle className="h-5 w-5 text-rose-400 flex-shrink-0" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
            )}
            <span className="text-sm font-medium">{toastMessage.message}</span>
            <button
              onClick={() => setToastMessage(null)}
              className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800/80 backdrop-blur-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <ArrowLeftRight className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Circulation & Loan Operations</h1>
          </div>
          <p className="text-sm text-slate-400">
            Track book loans, process returns with automated fine calculation, and monitor member borrowing quotas.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {canManageCirculation && (
            <button
              onClick={() => setIsCheckoutModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 shadow-lg shadow-indigo-600/25 transition-all duration-200 active:scale-95"
            >
              <Plus className="h-4 w-4" />
              <span>New Loan Checkout</span>
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => setIsArchiveModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 transition-all duration-200 active:scale-95"
            >
              <Archive className="h-4 w-4" />
              <span>Archive Records</span>
            </button>
          )}

          <button
            onClick={fetchBorrowings}
            disabled={loading}
            className="p-2.5 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700/80 border border-slate-700 transition-colors"
            title="Refresh list"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tabs & Filter Bar */}
      <div className="space-y-4">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            {TABS.filter(tab => !tab.adminOnly || isAdmin).map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setCurrentPage(0);
                  }}
                  className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all ${
                    isActive
                      ? 'text-indigo-400 border-b-2 border-indigo-500 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="text-xs text-slate-400 hidden sm:block">
            Showing <strong className="text-slate-200">{filteredRecords.length}</strong> records
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Quick Search */}
          <div className="sm:col-span-2 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by member name, book title, author, or Record ID..."
              className="w-full pl-10 pr-10 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Filter className="h-4 w-4" />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-8 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
            >
              <option value="ALL">All Loan Statuses</option>
              <option value="BORROWED">Active Loans Only</option>
              <option value="OVERDUE">Overdue Only</option>
              <option value="RETURNED">Returned Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {fetchError && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-rose-400 flex-shrink-0" />
            <span>{fetchError}</span>
          </div>
          <button
            onClick={fetchBorrowings}
            className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 rounded-lg text-xs font-semibold"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main Table */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden shadow-xl backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-200 divide-y divide-slate-800">
            <thead className="bg-slate-950/60 text-[11px] uppercase tracking-wider font-semibold text-slate-400">
              <tr>
                <th className="px-5 py-3.5">ID</th>
                <th className="px-5 py-3.5">Member</th>
                <th className="px-5 py-3.5">Book Title</th>
                <th className="px-5 py-3.5">Borrow Date</th>
                <th className="px-5 py-3.5">Due Date</th>
                <th className="px-5 py-3.5">Return Date</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Fine</th>
                {canManageCirculation && <th className="px-5 py-3.5 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-normal">
              {loading ? (
                // Skeletons
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="px-5 py-4"><div className="h-4 w-8 bg-slate-800 rounded"></div></td>
                    <td className="px-5 py-4"><div className="h-4 w-28 bg-slate-800 rounded mb-1"></div><div className="h-3 w-36 bg-slate-800/60 rounded"></div></td>
                    <td className="px-5 py-4"><div className="h-4 w-32 bg-slate-800 rounded mb-1"></div><div className="h-3 w-20 bg-slate-800/60 rounded"></div></td>
                    <td className="px-5 py-4"><div className="h-4 w-20 bg-slate-800 rounded"></div></td>
                    <td className="px-5 py-4"><div className="h-4 w-20 bg-slate-800 rounded"></div></td>
                    <td className="px-5 py-4"><div className="h-4 w-20 bg-slate-800 rounded"></div></td>
                    <td className="px-5 py-4"><div className="h-6 w-20 bg-slate-800 rounded-full"></div></td>
                    <td className="px-5 py-4"><div className="h-4 w-12 bg-slate-800 rounded"></div></td>
                    {canManageCirculation && <td className="px-5 py-4 text-right"><div className="h-8 w-24 bg-slate-800 rounded-lg ml-auto"></div></td>}
                  </tr>
                ))
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={canManageCirculation ? 9 : 8} className="px-5 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="h-12 w-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-500">
                        <ArrowLeftRight className="h-6 w-6" />
                      </div>
                      <p className="text-base font-semibold text-slate-300">No circulation records found</p>
                      <p className="text-xs text-slate-500 max-w-sm">
                        {searchTerm || statusFilter !== 'ALL'
                          ? 'No results match the active search and filter criteria.'
                          : 'No borrowing transactions recorded in this view yet.'}
                      </p>
                      {canManageCirculation && (
                        <button
                          onClick={() => setIsCheckoutModalOpen(true)}
                          className="mt-2 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30"
                        >
                          <Plus className="h-3.5 w-3.5" /> Checkout First Book
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => {
                  const status = computeStatus(record);
                  const fine = getFineAmount(record, status);
                  const isReturned = status === 'RETURNED';

                  return (
                    <tr 
                      key={record.id} 
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Record ID */}
                      <td className="px-5 py-4 text-xs font-mono text-slate-400">
                        #{record.id}
                      </td>

                      {/* Member */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-lg bg-indigo-500/15 text-indigo-400 font-semibold flex items-center justify-center text-xs">
                            {record.user?.firstName?.[0] || 'U'}{record.user?.lastName?.[0] || ''}
                          </div>
                          <div>
                            <p className="font-medium text-slate-100">
                              {record.user ? `${record.user.firstName} ${record.user.lastName}` : 'Unknown Member'}
                            </p>
                            <p className="text-xs text-slate-400">{record.user?.email || '—'}</p>
                          </div>
                        </div>
                      </td>

                      {/* Book */}
                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-100 max-w-xs truncate" title={record.book?.title}>
                          {record.book?.title || 'Unknown Book'}
                        </p>
                        <p className="text-xs text-slate-400">
                          {record.book?.author ? `by ${record.book.author}` : ''} {record.book?.isbn ? `· ISBN: ${record.book.isbn}` : ''}
                        </p>
                      </td>

                      {/* Borrow Date */}
                      <td className="px-5 py-4 text-xs text-slate-300">
                        {formatDate(record.borrowDate)}
                      </td>

                      {/* Due Date */}
                      <td className="px-5 py-4 text-xs">
                        <span className={status === 'OVERDUE' ? 'font-semibold text-rose-400' : 'text-slate-300'}>
                          {formatDate(record.dueDate)}
                        </span>
                      </td>

                      {/* Return Date */}
                      <td className="px-5 py-4 text-xs text-slate-400">
                        {record.returnDate ? formatDate(record.returnDate) : <span className="text-slate-600">—</span>}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        {getStatusBadge(status)}
                      </td>

                      {/* Fine */}
                      <td className="px-5 py-4 text-xs">
                        {Number(fine) > 0 ? (
                          <span className="font-semibold text-rose-400 flex items-center gap-0.5">
                            ${fine}
                          </span>
                        ) : (
                          <span className="text-slate-500">$0.00</span>
                        )}
                      </td>

                      {/* Actions */}
                      {canManageCirculation && (
                        <td className="px-5 py-4 text-right">
                          {!isReturned && !record.archived ? (
                            <button
                              onClick={() => {
                                setSelectedReturnRecord(record);
                                setIsReturnModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all active:scale-95 shadow-sm"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                              <span>Process Return</span>
                            </button>
                          ) : (
                            <span className="text-xs text-slate-600 italic">Completed</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls (for 'all' tab) */}
        {activeTab === 'all' && totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-slate-800 bg-slate-950/40 text-xs text-slate-400">
            <div className="flex items-center gap-3">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(0);
                }}
                className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1 focus:outline-none"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span>
                Page <strong className="text-slate-200">{currentPage + 1}</strong> of <strong className="text-slate-200">{totalPages}</strong> ({totalElements} items)
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(0)}
                disabled={currentPage === 0 || loading}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-300"
                title="First page"
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0 || loading}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-300"
                title="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-2 font-medium text-slate-300">
                {currentPage + 1}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage >= totalPages - 1 || loading}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-300"
                title="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages - 1)}
                disabled={currentPage >= totalPages - 1 || loading}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-300"
                title="Last page"
              >
                <ChevronsRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <CheckoutModal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        onSuccess={({ message }) => {
          showToast(message, 'success');
          fetchBorrowings();
        }}
      />

      <ReturnModal
        isOpen={isReturnModalOpen}
        record={selectedReturnRecord}
        onClose={() => {
          setIsReturnModalOpen(false);
          setSelectedReturnRecord(null);
        }}
        onSuccess={({ message }) => {
          showToast(message, 'success');
          fetchBorrowings();
        }}
      />

      <ArchiveModal
        isOpen={isArchiveModalOpen}
        onClose={() => setIsArchiveModalOpen(false)}
        onSuccess={({ message }) => {
          showToast(message, 'success');
          fetchBorrowings();
        }}
      />
    </div>
  );
};

export default BorrowingList;
