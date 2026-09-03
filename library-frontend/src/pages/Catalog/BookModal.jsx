import React, { useState, useEffect } from 'react';
import { 
  X, 
  BookOpen, 
  Sparkles, 
  AlertCircle, 
  Check, 
  Hash, 
  Calendar, 
  Layers, 
  CheckCircle2,
  Tag,
  User,
  Bookmark
} from 'lucide-react';
import bookService from '../../api/bookService';

const PRESET_GENRES = [
  'Fiction',
  'Non-Fiction',
  'Science Fiction',
  'Fantasy',
  'Mystery & Thriller',
  'Biography & Memoir',
  'History',
  'Technology & Computing',
  'Science & Nature',
  'Philosophy & Psychology',
  'Romance',
  'Self-Help & Growth',
  'Arts & Photography',
  'Young Adult',
  'Poetry',
  'Classic Literature',
];

const ISBN_REGEX = /^(?:ISBN(?:-1[03])?:? )?(?=[0-9X]{10}$|(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}$|97[89][0-9]{10}$|(?=(?:[0-9]+[- ]){4})[- 0-9]{17}$)(?:97[89][- ]?)?[0-9]{1,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9X]$/i;

const INITIAL_FORM_STATE = {
  title: '',
  author: '',
  isbn: '',
  publicationYear: new Date().getFullYear(),
  genre: 'Fiction',
  customGenre: '',
  totalCopies: 5,
  availableCopies: 5,
};

/**
 * Slide-over / Modal Component for Adding or Editing a Book.
 */
