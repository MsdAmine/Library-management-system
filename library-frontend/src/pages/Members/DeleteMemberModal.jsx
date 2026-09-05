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
              <h3 className="text-lg font-bold text-white tracking-tight">Deactivate Member Account</h3>
              <p className="text-xs text-slate-400">Soft-delete confirmation for member profile.</p>
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

        {/* Content Body */}
        <div className="px-6 py-2 space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center font-bold text-white shadow-md">
                {(member.firstName?.[0] || 'M') + (member.lastName?.[0] || '')}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white">
                  {member.firstName} {member.lastName}
                </span>
                <span className="text-xs text-slate-400">ID: #{member.id}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-800/60 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span className="truncate" title={member.email}>{member.email}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>Joined {formattedDate}</span>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300/90 text-xs leading-relaxed">
            <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <p>
              This action will <strong>soft-delete</strong> the member. Their profile will be marked inactive and hidden from normal active operations, preserving historic borrowing records.
            </p>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="flex items-center justify-end gap-3 p-6 pt-4 border-t border-slate-800/60 mt-4 bg-slate-950/40">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 active:bg-rose-700 shadow-lg shadow-rose-950/40 border border-rose-500/50 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
