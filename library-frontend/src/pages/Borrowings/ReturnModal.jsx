import React, { useState } from 'react';
import { 
  X, 
  RotateCcw, 
  BookOpen, 
  User as UserIcon, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  DollarSign, 
  Loader2, 
  Clock,
  ShieldCheck,
  Receipt
} from 'lucide-react';
import borrowingService from '../../api/borrowingService';

const DAILY_FINE_RATE = 1.50;

const ReturnModal = ({ isOpen, onClose, record, onSuccess }) => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !record) return null;

  // Calculate overdue days and fine estimation
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(record.dueDate);
  dueDate.setHours(0, 0, 0, 0);

  const diffTime = today.getTime() - dueDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const isOverdue = diffDays > 0;
  const daysOverdue = isOverdue ? diffDays : 0;
  const estimatedFine = (daysOverdue * DAILY_FINE_RATE).toFixed(2);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleConfirmReturn = async () => {
    setSubmitting(true);
    setError('');

    try {
      const response = await borrowingService.returnBook(record.id);
      onSuccess?.({
        message: `Book "${record.book?.title || 'Book'}" has been successfully returned.`,
        returnDTO: response,
      });
      onClose();
    } catch (err) {
      const msg = borrowingService.getErrorMessage(err);
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const memberName = record.user 
    ? `${record.user.firstName} ${record.user.lastName}` 
    : 'Unknown Member';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <RotateCcw className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Process Book Return</h2>
              <p className="text-xs text-slate-400">Check in borrowed book and calculate fines</p>
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

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-300 text-sm">
              <AlertTriangle className="h-5 w-5 text-rose-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold block text-rose-200">Return Error</span>
                {error}
              </div>
            </div>
          )}

          {/* Book Summary Card */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-3.5">
            <div className="h-11 w-11 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center flex-shrink-0">
              <BookOpen className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-white truncate">{record.book?.title}</h3>
              <p className="text-xs text-slate-400">Author: {record.book?.author || '—'} · ISBN: {record.book?.isbn || '—'}</p>
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-700/60 text-xs text-slate-300">
                <UserIcon className="h-3.5 w-3.5 text-indigo-400" />
                <span>Borrower: <strong className="text-white">{memberName}</strong></span>
              </div>
            </div>
          </div>

          {/* Dates Comparison Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50">
              <span className="text-slate-400 block mb-1">Borrow Date</span>
              <span className="font-semibold text-slate-200">{formatDate(record.borrowDate)}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50">
              <span className="text-slate-400 block mb-1">Due Date</span>
              <span className={`font-semibold ${isOverdue ? 'text-rose-400' : 'text-slate-200'}`}>
                {formatDate(record.dueDate)}
              </span>
            </div>
          </div>

          {/* Overdue / Fine Status Assessment */}
          {isOverdue ? (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-rose-300 font-semibold text-sm">
                  <AlertTriangle className="h-4 w-4 text-rose-400" />
                  <span>Loan is Overdue</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  {daysOverdue} {daysOverdue === 1 ? 'Day' : 'Days'} Late
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/80 border border-rose-500/20 flex items-center justify-between">
                <div className="text-xs text-slate-400">
                  <span>Rate: $1.50 × {daysOverdue} days</span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Total Fine Due:</span>
                  <span className="text-lg font-bold text-rose-400">${estimatedFine}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                <div>
                  <span className="text-sm font-semibold text-emerald-200 block">On Time Return</span>
                  <span className="text-xs text-emerald-400/80">Returned within the 14-day loan window.</span>
                </div>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                $0.00 Fine
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
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
            onClick={handleConfirmReturn}
            disabled={submitting}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl shadow-lg shadow-emerald-600/30 disabled:opacity-50 transition-all active:scale-95"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing Return...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Confirm & Return Book
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReturnModal;
