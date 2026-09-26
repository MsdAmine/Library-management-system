import React, { useState, useEffect, useCallback } from 'react';
import {
  DollarSign,
  X,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  FileText,
  Clock,
  Ban,
  Loader2,
  RefreshCw,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  User
} from 'lucide-react';
import fineService from '../../api/fineService';

const MAX_OUTSTANDING_LIMIT = 10.00;

/**
 * Staff Modal Dialog for Viewing Member Fines, Collecting Cash/Card Payments, and Granting Administrative Waivers.
 */
const MemberFinesModal = ({ isOpen, onClose, member, onFineUpdated }) => {
  const [fines, setFines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Selected fine for pay / waive sub-action
  const [selectedFine, setSelectedFine] = useState(null);
  const [actionType, setActionType] = useState(null); // 'pay' | 'waive' | null
  const [paymentMethod, setPaymentMethod] = useState('CASH'); // 'CASH' | 'CARD' | 'BANK' | 'CUSTOM'
  const [paymentRef, setPaymentRef] = useState('');
  const [waiveNotes, setWaiveNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchFines = useCallback(async () => {
    if (!member?.id) return;
    setLoading(true);
    setError('');
    try {
      const data = await fineService.getMemberFines(member.id);
      setFines(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load member fines:', err);
      setError(fineService.getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [member?.id]);

  useEffect(() => {
    if (isOpen && member) {
      fetchFines();
      setSelectedFine(null);
      setActionType(null);
      setError('');
      setActionSuccess('');
      setPaymentRef('');
      setWaiveNotes('');
    }
  }, [isOpen, member, fetchFines]);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !submitting) {
        if (actionType) {
          setActionType(null);
          setSelectedFine(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, submitting, actionType, onClose]);

  if (!isOpen || !member) return null;

  // Calculate fine metrics
  const pendingFines = fines.filter((f) => f.status === 'PENDING');
  const outstandingSum = pendingFines.reduce((acc, f) => acc + (parseFloat(f.amount) || 0), 0);
  const isBlockedFromBorrowing = outstandingSum > MAX_OUTSTANDING_LIMIT;

  const handleOpenPay = (fine) => {
    setSelectedFine(fine);
    setActionType('pay');
    setPaymentMethod('CASH');
    setPaymentRef(`CASH-${Date.now().toString().slice(-6)}`);
    setError('');
    setActionSuccess('');
  };

  const handleOpenWaive = (fine) => {
    setSelectedFine(fine);
    setActionType('waive');
    setWaiveNotes('Administrative courtesy waiver approved by staff.');
    setError('');
    setActionSuccess('');
  };

  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
    if (method === 'CASH') {
      setPaymentRef(`CASH-${Date.now().toString().slice(-6)}`);
    } else if (method === 'CARD') {
      setPaymentRef(`POS-${Date.now().toString().slice(-6)}`);
    } else if (method === 'BANK') {
      setPaymentRef(`WIRE-${Date.now().toString().slice(-6)}`);
    } else {
      setPaymentRef('');
    }
  };

  const handleProcessPayment = async (e) => {
    e?.preventDefault();
    if (!selectedFine) return;

    setSubmitting(true);
    setError('');
    try {
      await fineService.payFine(selectedFine.id, paymentRef.trim() || undefined);
      setActionSuccess(`Payment of $${Number(selectedFine.amount).toFixed(2)} recorded successfully.`);
      setActionType(null);
      setSelectedFine(null);
      await fetchFines();
      onFineUpdated?.();
    } catch (err) {
      setError(fineService.getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleProcessWaive = async (e) => {
    e?.preventDefault();
    if (!selectedFine) return;

    setSubmitting(true);
    setError('');
    try {
      await fineService.waiveFine(selectedFine.id, waiveNotes.trim() || undefined);
      setActionSuccess(`Fine #${selectedFine.id} of $${Number(selectedFine.amount).toFixed(2)} has been successfully waived.`);
      setActionType(null);
      setSelectedFine(null);
      await fetchFines();
      onFineUpdated?.();
    } catch (err) {
      setError(fineService.getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-indigo-50/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 shadow-xs">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Member Fine &amp; Ledger Management</span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700">
                  ID: #{member.id}
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {member.firstName} {member.lastName} • {member.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchFines}
              disabled={loading}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-white border border-slate-200/80 transition-all cursor-pointer"
              title="Refresh Fines"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              disabled={submitting}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-white border border-slate-200/80 transition-all cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Outstanding Status Banner */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Outstanding Balance:</span>
              <span className={`ml-2 text-base font-extrabold ${outstandingSum > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                ${outstandingSum.toFixed(2)}
              </span>
            </div>
            <div className="h-4 w-px bg-slate-200 hidden sm:block"></div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Pending Fines:</span>
              <span className="ml-2 text-xs font-bold text-slate-700">
                {pendingFines.length} record{pendingFines.length === 1 ? '' : 's'}
              </span>
            </div>
          </div>

          {isBlockedFromBorrowing ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold animate-pulse">
              <ShieldAlert className="h-3.5 w-3.5 text-rose-600" />
              <span>Checkout Blocked: Exceeds ${MAX_OUTSTANDING_LIMIT.toFixed(2)} Cap</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>Borrowing Eligible (Under $10 Limit)</span>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {actionSuccess && (
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-semibold">{actionSuccess}</div>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm">
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-semibold">{error}</div>
            </div>
          )}

          {/* Sub-form: Pay Fine */}
          {actionType === 'pay' && selectedFine && (
            <form onSubmit={handleProcessPayment} className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200/90 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-amber-200/60 pb-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-amber-700" />
                  <h3 className="text-sm font-bold text-amber-900">
                    Collect Payment for Fine #{selectedFine.id} (${Number(selectedFine.amount).toFixed(2)})
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActionType(null)}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'CASH', label: 'Cash at Desk' },
                      { id: 'CARD', label: 'Credit/Debit Card' },
                      { id: 'BANK', label: 'Bank Transfer' },
                      { id: 'CUSTOM', label: 'Custom Reference' },
                    ].map((pm) => (
                      <button
                        key={pm.id}
                        type="button"
                        onClick={() => handlePaymentMethodChange(pm.id)}
                        className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-all text-left ${
                          paymentMethod === pm.id
                            ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {pm.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Payment Reference / Receipt ID
                  </label>
                  <input
                    type="text"
                    required
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                    placeholder="e.g. CASH-123456 or POS-987"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-white"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Book: "{selectedFine.bookTitle || 'Library Item'}"
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActionType(null)}
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !paymentRef.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-all disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                  <span>Confirm Settlement (${Number(selectedFine.amount).toFixed(2)})</span>
                </button>
              </div>
            </form>
          )}

          {/* Sub-form: Waive Fine */}
          {actionType === 'waive' && selectedFine && (
            <form onSubmit={handleProcessWaive} className="p-5 rounded-2xl bg-purple-50/60 border border-purple-200/90 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-purple-200/60 pb-3">
                <div className="flex items-center gap-2">
                  <Ban className="h-4 w-4 text-purple-700" />
                  <h3 className="text-sm font-bold text-purple-900">
                    Waive Fine #{selectedFine.id} (${Number(selectedFine.amount).toFixed(2)})
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActionType(null)}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Waiver Reason / Notes (Required for audit log)
                </label>
                <textarea
                  rows={2}
                  required
                  value={waiveNotes}
                  onChange={(e) => setWaiveNotes(e.target.value)}
                  placeholder="Reason for fine forgiveness (e.g. system grace period, librarian discretion, medical excuse)..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-purple-500 bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActionType(null)}
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !waiveNotes.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-xs transition-all disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  <span>Grant Waiver</span>
                </button>
              </div>
            </form>
          )}

          {/* Fines Ledger Table */}
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-2">
              <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
              <p className="text-xs font-medium">Loading fine ledger records...</p>
            </div>
          ) : fines.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-700">No Fines On Record</p>
                <p className="text-xs text-slate-500">This member currently has a clean ledger with zero accrued overdue fines.</p>
              </div>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">ID / Book</th>
                    <th className="px-4 py-3">Overdue Info</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Settlement / Notes</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {fines.map((fine) => (
                    <tr key={fine.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">#{fine.id} {fine.bookTitle || 'Book Record'}</div>
                        <div className="text-[11px] text-slate-500">Borrowing ID: #{fine.borrowingRecordId}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-slate-800 font-semibold">
                          {fine.daysOverdue ? `${fine.daysOverdue} days late` : 'Overdue'}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Due: {formatDate(fine.dueDate)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-extrabold text-slate-900 text-sm">
                          ${Number(fine.amount).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {fine.status === 'PENDING' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="h-3 w-3" /> PENDING
                          </span>
                        )}
                        {fine.status === 'PAID' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="h-3 w-3" /> PAID
                          </span>
                        )}
                        {fine.status === 'WAIVED' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-50 text-purple-700 border border-purple-200">
                            <Sparkles className="h-3 w-3" /> WAIVED
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        {fine.paymentReference && (
                          <div className="text-[11px] font-mono text-slate-600 font-semibold truncate">
                            Ref: {fine.paymentReference}
                          </div>
                        )}
                        {fine.notes && (
                          <div className="text-[11px] text-slate-500 italic truncate" title={fine.notes}>
                            {fine.notes}
                          </div>
                        )}
                        {fine.settledAt && (
                          <div className="text-[10px] text-slate-400">
                            Settled: {formatDate(fine.settledAt)}
                          </div>
                        )}
                        {!fine.paymentReference && !fine.notes && (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {fine.status === 'PENDING' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenPay(fine)}
                              disabled={submitting}
                              className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-all cursor-pointer"
                            >
                              Collect
                            </button>
                            <button
                              onClick={() => handleOpenWaive(fine)}
                              disabled={submitting}
                              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition-all cursor-pointer"
                            >
                              Waive
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-semibold">Settled</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <p className="text-[11px] text-slate-500 font-medium">
            Fine Rate: $1.50/day • Maximum checkout allowance: $10.00 outstanding limit
          </p>
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default MemberFinesModal;
