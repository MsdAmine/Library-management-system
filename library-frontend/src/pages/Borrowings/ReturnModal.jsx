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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-xs">
              <RotateCcw className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Process Book Return</h2>
              <p className="text-xs text-slate-500">Check in borrowed book and calculate fines</p>
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

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-sm">
              <AlertTriangle className="h-5 w-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold block text-rose-900">Return Error</span>
                {error}
              </div>
            </div>
          )}

          {/* Book Summary Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3.5">
            <div className="h-11 w-11 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0 shadow-xs">
              <BookOpen className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-slate-900 truncate">{record.book?.title}</h3>
              <p className="text-xs text-slate-500">Author: {record.book?.author || '—'} · ISBN: {record.book?.isbn || '—'}</p>
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-200 text-xs text-slate-600">
                <UserIcon className="h-3.5 w-3.5 text-indigo-600" />
                <span>Borrower: <strong className="text-slate-900 font-semibold">{memberName}</strong></span>
              </div>
            </div>
          </div>

          {/* Dates Comparison Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block mb-1 font-medium">Borrow Date</span>
              <span className="font-bold text-slate-900">{formatDate(record.borrowDate)}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block mb-1 font-medium">Due Date</span>
              <span className={`font-bold ${isOverdue ? 'text-rose-600' : 'text-slate-900'}`}>
                {formatDate(record.dueDate)}
              </span>
            </div>
          </div>

          {/* Overdue / Fine Status Assessment */}
          {isOverdue ? (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
                  <AlertTriangle className="h-4 w-4 text-rose-600" />
                  <span>Loan is Overdue</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200 shadow-xs">
                  {daysOverdue} {daysOverdue === 1 ? 'Day' : 'Days'} Late
                </span>
              </div>

              <div className="p-3 rounded-lg bg-white border border-rose-200 flex items-center justify-between shadow-xs">
                <div className="text-xs text-slate-600">
                  <span>Rate: $1.50 × {daysOverdue} days</span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500 block">Total Fine Due:</span>
                  <span className="text-lg font-extrabold text-rose-600">${estimatedFine}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                <div>
                  <span className="text-sm font-bold text-emerald-900 block">On Time Return</span>
                  <span className="text-xs text-emerald-700">Returned within the 14-day loan window.</span>
                </div>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-xs">
                $0.00 Fine
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
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
            onClick={handleConfirmReturn}
            disabled={submitting}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-all active:scale-95 cursor-pointer"
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
