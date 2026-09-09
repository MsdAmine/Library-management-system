import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Trash2, 
  X, 
  User, 
  Mail, 
  Calendar, 
  AlertCircle,
  Loader2,
  ShieldAlert
} from 'lucide-react';
import memberService from '../../api/memberService';

/**
 * Modal Dialog for Confirming Soft-Deletion of a Library Member.
 */
const DeleteMemberModal = ({ isOpen, onClose, onSuccess, member }) => {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setError('');
      setDeleting(false);
    }
  }, [isOpen]);

  // Handle ESC key press to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !deleting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, deleting]);

  if (!isOpen || !member) return null;

  const handleDelete = async () => {
    setError('');
    setDeleting(true);
    try {
      await memberService.deleteMember(member.id);
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Error soft-deleting member:', err);
      const msg = memberService.getErrorMessage(err);
      setError(msg);
    } finally {
      setDeleting(false);
    }
  };

  const formattedDate = member.membershipDate
    ? new Date(member.membershipDate + 'T00:00:00').toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'N/A';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden text-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Danger Accent Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-rose-500 via-red-500 to-amber-500"></div>

        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0 shadow-xs">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">Deactivate Member Account</h3>
              <p className="text-xs text-slate-500 font-medium">Soft-delete confirmation for member profile.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="rounded-xl p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center font-bold text-indigo-700 shadow-xs">
                {(member.firstName?.[0] || 'M') + (member.lastName?.[0] || '')}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-slate-900">
                  {member.firstName} {member.lastName}
                </span>
                <span className="text-xs text-slate-500 font-medium font-mono">ID: #{member.id}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-xs">
              <div className="flex items-center gap-2 text-slate-700 font-medium">
                <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span className="truncate" title={member.email}>{member.email}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 font-medium">
                <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>Joined {formattedDate}</span>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed font-medium">
            <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <p>
              This action will <strong>soft-delete</strong> the member. Their profile will be marked inactive and hidden from normal active operations, preserving historic borrowing records.
            </p>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="flex items-center justify-end gap-3 p-6 pt-4 border-t border-slate-100 bg-slate-50/60">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 shadow-md shadow-rose-600/25 ring-1 ring-rose-500/30 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Deactivating...</span>
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                <span>Confirm Deactivation</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteMemberModal;

