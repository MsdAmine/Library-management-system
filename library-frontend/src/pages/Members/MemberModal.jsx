import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Mail, 
  Calendar, 
  KeyRound, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2,
  Loader2,
  Lock
} from 'lucide-react';
import memberService from '../../api/memberService';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const INITIAL_FORM_STATE = {
  firstName: '',
  lastName: '',
  email: '',
  membershipDate: new Date().toISOString().split('T')[0],
  password: '',
};

/**
 * Slide-over / Modal Component for Creating or Editing a Member.
 */
const MemberModal = ({ isOpen, onClose, onSuccess, editingMember = null }) => {
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Initialize or reset form state whenever modal opens or editingMember changes
  useEffect(() => {
    if (isOpen) {
      setServerError('');
      setErrors({});
      if (editingMember) {
        setFormData({
          firstName: editingMember.firstName || '',
          lastName: editingMember.lastName || '',
          email: editingMember.email || '',
          membershipDate: editingMember.membershipDate || new Date().toISOString().split('T')[0],
          password: '',
        });
      } else {
        setFormData({
          ...INITIAL_FORM_STATE,
          membershipDate: new Date().toISOString().split('T')[0],
        });
      }
    }
  }, [isOpen, editingMember]);

  // Handle ESC key press to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !submitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, submitting]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!EMAIL_REGEX.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address (e.g. user@example.com)';
    }

    if (!formData.membershipDate) {
      newErrors.membershipDate = 'Membership date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear field-specific error on change
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    if (serverError) {
      setServerError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setServerError('');
    setSubmitting(true);

    try {
      if (editingMember) {
        await memberService.updateMember(editingMember.id, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          membershipDate: formData.membershipDate,
          ...(formData.password ? { password: formData.password } : {}),
        });
      } else {
        await memberService.createMember({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          membershipDate: formData.membershipDate,
          password: formData.password || 'Member123!',
        });
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Failed to save member:', err);
      const errorMessage = memberService.getErrorMessage(err);
      setServerError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl shadow-indigo-950/30 overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Accent Gradient Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400"></div>

        {/* Modal Header */}
        <div className="flex items-start justify-between p-6 pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                {editingMember ? 'Edit Member Details' : 'Register New Member'}
                <Sparkles className="h-4 w-4 text-indigo-400" />
              </h3>
              <p className="text-xs text-slate-400">
                {editingMember 
                  ? `Update contact and membership details for #${editingMember.id}`
                  : 'Add a new member profile to the library directory.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Server Error Alert (Handles duplicate email registration conflicts) */}
          {serverError && (
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs animate-in slide-in-from-top-2">
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold text-rose-200">Registration Error: </span>
                <span>{serverError}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* First Name Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                First Name <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. John"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className={`w-full px-3.5 py-2.5 bg-slate-950/80 border rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-all ${
                    errors.firstName
                      ? 'border-rose-500 focus:ring-1 focus:ring-rose-500/50'
                      : 'border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30'
                  }`}
                />
              </div>
              {errors.firstName && (
                <p className="text-[11px] text-rose-400 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.firstName}
                </p>
              )}
            </div>

            {/* Last Name Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Last Name <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. Doe"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className={`w-full px-3.5 py-2.5 bg-slate-950/80 border rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-all ${
                    errors.lastName
                      ? 'border-rose-500 focus:ring-1 focus:ring-rose-500/50'
                      : 'border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30'
                  }`}
                />
              </div>
              {errors.lastName && (
                <p className="text-[11px] text-rose-400 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.lastName}
                </p>
              )}
            </div>
          </div>

          {/* Email Address Field */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">
              Email Address <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
              <input
                type="email"
                placeholder="member@library.org"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`w-full pl-10 pr-3.5 py-2.5 bg-slate-950/80 border rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-all ${
                  errors.email
                    ? 'border-rose-500 focus:ring-1 focus:ring-rose-500/50'
                    : 'border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30'
                }`}
              />
            </div>
            {errors.email ? (
              <p className="text-[11px] text-rose-400 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.email}
              </p>
            ) : (
              <p className="text-[11px] text-slate-500">Must be a unique, valid email address used for member communications.</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Membership Date Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Membership Date <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={formData.membershipDate}
                  onChange={(e) => handleInputChange('membershipDate', e.target.value)}
                  className={`w-full px-3.5 py-2.5 bg-slate-950/80 border rounded-xl text-xs text-slate-100 focus:outline-none transition-all ${
                    errors.membershipDate
                      ? 'border-rose-500 focus:ring-1 focus:ring-rose-500/50'
                      : 'border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30'
                  }`}
                />
              </div>
              {errors.membershipDate && (
                <p className="text-[11px] text-rose-400 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.membershipDate}
                </p>
              )}
            </div>

            {/* Password (Optional / Initial default) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Account Password {!editingMember && <span className="text-slate-500 font-normal">(optional)</span>}
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                <input
                  type="password"
                  placeholder={editingMember ? 'Leave blank to keep current' : 'Default: Member123!'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-all"
                />
              </div>
              <p className="text-[11px] text-slate-500">
                {editingMember ? 'Update only if resetting password.' : 'Default password assigned if blank.'}
              </p>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-5 border-t border-slate-800/80 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 shadow-lg shadow-indigo-950/40 border border-indigo-500/50 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{editingMember ? 'Updating Member...' : 'Registering...'}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{editingMember ? 'Save Changes' : 'Register Member'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MemberModal;
