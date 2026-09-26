import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  X,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Building,
  Smartphone,
  Lock,
  Sparkles
} from 'lucide-react';
import fineService from '../../api/fineService';

/**
 * Patron Modal for Online Settlement of Library Fines.
 */
const PayFineModal = ({ isOpen, onClose, fine, onPaymentSuccess }) => {
  const [paymentMethod, setPaymentMethod] = useState('CARD'); // 'CARD' | 'DIGITAL_WALLET' | 'BANK'
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('123');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setError('');
      setSubmitting(false);
      setPaymentMethod('CARD');
    }
  }, [isOpen, fine]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !submitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, submitting, onClose]);

  if (!isOpen || !fine) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    let ref = '';
    if (paymentMethod === 'CARD') {
      ref = `CARD-STRIPE-${Date.now().toString().slice(-6)}`;
    } else if (paymentMethod === 'DIGITAL_WALLET') {
      ref = `APPLEPAY-${Date.now().toString().slice(-6)}`;
    } else {
      ref = `BANK-ACH-${Date.now().toString().slice(-6)}`;
    }

    try {
      await fineService.payFine(fine.id, ref);
      onPaymentSuccess?.(fine, ref);
      onClose();
    } catch (err) {
      console.error('Payment error:', err);
      setError(fineService.getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const formattedAmount = Number(fine.amount || 0).toFixed(2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-300 shadow-xs backdrop-blur-xs">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Pay Overdue Fine</h2>
              <p className="text-xs text-indigo-200 font-medium">Fine Record #{fine.id}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={submitting}
            className="p-1.5 rounded-xl text-indigo-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content & Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="font-semibold">{error}</div>
            </div>
          )}

          {/* Amount Due Card */}
          <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">Total Settlement Amount</p>
              <p className="text-xs text-slate-600 mt-0.5 font-medium truncate max-w-[220px]">
                {fine.bookTitle || 'Book Fine'}
              </p>
            </div>
            <div className="text-2xl font-extrabold text-indigo-950 tracking-tight">
              ${formattedAmount}
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
              Select Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('CARD')}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                  paymentMethod === 'CARD'
                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 shadow-xs ring-1 ring-indigo-600'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <CreditCard className="h-4 w-4 text-indigo-600" />
                <span>Card</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('DIGITAL_WALLET')}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                  paymentMethod === 'DIGITAL_WALLET'
                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 shadow-xs ring-1 ring-indigo-600'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <Smartphone className="h-4 w-4 text-purple-600" />
                <span>Apple Pay</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('BANK')}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                  paymentMethod === 'BANK'
                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 shadow-xs ring-1 ring-indigo-600'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <Building className="h-4 w-4 text-emerald-600" />
                <span>Bank ACH</span>
              </button>
            </div>
          </div>

          {/* Simulated Card Form Fields */}
          {paymentMethod === 'CARD' && (
            <div className="space-y-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 animate-in fade-in">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Card Number</label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 bg-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Expires</label>
                  <input
                    type="text"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">CVC / CVV</label>
                  <input
                    type="password"
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value)}
                    maxLength={4}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {paymentMethod === 'DIGITAL_WALLET' && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-center space-y-1 animate-in fade-in">
              <p className="text-xs font-bold text-slate-800">Apple Pay / Google Wallet Express</p>
              <p className="text-[11px] text-slate-500">Instant one-touch payment authorization ready.</p>
            </div>
          )}

          {paymentMethod === 'BANK' && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-center space-y-1 animate-in fade-in">
              <p className="text-xs font-bold text-slate-800">Direct Bank Transfer (ACH)</p>
              <p className="text-[11px] text-slate-500">Account verified: Chase Bank •••• 5678</p>
            </div>
          )}

          {/* Security footnote */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-medium">
            <Lock className="h-3 w-3 text-emerald-600" />
            <span>256-bit SSL encrypted &amp; verified library payment processing</span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 py-2.5 text-xs font-bold rounded-2xl border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-3.5 w-3.5 text-indigo-200" />
                  <span>Pay ${formattedAmount}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PayFineModal;
