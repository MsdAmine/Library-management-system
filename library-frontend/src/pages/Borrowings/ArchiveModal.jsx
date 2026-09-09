import React, { useState } from 'react';
import { 
  X, 
  Archive, 
  AlertTriangle, 
  CheckCircle2, 
  Loader2, 
  Calendar, 
  ShieldAlert,
  Clock
} from 'lucide-react';
import borrowingService from '../../api/borrowingService';

const ArchiveModal = ({ isOpen, onClose, onSuccess }) => {
  const [retentionDays, setRetentionDays] = useState(90);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleArchive = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const result = await borrowingService.archiveRecords(Number(retentionDays));
      onSuccess?.({
        message: `Successfully archived ${result.archivedCount} returned loan records older than ${retentionDays} days.`,
        result,
      });
      onClose();
    } catch (err) {
      const msg = borrowingService.getErrorMessage(err);
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - Number(retentionDays || 0));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shadow-xs">
              <Archive className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Archive Loan History</h2>
              <p className="text-xs text-slate-500">Soft-archive closed circulation records</p>
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
        <form onSubmit={handleArchive} className="p-6 space-y-5">
          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-sm">
              <AlertTriangle className="h-5 w-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold block text-rose-900">Archive Error</span>
                {error}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Retention Threshold (Days)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Clock className="h-4 w-4" />
              </div>
              <input
                type="number"
                min="1"
                max="3650"
                value={retentionDays}
                onChange={(e) => setRetentionDays(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 shadow-xs transition-all"
                required
              />
            </div>
            <p className="text-xs text-slate-500">
              Only already returned loans before <strong className="text-slate-800">{cutoffDate.toLocaleDateString()}</strong> will be archived.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 text-xs text-purple-900 space-y-1">
            <span className="font-bold block text-purple-950 flex items-center gap-1.5">
              <ShieldAlert className="h-4 w-4 text-purple-600" />
              Admin Maintenance Policy
            </span>
            <p className="text-purple-800 leading-relaxed">
              Archived loans are kept in storage for audit trails and can be viewed at any time in the <strong>Archived Records</strong> tab. Active loans will never be archived.
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 text-sm font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 shadow-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !retentionDays || Number(retentionDays) < 1}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-md shadow-purple-600/20 disabled:opacity-50 transition-all active:scale-95 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Archiving...
                </>
              ) : (
                <>
                  <Archive className="h-4 w-4" />
                  Execute Archive
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ArchiveModal;
