import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Trash2, 
  X, 
  BookOpen, 
  Hash, 
  Layers, 
  AlertCircle 
} from 'lucide-react';
import bookService from '../../api/bookService';

/**
 * Modal Dialog for Confirming Soft-Deletion of a Book.
 */
const DeleteBookModal = ({ isOpen, onClose, onSuccess, book }) => {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setError('');
      setDeleting(false);
    }
  }, [isOpen]);

  // Handle ESC key press to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !deleting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, deleting]);

  if (!isOpen || !book) return null;

  const handleDelete = async () => {
    setError('');
    setDeleting(true);
    try {
      await bookService.deleteBook(book.id);
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Error deleting book:', err);
      const msg = bookService.getErrorMessage(err);
      setError(msg);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl shadow-rose-950/20 overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Danger Accent Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-rose-500 via-red-500 to-amber-500"></div>

        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Delete Book Record</h3>
              <p className="text-xs text-slate-400">Confirmation required before performing soft deletion.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-2 space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2.5">
            <div className="flex items-start gap-2.5">
              <BookOpen className="h-4 w-4 text-indigo-400 shrink-0 mt-1" />
              <div>
                <span className="text-xs text-slate-400 font-medium">Title:</span>
                <p className="text-sm font-bold text-white">{book.title}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-800/50">
              <div className="text-slate-300">
                <span className="text-slate-400">Author: </span>
                <span className="font-medium text-slate-200">{book.author}</span>
              </div>
              <div className="text-slate-300">
                <span className="text-slate-400">ISBN: </span>
                <span className="font-mono text-slate-200">{book.isbn || '—'}</span>
              </div>
              <div className="text-slate-300">
                <span className="text-slate-400">Total Stock: </span>
                <span className="font-semibold text-slate-200">{book.totalCopies}</span>
              </div>
              <div className="text-slate-300">
                <span className="text-slate-400">Available: </span>
                <span className="font-semibold text-emerald-400">{book.availableCopies}</span>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300/90 text-xs leading-relaxed">
            <span className="font-semibold text-amber-200">Note: </span>
            This operation will perform a soft deletion. The book will be marked as inactive and removed from public search results, but past borrowing history records will be preserved for auditing.
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 pt-4 border-t border-slate-800/80 bg-slate-900/60 mt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/60 transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 active:scale-[0.98] shadow-lg shadow-rose-600/30 transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
          >
            {deleting ? (
              <>
                <div className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                <span>Deleting Book...</span>
              </>
            ) : (
              <>
                <Trash2 className="h-3.5 w-3.5" />
                <span>Yes, Delete Book</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteBookModal;
