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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
              <ArrowLeftRight className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">New Loan Checkout</h2>
              <p className="text-xs text-slate-500">Issue a book loan to an active library member</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {formError && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-sm">
              <AlertTriangle className="h-5 w-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold block text-rose-900">Checkout Error</span>
                {formError}
              </div>
            </div>
          )}

          {/* 1. Member Selection */}
          <div className="space-y-2" ref={memberDropdownRef}>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              1. Select Member <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                {isSearchingMembers ? (
                  <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
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
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-xs"
              />
              {selectedMember && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMember(null);
                    setMemberQuery('');
                    setMemberActiveLoans([]);
                  }}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Member Dropdown Results */}
            {showMemberDropdown && memberOptions.length > 0 && (
              <div className="relative z-30">
                <ul className="absolute left-0 right-0 mt-1 max-h-52 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl divide-y divide-slate-100">
                  {memberOptions.map((m) => (
                    <li
                      key={m.id}
                      onClick={() => handleSelectMember(m)}
                      className="p-3 hover:bg-slate-50 cursor-pointer flex items-center justify-between text-sm transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100 font-bold flex items-center justify-center text-xs">
                          {m.firstName?.[0]}{m.lastName?.[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">
                            {m.firstName} {m.lastName}
                          </p>
                          <p className="text-xs text-slate-500">{m.email}</p>
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
                  ? 'bg-rose-50 border-rose-200' 
                  : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <UserIcon className="h-4 w-4 text-indigo-600" />
                    <span className="text-sm font-semibold text-slate-900">
                      {selectedMember.firstName} {selectedMember.lastName}
                    </span>
                    <span className="text-xs text-slate-500">({selectedMember.email})</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    {isLoadingQuota ? (
                      <span className="flex items-center gap-1 text-slate-500">
                        <Loader2 className="h-3 w-3 animate-spin text-indigo-600" /> Checking quota...
                      </span>
                    ) : (
                      <span className={`px-2.5 py-1 rounded-full font-bold shadow-xs ${
                        isQuotaExceeded
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : activeLoanCount >= 4
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}>
                        {activeLoanCount} / {MAX_QUOTA} Active Loans
                      </span>
                    )}
                  </div>
                </div>

                {/* Quota Progress Bar */}
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      isQuotaExceeded 
                        ? 'bg-rose-600' 
                        : activeLoanCount >= 4 
                        ? 'bg-amber-500' 
                        : 'bg-indigo-600'
                    }`}
                    style={{ width: `${Math.min((activeLoanCount / MAX_QUOTA) * 100, 100)}%` }}
                  />
                </div>

                {isQuotaExceeded && (
                  <p className="text-xs text-rose-700 mt-2 flex items-center gap-1.5 font-semibold">
                    <ShieldAlert className="h-4 w-4 flex-shrink-0" />
                    Member has reached max loan limit ({MAX_QUOTA}). Return an existing loan before checking out.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* 2. Book Selection */}
          <div className="space-y-2" ref={bookDropdownRef}>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              2. Select Book <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                {isSearchingBooks ? (
                  <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
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
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-xs"
              />
              {selectedBook && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBook(null);
                    setBookQuery('');
                  }}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Book Dropdown Results */}
            {showBookDropdown && bookOptions.length > 0 && (
              <div className="relative z-20">
                <ul className="absolute left-0 right-0 mt-1 max-h-52 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl divide-y divide-slate-100">
                  {bookOptions.map((b) => {
                    const available = (b.availableCopies ?? 0) > 0;
                    return (
                      <li
                        key={b.id}
                        onClick={() => handleSelectBook(b)}
                        className={`p-3 flex items-center justify-between text-sm transition-colors ${
                          available 
                            ? 'hover:bg-slate-50 cursor-pointer' 
                            : 'opacity-60 bg-slate-50 cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 font-bold flex items-center justify-center">
                            <BookOpen className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{b.title}</p>
                            <p className="text-xs text-slate-500">by {b.author} · ISBN: {b.isbn}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold shadow-xs ${
                            available 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
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
                  ? 'bg-rose-50 border-rose-200' 
                  : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{selectedBook.title}</p>
                    <p className="text-xs text-slate-500">by {selectedBook.author} · ISBN: {selectedBook.isbn}</p>
                  </div>
                </div>
                <div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold shadow-xs ${
                    isBookUnavailable
                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}>
                    {selectedBook.availableCopies} in stock
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 3. Loan Period & Policy Summary */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-indigo-600" />
              Loan Period & Terms
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between shadow-xs">
                <span className="text-slate-500 font-medium">Checkout Date:</span>
                <span className="font-bold text-slate-900">{formatDate(today)}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between shadow-xs">
                <span className="text-slate-500 font-medium">Due Date (14 Days):</span>
                <span className="font-bold text-indigo-600">{formatDate(dueDate)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1">
              <Info className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
              <span>Standard circulation policy: 14 days duration. Overdue fine rate is <strong>$1.50 per day</strong>.</span>
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50/70">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2.5 text-sm font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 shadow-xs transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !selectedMember || !selectedBook || isQuotaExceeded || isBookUnavailable}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 cursor-pointer"
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