const BookModal = ({ isOpen, onClose, onSuccess, editingBook = null }) => {
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [useCustomGenre, setUseCustomGenre] = useState(false);
  const [isAvailableManuallyEdited, setIsAvailableManuallyEdited] = useState(false);

  // Initialize or reset form state whenever modal opens or editingBook changes
  useEffect(() => {
    if (isOpen) {
      setServerError('');
      setErrors({});
      if (editingBook) {
        const isPreset = PRESET_GENRES.includes(editingBook.genre);
        setUseCustomGenre(!isPreset && !!editingBook.genre);
        setFormData({
          title: editingBook.title || '',
          author: editingBook.author || '',
          isbn: editingBook.isbn || '',
          publicationYear: editingBook.publicationYear || new Date().getFullYear(),
          genre: isPreset ? editingBook.genre : 'Custom',
          customGenre: isPreset ? '' : (editingBook.genre || ''),
          totalCopies: editingBook.totalCopies ?? 0,
          availableCopies: editingBook.availableCopies ?? 0,
        });
        setIsAvailableManuallyEdited(true);
      } else {
        setUseCustomGenre(false);
        setIsAvailableManuallyEdited(false);
        setFormData(INITIAL_FORM_STATE);
      }
    }
  }, [isOpen, editingBook]);

  // Handle ESC key press to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.author.trim()) {
      newErrors.author = 'Author name is required';
    }

    if (formData.isbn && formData.isbn.trim()) {
      const trimmedIsbn = formData.isbn.trim();
      if (!ISBN_REGEX.test(trimmedIsbn)) {
        newErrors.isbn = 'Invalid ISBN format. Must be a valid 10 or 13 digit ISBN (e.g. 978-0-13-468599-1 or 0-13-468599-7).';
      }
    }

    const currentYear = new Date().getFullYear();
    const yearNum = Number(formData.publicationYear);
    if (!formData.publicationYear || isNaN(yearNum) || yearNum < 1000 || yearNum > currentYear) {
      newErrors.publicationYear = `Year must be between 1000 and ${currentYear}`;
    }

    const totalNum = Number(formData.totalCopies);
    if (isNaN(totalNum) || totalNum < 0 || !Number.isInteger(totalNum)) {
      newErrors.totalCopies = 'Total copies must be a non-negative integer';
    }

    const availNum = Number(formData.availableCopies);
    if (isNaN(availNum) || availNum < 0 || !Number.isInteger(availNum)) {
      newErrors.availableCopies = 'Available copies must be a non-negative integer';
    } else if (availNum > totalNum) {
      newErrors.availableCopies = 'Available copies cannot exceed total copies';
    }

    if (useCustomGenre && !formData.customGenre.trim()) {
      newErrors.customGenre = 'Please specify custom genre name';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'totalCopies') {
      const numVal = value === '' ? '' : Math.max(0, parseInt(value, 10) || 0);
      setFormData((prev) => {
        const next = { ...prev, totalCopies: numVal };
        // If creating new book and user hasn't customized available copies, keep them synced
        if (!editingBook && !isAvailableManuallyEdited) {
          next.availableCopies = numVal;
        }
        return next;
      });
    } else if (name === 'availableCopies') {
      setIsAvailableManuallyEdited(true);
      const numVal = value === '' ? '' : Math.max(0, parseInt(value, 10) || 0);
      setFormData((prev) => ({ ...prev, availableCopies: numVal }));
    } else if (name === 'genreSelect') {
      if (value === 'Custom') {
        setUseCustomGenre(true);
      } else {
        setUseCustomGenre(false);
        setFormData((prev) => ({ ...prev, genre: value }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    // Clear specific field error when edited
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!validate()) {
      return;
    }

    setSubmitting(true);

    const finalGenre = useCustomGenre 
      ? formData.customGenre.trim() 
      : (formData.genre === 'Custom' ? '' : formData.genre);

    const payload = {
      title: formData.title.trim(),
      author: formData.author.trim(),
      isbn: formData.isbn && formData.isbn.trim() ? formData.isbn.trim() : null,
      publicationYear: parseInt(formData.publicationYear, 10),
      genre: finalGenre || null,
      totalCopies: parseInt(formData.totalCopies, 10) || 0,
      availableCopies: parseInt(formData.availableCopies, 10) || 0,
    };

    try {
      if (editingBook) {
        await bookService.updateBook(editingBook.id, payload);
      } else {
        await bookService.createBook(payload);
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Error saving book:', err);
      const errorMsg = bookService.getErrorMessage(err);
      setServerError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-800/90 rounded-2xl shadow-2xl shadow-indigo-950/40 overflow-hidden text-slate-100 transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glowing Top Accent Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-cyan-500 to-emerald-500"></div>

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                {editingBook ? 'Edit Book Metadata' : 'Add New Book to Catalog'}
              </h2>
              <p className="text-xs text-slate-400">
                {editingBook ? `Updating #${editingBook.id} - ${editingBook.title}` : 'Fill in the book details and inventory parameters.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} noValidate className="p-6 space-y-5">
          {/* Server Error Alert */}
          {serverError && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm animate-in fade-in">
              <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-rose-200">Unable to save book</p>
                <p className="text-xs text-rose-300/90 mt-0.5">{serverError}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Title (Full Width) */}
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Bookmark className="h-3.5 w-3.5 text-indigo-400" />
                Book Title <span className="text-rose-400 font-bold">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Clean Code: A Handbook of Agile Software Craftsmanship"
                className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
                  errors.title
                    ? 'border-rose-500/80 focus:ring-rose-500/30 bg-rose-950/10'
                    : 'border-slate-800 focus:border-indigo-500 focus:ring-indigo-500/20'
                }`}
                required
              />
              {errors.title && (
                <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3" /> {errors.title}
                </p>
              )}
            </div>

            {/* Author (Full Width or Half) */}
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-indigo-400" />
                Author <span className="text-rose-400 font-bold">*</span>
              </label>
              <input
                type="text"
                name="author"
                value={formData.author}
                onChange={handleChange}
                placeholder="e.g. Robert C. Martin"
                className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
                  errors.author
                    ? 'border-rose-500/80 focus:ring-rose-500/30 bg-rose-950/10'
                    : 'border-slate-800 focus:border-indigo-500 focus:ring-indigo-500/20'
                }`}
                required
              />
              {errors.author && (
                <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3" /> {errors.author}
                </p>
              )}
            </div>

            {/* ISBN */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Hash className="h-3.5 w-3.5 text-indigo-400" />
                  ISBN (10 or 13)
                </span>
                <span className="text-[10px] text-slate-500 normal-case">Format: 978-0-13-468599-1</span>
              </label>
              <input
                type="text"
                name="isbn"
                value={formData.isbn}
                onChange={handleChange}
                placeholder="e.g. 978-0132350884"
                className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border text-sm font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
                  errors.isbn
                    ? 'border-rose-500/80 focus:ring-rose-500/30 bg-rose-950/10'
                    : 'border-slate-800 focus:border-indigo-500 focus:ring-indigo-500/20'
                }`}
              />
              {errors.isbn && (
                <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3" /> {errors.isbn}
                </p>
              )}
            </div>

            {/* Publication Year */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-indigo-400" />
                Publication Year <span className="text-rose-400 font-bold">*</span>
              </label>
              <input
                type="number"
                name="publicationYear"
                min="1000"
                max={new Date().getFullYear()}
                value={formData.publicationYear}
                onChange={handleChange}
                placeholder="e.g. 2008"
                className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
                  errors.publicationYear
                    ? 'border-rose-500/80 focus:ring-rose-500/30 bg-rose-950/10'
                    : 'border-slate-800 focus:border-indigo-500 focus:ring-indigo-500/20'
                }`}
                required
              />
              {errors.publicationYear && (
                <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3" /> {errors.publicationYear}
                </p>
              )}
            </div>

            {/* Genre Selector */}
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-indigo-400" />
                Genre / Category
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <select
                  name="genreSelect"
                  value={useCustomGenre ? 'Custom' : formData.genre}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                >
                  {PRESET_GENRES.map((g) => (
                    <option key={g} value={g} className="bg-slate-900 text-slate-100">
                      {g}
                    </option>
                  ))}
                  <option value="Custom" className="bg-slate-900 text-indigo-300 font-semibold">
                    + Other / Custom Category...
                  </option>
                </select>

                {useCustomGenre && (
                  <input
                    type="text"
                    name="customGenre"
                    value={formData.customGenre}
                    onChange={handleChange}
                    placeholder="Enter custom genre name"
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
                      errors.customGenre
                        ? 'border-rose-500/80 focus:ring-rose-500/30'
                        : 'border-indigo-500/60 focus:border-indigo-500 focus:ring-indigo-500/20'
                    }`}
                  />
                )}
              </div>
              {errors.customGenre && (
                <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3" /> {errors.customGenre}
                </p>
              )}
            </div>

            {/* Total Copies */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-indigo-400" />
                  Total Copies <span className="text-rose-400 font-bold">*</span>
                </span>
                <span className="text-[10px] text-slate-500">Physical Stock</span>
              </label>
              <input
                type="number"
                name="totalCopies"
                min="0"
                value={formData.totalCopies}
                onChange={handleChange}
                className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
                  errors.totalCopies
                    ? 'border-rose-500/80 focus:ring-rose-500/30 bg-rose-950/10'
                    : 'border-slate-800 focus:border-indigo-500 focus:ring-indigo-500/20'
                }`}
                required
              />
              {errors.totalCopies && (
                <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3" /> {errors.totalCopies}
                </p>
              )}
            </div>

            {/* Available Copies */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  Available Copies <span className="text-rose-400 font-bold">*</span>
                </span>
                <span className="text-[10px] text-slate-500">&le; Total Copies</span>
              </label>
              <input
                type="number"
                name="availableCopies"
                min="0"
                max={formData.totalCopies || 9999}
                value={formData.availableCopies}
                onChange={handleChange}
                className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
                  errors.availableCopies
                    ? 'border-rose-500/80 focus:ring-rose-500/30 bg-rose-950/10'
                    : 'border-slate-800 focus:border-indigo-500 focus:ring-indigo-500/20'
                }`}
                required
              />
              {errors.availableCopies && (
                <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3" /> {errors.availableCopies}
                </p>
              )}
            </div>
          </div>

          {/* Form Actions Footer */}
          <div className="flex items-center justify-end gap-3 pt-5 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent transition-all cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 shadow-lg shadow-indigo-500/25 ring-1 ring-white/10 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
            >
              {submitting ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                  <span>{editingBook ? 'Updating Book...' : 'Saving Book...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>{editingBook ? 'Update Book' : 'Add Book to Catalog'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookModal;
