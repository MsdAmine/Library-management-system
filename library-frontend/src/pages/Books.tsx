import { useEffect, useState } from 'react';
import { bookApi } from '../services/api';
import { Plus, Search, Trash2, Edit, X } from 'lucide-react';
import './Books.css';

interface Book {
  id: number;
  title: string;
  author: string;
  isbn: string;
  publicationYear: number;
  genre: string;
  totalCopies: number;
  availableCopies: number;
  borrowedCopies: number;
}

interface BookForm {
  title: string;
  author: string;
  isbn: string;
  publicationYear: string;
  genre: string;
  totalCopies: string;
  availableCopies: string;
}

const EMPTY_FORM: BookForm = {
  title: '',
  author: '',
  isbn: '',
  publicationYear: '',
  genre: '',
  totalCopies: '',
  availableCopies: '',
};

const Books = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [showModal, setShowModal] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [form, setForm] = useState<BookForm>(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    if (!searchTerm) {
      fetchBooks(currentPage);
    }
  }, [currentPage]);

  const fetchBooks = async (page = 0) => {
    setLoading(true);
    try {
      const response = await bookApi.getAll(page);
      setBooks(response.data.content);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Error fetching books:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      setCurrentPage(0);
      fetchBooks(0);
      return;
    }
    setLoading(true);
    try {
      const response = await bookApi.search({ title: searchTerm });
      setBooks(response.data.content);
      setTotalPages(response.data.totalPages);
      setCurrentPage(0);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingBook(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (book: Book) => {
    setEditingBook(book);
    setForm({
      title: book.title,
      author: book.author,
      isbn: book.isbn ?? '',
      publicationYear: book.publicationYear ? String(book.publicationYear) : '',
      genre: book.genre ?? '',
      totalCopies: String(book.totalCopies),
      availableCopies: String(book.availableCopies),
    });
    setFormError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingBook(null);
    setForm(EMPTY_FORM);
    setFormError('');
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      const payload = {
        title: form.title,
        author: form.author,
        isbn: form.isbn || null,
        publicationYear: form.publicationYear ? Number(form.publicationYear) : 0,
        genre: form.genre || null,
        totalCopies: Number(form.totalCopies),
        availableCopies: Number(form.availableCopies),
      };
      if (editingBook) {
        await bookApi.update(editingBook.id, payload);
      } else {
        await bookApi.add(payload);
      }
      closeModal();
      fetchBooks(currentPage);
    } catch (err: any) {
      const msg = err.response?.data?.message ?? 'An error occurred. Please try again.';
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await bookApi.delete(id);
      setDeletingId(null);
      const newTotal = books.length === 1 && currentPage > 0 ? currentPage - 1 : currentPage;
      setCurrentPage(newTotal);
      fetchBooks(newTotal);
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  return (
    <div className="page">
      <header className="page-header section-header">
        <div>
          <h1>Books Collection</h1>
          <p>Browse and manage all books in the system.</p>
        </div>
        <button className="add-btn" onClick={openAddModal}>
          <Plus size={20} />
          <span>Add New Book</span>
        </button>
      </header>

      <div className="table-actions">
        <form className="search-box" onSubmit={handleSearch}>
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search by title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </form>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="loading">Loading books...</div>
        ) : books.length === 0 ? (
          <div className="loading">No books found.</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Author</th>
                <th>ISBN</th>
                <th>Genre</th>
                <th>Availability</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {books.map((book) => (
                <tr key={book.id}>
                  <td>#{book.id}</td>
                  <td className="book-title">{book.title}</td>
                  <td>{book.author}</td>
                  <td className="isbn">{book.isbn ?? '—'}</td>
                  <td>{book.genre ?? '—'}</td>
                  <td>
                    <span className={`status-badge ${book.availableCopies > 0 ? 'available' : 'unavailable'}`}>
                      {book.availableCopies} / {book.totalCopies}
                    </span>
                  </td>
                  <td className="actions">
                    <button className="icon-btn edit" title="Edit" onClick={() => openEditModal(book)}>
                      <Edit size={18} />
                    </button>
                    {deletingId === book.id ? (
                      <>
                        <button
                          className="icon-btn delete"
                          title="Confirm delete"
                          onClick={() => handleDelete(book.id)}
                          style={{ color: 'var(--danger)', fontWeight: 700 }}
                        >
                          ✓
                        </button>
                        <button className="icon-btn" title="Cancel" onClick={() => setDeletingId(null)}>
                          <X size={16} />
                        </button>
                      </>
                    ) : (
                      <button className="icon-btn delete" title="Delete" onClick={() => setDeletingId(book.id)}>
                        <Trash2 size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="page-btn"
            disabled={currentPage === 0}
            onClick={() => setCurrentPage(p => p - 1)}
          >
            Previous
          </button>
          <span className="page-info">Page {currentPage + 1} of {totalPages}</span>
          <button
            className="page-btn"
            disabled={currentPage >= totalPages - 1}
            onClick={() => setCurrentPage(p => p + 1)}
          >
            Next
          </button>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingBook ? 'Edit Book' : 'Add New Book'}</h2>
              <button className="modal-close" onClick={closeModal}><X size={20} /></button>
            </div>

            <form className="modal-form" onSubmit={handleSubmit}>
              {formError && <div className="form-error">{formError}</div>}

              <div className="form-grid">
                <div className="form-group span-2">
                  <label>Title <span className="required">*</span></label>
                  <input
                    name="title"
                    value={form.title}
                    onChange={handleFormChange}
                    required
                    placeholder="Book title"
                  />
                </div>

                <div className="form-group span-2">
                  <label>Author <span className="required">*</span></label>
                  <input
                    name="author"
                    value={form.author}
                    onChange={handleFormChange}
                    required
                    placeholder="Author name"
                  />
                </div>

                <div className="form-group">
                  <label>ISBN</label>
                  <input
                    name="isbn"
                    value={form.isbn}
                    onChange={handleFormChange}
                    placeholder="e.g. 9780062315007"
                  />
                </div>

                <div className="form-group">
                  <label>Publication Year</label>
                  <input
                    name="publicationYear"
                    type="number"
                    value={form.publicationYear}
                    onChange={handleFormChange}
                    placeholder="e.g. 2023"
                    min={1000}
                    max={2026}
                  />
                </div>

                <div className="form-group span-2">
                  <label>Genre</label>
                  <input
                    name="genre"
                    value={form.genre}
                    onChange={handleFormChange}
                    placeholder="e.g. Fiction, Science, History"
                  />
                </div>

                <div className="form-group">
                  <label>Total Copies <span className="required">*</span></label>
                  <input
                    name="totalCopies"
                    type="number"
                    value={form.totalCopies}
                    onChange={handleFormChange}
                    required
                    min={0}
                    placeholder="0"
                  />
                </div>

                <div className="form-group">
                  <label>Available Copies <span className="required">*</span></label>
                  <input
                    name="availableCopies"
                    type="number"
                    value={form.availableCopies}
                    onChange={handleFormChange}
                    required
                    min={0}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Saving…' : editingBook ? 'Update Book' : 'Add Book'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Books;
