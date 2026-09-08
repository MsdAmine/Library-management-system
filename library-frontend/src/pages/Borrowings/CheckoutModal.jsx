import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  ArrowLeftRight, 
  User as UserIcon, 
  BookOpen, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  Loader2, 
  ShieldAlert, 
  Clock, 
  Layers,
  Sparkles,
  Info
} from 'lucide-react';
import borrowingService from '../../api/borrowingService';
import memberService from '../../api/memberService';
import bookService from '../../api/bookService';

const MAX_QUOTA = 5;

const CheckoutModal = ({ isOpen, onClose, onSuccess }) => {
  // Selection states
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);

  // Search states for Member
  const [memberQuery, setMemberQuery] = useState('');
  const [memberOptions, setMemberOptions] = useState([]);
  const [isSearchingMembers, setIsSearchingMembers] = useState(false);
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);

  // Member quota tracking
  const [memberActiveLoans, setMemberActiveLoans] = useState([]);
  const [isLoadingQuota, setIsLoadingQuota] = useState(false);

  // Search states for Book
  const [bookQuery, setBookQuery] = useState('');
  const [bookOptions, setBookOptions] = useState([]);
  const [isSearchingBooks, setIsSearchingBooks] = useState(false);
  const [showBookDropdown, setShowBookDropdown] = useState(false);

  // Form submission states
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const memberDropdownRef = useRef(null);
  const bookDropdownRef = useRef(null);

  // Reset modal state on open/close
  useEffect(() => {
    if (isOpen) {
      setSelectedMember(null);
      setSelectedBook(null);
      setMemberQuery('');
      setMemberOptions([]);
      setMemberActiveLoans([]);
      setBookQuery('');
      setBookOptions([]);
      setFormError('');
      setSubmitting(false);
    }
  }, [isOpen]);

  // Click outside listener for dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (memberDropdownRef.current && !memberDropdownRef.current.contains(event.target)) {
        setShowMemberDropdown(false);
      }
      if (bookDropdownRef.current && !bookDropdownRef.current.contains(event.target)) {
        setShowBookDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounce Member Search
  useEffect(() => {
    if (!memberQuery.trim() || (selectedMember && `${selectedMember.firstName} ${selectedMember.lastName}` === memberQuery)) {
      setMemberOptions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingMembers(true);
      try {
        const data = await memberService.searchMembers({ name: memberQuery.trim(), size: 8 });
        setMemberOptions(data.content || []);
        setShowMemberDropdown(true);
      } catch (err) {
        console.error('Member search error:', err);
      } finally {
        setIsSearchingMembers(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [memberQuery, selectedMember]);

  // Debounce Book Search
  useEffect(() => {
    if (!bookQuery.trim() || (selectedBook && selectedBook.title === bookQuery)) {
      setBookOptions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingBooks(true);
      try {
        const data = await bookService.searchBooks({ title: bookQuery.trim(), size: 8 });
        setBookOptions(data.content || []);
        setShowBookDropdown(true);
      } catch (err) {
        console.error('Book search error:', err);
      } finally {
        setIsSearchingBooks(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [bookQuery, selectedBook]);

  // When a member is selected, fetch active borrowings to evaluate quota
  const handleSelectMember = async (member) => {
    setSelectedMember(member);
    setMemberQuery(`${member.firstName} ${member.lastName}`);
    setShowMemberDropdown(false);
    setFormError('');

    setIsLoadingQuota(true);
    try {
      const activeLoans = await borrowingService.getMemberActiveBorrowings(member.id);
      setMemberActiveLoans(activeLoans || []);
    } catch (err) {
      console.error('Failed to fetch active loans for member:', err);
      setMemberActiveLoans([]);
    } finally {
      setIsLoadingQuota(false);
    }
  };

  const handleSelectBook = (book) => {
    setSelectedBook(book);
    setBookQuery(book.title);
    setShowBookDropdown(false);
    setFormError('');
  };

  const activeLoanCount = memberActiveLoans.length;
  const isQuotaExceeded = activeLoanCount >= MAX_QUOTA;
  const isBookUnavailable = selectedBook && (selectedBook.availableCopies ?? 0) <= 0;

  // Loan period dates
  const today = new Date();
  const dueDate = new Date();
  dueDate.setDate(today.getDate() + 14);

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMember) {
      setFormError('Please select a valid member.');
      return;
    }
    if (!selectedBook) {
      setFormError('Please select a valid book.');
      return;
    }
    if (isQuotaExceeded) {
      setFormError(`Member has reached the maximum allowed limit of ${MAX_QUOTA} active loans.`);
      return;
    }
    if (isBookUnavailable) {
      setFormError('The selected book has no available copies in stock.');
      return;
    }

    setSubmitting(true);
    setFormError('');

    try {
      const result = await borrowingService.borrowBook(selectedMember.id, selectedBook.id);
      onSuccess?.({
        message: `Successfully checked out "${selectedBook.title}" to ${selectedMember.firstName} ${selectedMember.lastName}.`,
        record: result,
      });
      onClose();
    } catch (err) {
      const msg = borrowingService.getErrorMessage(err);
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <ArrowLeftRight className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">New Loan Checkout</h2>
              <p className="text-xs text-slate-400">Issue a book loan to an active library member</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {formError && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-300 text-sm">
              <AlertTriangle className="h-5 w-5 text-rose-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold block text-rose-200">Checkout Error</span>
                {formError}
              </div>
            </div>
          )}

          {/* 1. Member Selection */}
          <div className="space-y-2" ref={memberDropdownRef}>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              1. Select Member <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                {isSearchingMembers ? (
                  <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
                ) : (
                  <UserIcon className="h-4 w-4" />
                )}
              </div>
              <input
                type="text"
                value={memberQuery}
                onChange={(e) => {
                  setMemberQuery(e.target.value);
                  if (selectedMember) setSelectedMember(null);
                }}
                onFocus={() => {
                  if (memberOptions.length > 0) setShowMemberDropdown(true);
                }}
                placeholder="Search member by first name, last name, or email..."
                className="w-full pl-10 pr-10 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
              />
              {selectedMember && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMember(null);
                    setMemberQuery('');
                    setMemberActiveLoans([]);
                  }}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Member Dropdown Results */}
            {showMemberDropdown && memberOptions.length > 0 && (
              <div className="relative z-30">
                <ul className="absolute left-0 right-0 mt-1 max-h-52 overflow-y-auto bg-slate-800 border border-slate-700 rounded-xl shadow-xl divide-y divide-slate-700/50">
                  {memberOptions.map((m) => (
                    <li
                      key={m.id}
                      onClick={() => handleSelectMember(m)}
                      className="p-3 hover:bg-slate-700/70 cursor-pointer flex items-center justify-between text-sm transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-indigo-500/20 text-indigo-300 font-semibold flex items-center justify-center text-xs">
                          {m.firstName?.[0]}{m.lastName?.[0]}
                        </div>
                        <div>
                          <p className="font-medium text-slate-100">
                            {m.firstName} {m.lastName}
                          </p>
                          <p className="text-xs text-slate-400">{m.email}</p>
                        </div>
                      </div>
                      <span className="text-xs text-slate-400 font-mono">ID #{m.id}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Selected Member Quota Card */}
            {selectedMember && (
              <div className={`p-4 rounded-xl border transition-all ${
                isQuotaExceeded 
                  ? 'bg-rose-500/10 border-rose-500/30' 
                  : 'bg-slate-800/60 border-slate-700/60'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <UserIcon className="h-4 w-4 text-indigo-400" />
                    <span className="text-sm font-semibold text-slate-200">
                      {selectedMember.firstName} {selectedMember.lastName}
                    </span>
                    <span className="text-xs text-slate-400">({selectedMember.email})</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    {isLoadingQuota ? (
                      <span className="flex items-center gap-1 text-slate-400">
                        <Loader2 className="h-3 w-3 animate-spin" /> Checking quota...
                      </span>
                    ) : (
                      <span className={`px-2.5 py-1 rounded-full font-semibold ${
                        isQuotaExceeded
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : activeLoanCount >= 4
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}>
                        {activeLoanCount} / {MAX_QUOTA} Active Loans
                      </span>
                    )}
                  </div>
                </div>

                {/* Quota Progress Bar */}
                <div className="w-full bg-slate-700/60 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      isQuotaExceeded 
                        ? 'bg-rose-500' 
                        : activeLoanCount >= 4 
                        ? 'bg-amber-500' 
                        : 'bg-indigo-500'
                    }`}
                    style={{ width: `${Math.min((activeLoanCount / MAX_QUOTA) * 100, 100)}%` }}
                  />
                </div>

                {isQuotaExceeded && (
                  <p className="text-xs text-rose-400 mt-2 flex items-center gap-1.5 font-medium">
                    <ShieldAlert className="h-4 w-4 flex-shrink-0" />
                    Member has reached max loan limit ({MAX_QUOTA}). Return an existing loan before checking out.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* 2. Book Selection */}
          <div className="space-y-2" ref={bookDropdownRef}>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              2. Select Book <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                {isSearchingBooks ? (
                  <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
                ) : (
                  <BookOpen className="h-4 w-4" />
                )}
              </div>
              <input
                type="text"
                value={bookQuery}
                onChange={(e) => {
                  setBookQuery(e.target.value);
                  if (selectedBook) setSelectedBook(null);
                }}
                onFocus={() => {
                  if (bookOptions.length > 0) setShowBookDropdown(true);
                }}
                placeholder="Search catalog by book title or author..."
                className="w-full pl-10 pr-10 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
              />
              {selectedBook && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBook(null);
                    setBookQuery('');
                  }}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Book Dropdown Results */}
            {showBookDropdown && bookOptions.length > 0 && (
              <div className="relative z-20">
                <ul className="absolute left-0 right-0 mt-1 max-h-52 overflow-y-auto bg-slate-800 border border-slate-700 rounded-xl shadow-xl divide-y divide-slate-700/50">
                  {bookOptions.map((b) => {
                    const available = (b.availableCopies ?? 0) > 0;
                    return (
                      <li
                        key={b.id}
                        onClick={() => handleSelectBook(b)}
                        className={`p-3 flex items-center justify-between text-sm transition-colors ${
                          available 
                            ? 'hover:bg-slate-700/70 cursor-pointer' 
                            : 'opacity-60 bg-slate-800/50 cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-cyan-500/15 text-cyan-300 font-semibold flex items-center justify-center">
                            <BookOpen className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-100">{b.title}</p>
                            <p className="text-xs text-slate-400">by {b.author} · ISBN: {b.isbn}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            available 
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                              : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          }`}>
                            {b.availableCopies} available
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* Selected Book Card */}
            {selectedBook && (
              <div className={`p-4 rounded-xl border flex items-center justify-between ${
                isBookUnavailable 
                  ? 'bg-rose-500/10 border-rose-500/30' 
                  : 'bg-slate-800/60 border-slate-700/60'
              }`}>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">{selectedBook.title}</p>
                    <p className="text-xs text-slate-400">by {selectedBook.author} · ISBN: {selectedBook.isbn}</p>
                  </div>
                </div>
                <div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                    isBookUnavailable
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}>
                    {selectedBook.availableCopies} in stock
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 3. Loan Period & Policy Summary */}
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-indigo-400" />
              Loan Period & Terms
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Checkout Date:</span>
                <span className="font-semibold text-slate-200">{formatDate(today)}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Due Date (14 Days):</span>
                <span className="font-semibold text-indigo-300">{formatDate(dueDate)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1">
              <Info className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />
              <span>Standard circulation policy: 14 days duration. Overdue fine rate is <strong>$1.50 per day</strong>.</span>
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-slate-900/90">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2.5 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 rounded-xl border border-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !selectedMember || !selectedBook || isQuotaExceeded || isBookUnavailable}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 rounded-xl shadow-lg shadow-indigo-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing Checkout...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Confirm Checkout
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;
