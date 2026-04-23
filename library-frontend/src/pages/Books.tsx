import { useEffect, useState } from 'react';
import { bookApi } from '../services/api';
import { Plus, Search, Trash2, Edit } from 'lucide-react';
import './Books.css';

interface Book {
  id: number;
  title: string;
  author: string;
  isbn: string;
  availableCopies: number;
}

const Books = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      const response = await bookApi.getAll();
      setBooks(response.data);
    } catch (error) {
      console.error('Error fetching books:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm) {
      fetchBooks();
      return;
    }
    try {
      const response = await bookApi.search({ title: searchTerm });
      setBooks(response.data);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  return (
    <div className="page">
      <header className="page-header section-header">
        <div>
          <h1>Books Collection</h1>
          <p>Browse and manage all books in the system.</p>
        </div>
        <button className="add-btn">
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
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Author</th>
                <th>ISBN</th>
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
                  <td className="isbn">{book.isbn}</td>
                  <td>
                    <span className={`status-badge ${book.availableCopies > 0 ? 'available' : 'unavailable'}`}>
                      {book.availableCopies} Copies
                    </span>
                  </td>
                  <td className="actions">
                    <button className="icon-btn edit" title="Edit"><Edit size={18} /></button>
                    <button className="icon-btn delete" title="Delete"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Books;
