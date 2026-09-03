import React, { useState, useEffect, useCallback, useTransition } from 'react';
import { 
  BookOpen, 
  Search, 
  Plus, 
  Filter, 
  X, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight, 
  Copy, 
  Check, 
  Layers, 
  LayoutGrid, 
  Table as TableIcon, 
  Sparkles, 
  RefreshCw, 
  BookMarked,
  SlidersHorizontal,
  Info
} from 'lucide-react';
import bookService from '../../api/bookService';
import { useAuth } from '../../context/AuthContext';
import BookModal from './BookModal';
import DeleteBookModal from './DeleteBookModal';

const GENRES = [
  'All Genres',
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

const BookList = () => {
  const { role, user } = useAuth();
  const isAdmin = role === 'ADMIN';
  const isLibrarian = role === 'LIBRARIAN';
  const canManageBooks = isAdmin || isLibrarian; // Role guard for Add/Edit
  const canDeleteBooks = isAdmin; // Role guard for Delete

  // Main data state
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Filter input states
  const [filters, setFilters] = useState({
    title: '',
    author: '',
    genre: 'All Genres',
    availableOnly: false,
  });

  // Debounced filter values for backend query
  const [debouncedFilters, setDebouncedFilters] = useState(filters);

  // Notification toast state
  const [toastMessage, setToastMessage] = useState(null);

  // Modals state
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingBook, setDeletingBook] = useState(null);

  // Copied ISBN feedback state
  const [copiedIsbn, setCopiedIsbn] = useState(null);

  // Debounce search query changes
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 350);
    return () => clearTimeout(handler);
  }, [filters]);

  // Fetch books from backend
  const fetchBooks = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    try {
      const hasFilters = 
        Boolean(debouncedFilters.title.trim()) ||
        Boolean(debouncedFilters.author.trim()) ||
        (debouncedFilters.genre && debouncedFilters.genre !== 'All Genres') ||
        debouncedFilters.availableOnly;

      let response;
      if (hasFilters) {
        response = await bookService.searchBooks({
          title: debouncedFilters.title.trim() || undefined,
          author: debouncedFilters.author.trim() || undefined,
          genre: debouncedFilters.genre === 'All Genres' ? undefined : debouncedFilters.genre,
          available: debouncedFilters.availableOnly ? true : undefined,
          page: currentPage,
          size: pageSize,
          sort: 'title',
        });
      } else {
        response = await bookService.getAllBooks({
          page: currentPage,
          size: pageSize,
          sort: 'title',
        });
      }

      setBooks(response.content || []);
      setTotalPages(response.totalPages || 0);
      setTotalElements(response.totalElements || 0);
    } catch (err) {
      console.error('Failed to load books catalog:', err);
      setFetchError(bookService.getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [debouncedFilters, currentPage, pageSize]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setCurrentPage(0); // Reset to first page when changing filters
  };

  const resetFilters = () => {
    setFilters({
      title: '',
      author: '',
      genre: 'All Genres',
      availableOnly: false,
    });
    setCurrentPage(0);
  };

  const handleCopyIsbn = (isbn) => {
    if (!isbn) return;
    navigator.clipboard.writeText(isbn);
    setCopiedIsbn(isbn);
    setTimeout(() => setCopiedIsbn(null), 2000);
  };

  const openAddModal = () => {
    setEditingBook(null);
    setIsBookModalOpen(true);
  };

  const openEditModal = (book) => {
    setEditingBook(book);
    setIsBookModalOpen(true);
  };

  const openDeleteModal = (book) => {
    setDeletingBook(book);
    setIsDeleteModalOpen(true);
  };

  const handleBookCreatedOrUpdated = () => {
    showToast(editingBook ? 'Book details successfully updated.' : 'New book added to the catalog.');
    fetchBooks();
  };

  const handleBookDeleted = () => {
    showToast('Book removed from active catalog.', 'info');
    // If last book on page, step back
    if (books.length === 1 && currentPage > 0) {
      setCurrentPage((p) => p - 1);
    } else {
      fetchBooks();
    }
  };

  const hasActiveFilters = 
    Boolean(filters.title.trim()) ||
    Boolean(filters.author.trim()) ||
    (filters.genre && filters.genre !== 'All Genres') ||
    filters.availableOnly;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div 
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-xl animate-in slide-in-from-bottom-5 duration-300 ${
            toastMessage.type === 'info'
              ? 'bg-slate-900/95 border-cyan-500/40 text-cyan-300 shadow-cyan-950/40'
              : 'bg-slate-900/95 border-emerald-500/40 text-emerald-300 shadow-emerald-950/40'
          }`}
        >
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <p className="text-xs font-semibold">{toastMessage.message}</p>
          <button 
            onClick={() => setToastMessage(null)}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors ml-2"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-indigo-950/40 border border-slate-800/80 p-6 rounded-2xl shadow-xl backdrop-blur-sm">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <BookMarked className="h-3 w-3" />
            <span>Library Inventory &amp; Catalog</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            Book Catalog
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {totalElements} {totalElements === 1 ? 'Title' : 'Titles'}
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
            Browse through our collection, query real-time stock availability, and manage book records.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => fetchBooks()}
            disabled={loading}
            title="Refresh catalog data"
            className="p-2.5 rounded-xl text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>

          {/* Role-Based Guard: Add Book button only visible for ADMIN & LIBRARIAN */}
          {canManageBooks && (
            <button
              onClick={openAddModal}
              id="add-book-btn"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 shadow-lg shadow-indigo-500/25 ring-1 ring-white/10 active:scale-[0.98] transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add New Book</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 sm:p-5 space-y-4 shadow-lg backdrop-blur-sm">
        <div className="flex items-center justify-between gap-2 border-b border-slate-800/60 pb-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 uppercase tracking-wider">
            <SlidersHorizontal className="h-4 w-4 text-indigo-400" />
            <span>Search &amp; Filter Catalog</span>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-indigo-600 text-white shadow-sm font-medium'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Table view"
              >
                <TableIcon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Table</span>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-indigo-600 text-white shadow-sm font-medium'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Grid view"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Cards</span>
              </button>
            </div>

            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-3 w-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          {/* Title Search Input */}
          <div className="lg:col-span-4 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by book title..."
              value={filters.title}
              onChange={(e) => handleFilterChange('title', e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
            />
            {filters.title && (
              <button
                onClick={() => handleFilterChange('title', '')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Author Search Input */}
          <div className="lg:col-span-3 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Filter by author..."
              value={filters.author}
              onChange={(e) => handleFilterChange('author', e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
            />
            {filters.author && (
              <button
                onClick={() => handleFilterChange('author', '')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Genre Dropdown */}
          <div className="lg:col-span-3">
            <select
              value={filters.genre}
              onChange={(e) => handleFilterChange('genre', e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all cursor-pointer"
            >
              {GENRES.map((g) => (
                <option key={g} value={g} className="bg-slate-900 text-slate-200">
                  {g}
                </option>
              ))}
            </select>
          </div>

          {/* Available / In-Stock Only Toggle */}
          <div className="lg:col-span-2 flex items-center">
            <label className="w-full flex items-center justify-between sm:justify-start gap-2.5 px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-300 hover:text-white cursor-pointer select-none transition-colors">
              <input
                type="checkbox"
                checked={filters.availableOnly}
                onChange={(e) => handleFilterChange('availableOnly', e.target.checked)}
                className="h-4 w-4 rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500/20 focus:ring-offset-slate-900 cursor-pointer accent-indigo-600"
              />
              <span className="font-medium whitespace-nowrap">In-Stock Only</span>
            </label>
          </div>
        </div>
      </div>

      {/* Error State Banner */}
      {fetchError && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
          <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-rose-200">Failed to load catalog data</h4>
            <p className="text-xs text-rose-300/80 mt-0.5">{fetchError}</p>
          </div>
          <button
            onClick={fetchBooks}
            className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 rounded-lg text-xs font-semibold text-rose-200 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main Content Area: Loading Skeletons vs Data vs Empty State */}
      {loading ? (
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 overflow-hidden">
          <div className="space-y-4">
            <div className="h-10 bg-slate-800/40 rounded-xl animate-pulse"></div>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-3 border-b border-slate-800/40">
                <div className="h-10 w-10 bg-slate-800/60 rounded-xl animate-pulse shrink-0"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-1/3 bg-slate-800/60 rounded animate-pulse"></div>
                  <div className="h-3 w-1/4 bg-slate-800/40 rounded animate-pulse"></div>
                </div>
                <div className="h-6 w-20 bg-slate-800/50 rounded-full animate-pulse"></div>
                <div className="h-6 w-16 bg-slate-800/50 rounded-full animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      ) : books.length === 0 ? (
        /* Empty State */
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-4">
          <div className="h-16 w-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-inner">
            <BookOpen className="h-8 w-8" />
          </div>
          <div className="space-y-1 max-w-md">
            <h3 className="text-lg font-bold text-white tracking-tight">No books found</h3>
            <p className="text-xs text-slate-400">
              {hasActiveFilters 
                ? 'We could not find any books matching your active filters. Try adjusting your query keywords or clearing filters.'
                : 'The library catalog is currently empty. Add the first book to start managing your collection.'}
            </p>
          </div>
          {hasActiveFilters ? (
            <button
              onClick={resetFilters}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-indigo-400 hover:text-white bg-indigo-500/10 hover:bg-indigo-600 border border-indigo-500/30 transition-all cursor-pointer"
            >
              Clear All Filters
            </button>
          ) : canManageBooks && (
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Your First Book</span>
            </button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        /* Data Table View */
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl shadow-xl overflow-hidden backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800/80 bg-slate-950/60 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-4 sm:px-6">Book Details</th>
                  <th className="py-3.5 px-4">Author</th>
                  <th className="py-3.5 px-4">ISBN</th>
                  <th className="py-3.5 px-4">Genre</th>
                  <th className="py-3.5 px-4 text-center">Availability / Stock</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-xs">
                {books.map((book) => {
                  const isAvailable = book.availableCopies > 0;
                  const isLowStock = isAvailable && book.availableCopies <= 2;

                  return (
                    <tr 
                      key={book.id}
                      className="hover:bg-slate-800/30 transition-colors group"
                    >
                      {/* Book Details */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-3.5">
                          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-950 to-slate-800 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 group-hover:border-indigo-500/50 transition-colors">
                            <BookOpen className="h-5 w-5" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-white group-hover:text-indigo-300 transition-colors text-sm">
                              {book.title}
                            </span>
                            <div className="flex items-center gap-2 text-[11px] text-slate-400">
                              <span>ID: #{book.id}</span>
                              {book.publicationYear && (
                                <>
                                  <span>&bull;</span>
                                  <span>{book.publicationYear}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Author */}
                      <td className="py-4 px-4 font-medium text-slate-300">
                        {book.author}
                      </td>

                      {/* ISBN */}
                      <td className="py-4 px-4">
                        {book.isbn ? (
                          <button
                            onClick={() => handleCopyIsbn(book.isbn)}
                            className="group/isbn inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-950/60 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 font-mono text-[11px] text-slate-300 transition-colors cursor-pointer"
                            title="Click to copy ISBN"
                          >
                            <span>{book.isbn}</span>
                            {copiedIsbn === book.isbn ? (
                              <Check className="h-3 w-3 text-emerald-400" />
                            ) : (
                              <Copy className="h-3 w-3 text-slate-500 group-hover/isbn:text-indigo-400" />
                            )}
                          </button>
                        ) : (
                          <span className="text-slate-600 font-mono">—</span>
                        )}
                      </td>

                      {/* Genre */}
                      <td className="py-4 px-4">
                        {book.genre ? (
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                            {book.genre}
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      {/* Availability & Stock Badge */}
                      <td className="py-4 px-4 text-center">
                        <div className="inline-flex flex-col items-center gap-1">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border shadow-xs ${
                              !isAvailable
                                ? 'bg-rose-500/15 text-rose-400 border-rose-500/30 ring-1 ring-rose-500/20'
                                : isLowStock
                                ? 'bg-amber-500/15 text-amber-400 border-amber-500/30 ring-1 ring-amber-500/20'
                                : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 ring-1 ring-emerald-500/20'
                            }`}
                          >
                            <span 
                              className={`h-1.5 w-1.5 rounded-full ${
                                !isAvailable ? 'bg-rose-400' : isLowStock ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
                              }`} 
                            />
                            {!isAvailable 
                              ? 'Out of Stock' 
                              : isLowStock 
                              ? `Low Stock (${book.availableCopies}/${book.totalCopies})` 
                              : `${book.availableCopies} / ${book.totalCopies} Available`}
                          </span>
                        </div>
                      </td>

                      {/* Role-Based Action Buttons */}
                      <td className="py-4 px-4 sm:px-6 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          {/* Edit Button (ADMIN & LIBRARIAN only) */}
                          {canManageBooks && (
                            <button
                              onClick={() => openEditModal(book)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-indigo-500/10 border border-transparent hover:border-indigo-500/30 transition-all cursor-pointer"
                              title="Edit book metadata"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                          )}

                          {/* Delete Button (ADMIN only) */}
                          {canDeleteBooks && (
                            <button
                              onClick={() => openDeleteModal(book)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 transition-all cursor-pointer"
                              title="Delete book record"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}

                          {/* For standard USER with no mutation permissions */}
                          {!canManageBooks && !canDeleteBooks && (
                            <span className="text-[11px] text-slate-500 italic pr-2">
                              Read-Only
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Card / Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {books.map((book) => {
            const isAvailable = book.availableCopies > 0;
            const isLowStock = isAvailable && book.availableCopies <= 2;

            return (
              <div
                key={book.id}
                className="bg-slate-900/70 border border-slate-800/80 hover:border-slate-700/80 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-indigo-500/5 group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-indigo-950/40 shrink-0">
                      <BookOpen className="h-6 w-6" />
                    </div>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                        !isAvailable
                          ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                          : isLowStock
                          ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                          : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${!isAvailable ? 'bg-rose-400' : 'bg-emerald-400'}`} />
                      {book.availableCopies} / {book.totalCopies} Left
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-2">
                    {book.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 font-medium">By {book.author}</p>

                  <div className="mt-4 pt-3 border-t border-slate-800/60 flex flex-wrap items-center gap-2 text-xs">
                    {book.genre && (
                      <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[10px] font-semibold">
                        {book.genre}
                      </span>
                    )}
                    {book.publicationYear && (
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 text-[10px]">
                        {book.publicationYear}
                      </span>
                    )}
                    {book.isbn && (
                      <span className="font-mono text-[10px] text-slate-500 ml-auto truncate max-w-[120px]" title={book.isbn}>
                        {book.isbn}
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="mt-5 pt-3 border-t border-slate-800/60 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">ID: #{book.id}</span>
                  <div className="flex items-center gap-1">
                    {canManageBooks && (
                      <button
                        onClick={() => openEditModal(book)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-indigo-500/10 transition-colors cursor-pointer"
                        title="Edit Book"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                    )}
                    {canDeleteBooks && (
                      <button
                        onClick={() => openDeleteModal(book)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Delete Book"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 shadow-md">
          {/* Items count & Page Size Selector */}
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span>
              Showing <span className="font-semibold text-slate-200">{books.length === 0 ? 0 : currentPage * pageSize + 1}</span> to{' '}
              <span className="font-semibold text-slate-200">{Math.min((currentPage + 1) * pageSize, totalElements)}</span> of{' '}
              <span className="font-semibold text-slate-200">{totalElements}</span> books
            </span>

            <div className="flex items-center gap-1.5 pl-3 border-l border-slate-800">
              <span className="text-[11px]">Per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(0);
                }}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          {/* Page Triggers */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(0)}
              disabled={currentPage === 0 || loading}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-950/60 hover:bg-slate-800 border border-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
              title="First page"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>

            <button
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0 || loading}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-950/60 hover:bg-slate-800 border border-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
              title="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {/* Page Pill indicator */}
            <div className="px-3 py-1 bg-slate-950/80 border border-slate-800 rounded-lg text-xs font-semibold text-slate-300">
              Page <span className="text-indigo-400 font-bold">{currentPage + 1}</span> of{' '}
              <span className="text-slate-200">{Math.max(1, totalPages)}</span>
            </div>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage >= totalPages - 1 || loading}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-950/60 hover:bg-slate-800 border border-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
              title="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            <button
              onClick={() => setCurrentPage(totalPages - 1)}
              disabled={currentPage >= totalPages - 1 || loading}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-950/60 hover:bg-slate-800 border border-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
              title="Last page"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Add / Edit Book Modal */}
      <BookModal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        onSuccess={handleBookCreatedOrUpdated}
        editingBook={editingBook}
      />

      {/* Delete Confirmation Modal */}
      <DeleteBookModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onSuccess={handleBookDeleted}
        book={deletingBook}
      />
    </div>
  );
};

export default BookList;
