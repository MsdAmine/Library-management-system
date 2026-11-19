import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, BookOpen, Loader2, X } from 'lucide-react';
import borrowingService from '../../api/borrowingService';

const BorrowBookModal = ({ book, memberId, onClose, onSuccess }) => {
  const dialogRef = useRef(null);
  const inFlight = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const dialog = dialogRef.current;
    const trigger = document.activeElement;
    dialog.showModal();
    return () => {
      dialog.close();
      if (trigger?.isConnected) trigger.focus();
    };
  }, []);

  const handleBorrow = async () => {
    if (inFlight.current) return;
    if (!memberId) {
      setError('Please sign in again before borrowing a book.');
      return;
    }
    inFlight.current = true;
    setSubmitting(true);
    setError('');
    let loan;
    try {
      loan = await borrowingService.borrowBook(memberId, book.id);
    } catch (err) {
      setError(borrowingService.getErrorMessage(err));
      return;
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
    onSuccess(loan);
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="borrow-book-title"
      aria-describedby="borrow-book-description"
      aria-busy={submitting}
      onCancel={(event) => {
        event.preventDefault();
        if (!inFlight.current) onClose();
      }}
      className="fixed inset-0 m-auto w-[calc(100%_-_2rem)] max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-900/60 backdrop:backdrop-blur-sm"
    >
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4">
        <h2 id="borrow-book-title" className="flex items-center gap-2 text-lg font-bold">
          <BookOpen className="h-5 w-5 text-indigo-700" aria-hidden="true" />
          Borrow Book
        </h2>
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          aria-label="Close borrow confirmation"
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-200 disabled:opacity-50 cursor-pointer"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
      <div className="space-y-4 p-5">
        {error && (
          <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
            <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
            <p>{error}</p>
          </div>
        )}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="font-bold">{book.title}</p>
          <p className="mt-1 text-sm text-slate-600">By {book.author}</p>
        </div>
        <p id="borrow-book-description" className="text-sm leading-relaxed text-slate-700">
          Confirming creates a loan on your account immediately. The borrowing period is 14 days;
          your exact due date will appear after checkout and in your member portal.
        </p>
        <p className="text-xs leading-relaxed text-slate-600">
          You can have up to 5 outstanding loans. Pending fines above $10 prevent new borrowing.
          Availability is checked when you confirm.
        </p>
      </div>
      <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4">
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-50 cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleBorrow}
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-800 disabled:opacity-50 cursor-pointer"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {submitting ? 'Borrowing...' : 'Confirm Borrow'}
        </button>
      </div>
    </dialog>
  );
};

export default BorrowBookModal;
