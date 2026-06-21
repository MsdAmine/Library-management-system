import { useEffect, useState } from 'react';
import { borrowingApi, memberApi, bookApi } from '../services/api';
import { Plus, X, CheckCircle } from 'lucide-react';
import './Borrowings.css';

interface BorrowingRecord {
  id: number;
  member: { id: number; firstName: string; lastName: string };
  book: { id: number; title: string; author: string };
  borrowDate: string;
  dueDate: string;
  returnDate: string | null;
  status: 'BORROWED' | 'RETURNED' | 'OVERDUE';
  fineAmount: number | null;
  archived: boolean;
}

interface MemberOption {
  id: number;
  firstName: string;
  lastName: string;
}

interface BookOption {
  id: number;
  title: string;
  author: string;
  availableCopies: number;
}

interface ReturnResult {
  bookTitle: string;
  memberName: string;
  overdue: boolean;
  daysOverdue: number;
  fineAmount: number;
}

const Borrowings = () => {
  const [records, setRecords] = useState<BorrowingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [memberQuery, setMemberQuery] = useState('');
  const [memberResults, setMemberResults] = useState<MemberOption[]>([]);
  const [memberSearched, setMemberSearched] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberOption | null>(null);
  const [bookQuery, setBookQuery] = useState('');
  const [bookResults, setBookResults] = useState<BookOption[]>([]);
  const [bookSearched, setBookSearched] = useState(false);
  const [selectedBook, setSelectedBook] = useState<BookOption | null>(null);
  const [borrowError, setBorrowError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [returningId, setReturningId] = useState<number | null>(null);
  const [returnResult, setReturnResult] = useState<ReturnResult | null>(null);

  useEffect(() => {
    fetchRecords(currentPage);
  }, [currentPage]);

  const fetchRecords = async (page = 0) => {
    setLoading(true);
    try {
      const response = await borrowingApi.getAll(page);
      setRecords(response.data.content);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Error fetching borrowings:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchMembers = async () => {
    if (!memberQuery.trim()) return;
    try {
      const res = await memberApi.search(memberQuery, 0, 5);
      setMemberResults(res.data.content);
      setMemberSearched(true);
    } catch (err) {
      console.error('Member search failed:', err);
    }
  };

  const searchBooks = async () => {
    if (!bookQuery.trim()) return;
    try {
      const res = await bookApi.search({ title: bookQuery }, 0, 5);
      setBookResults(res.data.content);
      setBookSearched(true);
    } catch (err) {
      console.error('Book search failed:', err);
    }
  };

  const openBorrowModal = () => {
    setMemberQuery('');
    setMemberResults([]);
    setMemberSearched(false);
    setSelectedMember(null);
    setBookQuery('');
    setBookResults([]);
    setBookSearched(false);
    setSelectedBook(null);
    setBorrowError('');
    setShowBorrowModal(true);
  };

  const closeBorrowModal = () => setShowBorrowModal(false);

  const handleBorrow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember || !selectedBook) {
      setBorrowError('Please select both a member and a book.');
      return;
    }
    setBorrowError('');
    setSubmitting(true);
    try {
      await borrowingApi.borrow(selectedMember.id, selectedBook.id);
      closeBorrowModal();
      setCurrentPage(0);
      fetchRecords(0);
    } catch (err: any) {
      const msg = err.response?.data?.message ?? 'An error occurred. Please try again.';
      setBorrowError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReturn = async (id: number) => {
    try {
      const res = await borrowingApi.returnBook(id);
      setReturningId(null);
      const r = res.data;
      if (r.overdue || Number(r.fineAmount) > 0) {
        setReturnResult({
          bookTitle: r.bookTitle,
          memberName: r.memberName,
          overdue: r.overdue,
          daysOverdue: r.daysOverdue,
          fineAmount: Number(r.fineAmount),
        });
      }
      fetchRecords(currentPage);
    } catch (err) {
      console.error('Return failed:', err);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="page">
      {returnResult && (
        <div className="return-notification">
          <div className="return-notification-content">
            <CheckCircle size={18} />
            <span>
              <strong>{returnResult.memberName}</strong> returned <strong>{returnResult.bookTitle}</strong>
              {returnResult.overdue && (
                <> — <span className="fine-label">
                  {returnResult.daysOverdue} day{returnResult.daysOverdue !== 1 ? 's' : ''} overdue,
                  fine: ${returnResult.fineAmount.toFixed(2)}
                </span></>
              )}
            </span>
          </div>
          <button className="modal-close" onClick={() => setReturnResult(null)}>
            <X size={16} />
          </button>
        </div>
      )}

      <header className="page-header section-header">
        <div>
          <h1>Borrowings</h1>
          <p>Track book loans and returns.</p>
        </div>
        <button className="add-btn" onClick={openBorrowModal}>
          <Plus size={20} />
          <span>Borrow a Book</span>
        </button>
      </header>

      <div className="table-container">
        {loading ? (
          <div className="loading">Loading borrowings...</div>
        ) : records.length === 0 ? (
          <div className="loading">No borrowing records found.</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Member</th>
                <th>Book</th>
                <th>Borrow Date</th>
                <th>Due Date</th>
                <th>Return Date</th>
                <th>Status</th>
                <th>Fine</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id}>
                  <td>#{record.id}</td>
                  <td className="member-name">{record.member.firstName} {record.member.lastName}</td>
                  <td className="book-title">{record.book.title}</td>
                  <td>{formatDate(record.borrowDate)}</td>
                  <td>{formatDate(record.dueDate)}</td>
                  <td>{formatDate(record.returnDate)}</td>
                  <td>
                    <span className={`status-badge ${record.status.toLowerCase()}`}>
                      {record.status}
                    </span>
                  </td>
                  <td>
                    {record.fineAmount && Number(record.fineAmount) > 0
                      ? <span className="fine-amount">${Number(record.fineAmount).toFixed(2)}</span>
                      : '—'}
                  </td>
                  <td className="actions">
                    {record.status !== 'RETURNED' && !record.archived && (
                      returningId === record.id ? (
                        <>
                          <button
                            className="icon-btn return-confirm"
                            title="Confirm return"
                            onClick={() => handleReturn(record.id)}
                          >
                            ✓
                          </button>
                          <button className="icon-btn" title="Cancel" onClick={() => setReturningId(null)}>
                            <X size={16} />
                          </button>
                        </>
                      ) : (
                        <button className="return-btn" onClick={() => setReturningId(record.id)}>
                          Return
                        </button>
                      )
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

      {showBorrowModal && (
        <div className="modal-overlay" onClick={closeBorrowModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Borrow a Book</h2>
              <button className="modal-close" onClick={closeBorrowModal}><X size={20} /></button>
            </div>

            <form className="modal-form" onSubmit={handleBorrow}>
              {borrowError && <div className="form-error">{borrowError}</div>}

              <div className="borrow-section">
                <label className="borrow-label">Member <span className="required">*</span></label>
                {selectedMember ? (
                  <div className="selected-item">
                    <span>{selectedMember.firstName} {selectedMember.lastName}</span>
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => { setSelectedMember(null); setMemberResults([]); setMemberSearched(false); }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="search-row">
                      <input
                        type="text"
                        placeholder="Search by name..."
                        value={memberQuery}
                        onChange={(e) => setMemberQuery(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); searchMembers(); } }}
                      />
                      <button type="button" className="btn-secondary search-btn" onClick={searchMembers}>
                        Search
                      </button>
                    </div>
                    {memberSearched && memberResults.length === 0 && (
                      <p className="no-results">No members found.</p>
                    )}
                    {memberResults.length > 0 && (
                      <ul className="search-results">
                        {memberResults.map((m) => (
                          <li
                            key={m.id}
                            onClick={() => { setSelectedMember(m); setMemberResults([]); setMemberSearched(false); }}
                          >
                            {m.firstName} {m.lastName}
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
              </div>

              <div className="borrow-section">
                <label className="borrow-label">Book <span className="required">*</span></label>
                {selectedBook ? (
                  <div className="selected-item">
                    <span>{selectedBook.title}</span>
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => { setSelectedBook(null); setBookResults([]); setBookSearched(false); }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="search-row">
                      <input
                        type="text"
                        placeholder="Search by title..."
                        value={bookQuery}
                        onChange={(e) => setBookQuery(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); searchBooks(); } }}
                      />
                      <button type="button" className="btn-secondary search-btn" onClick={searchBooks}>
                        Search
                      </button>
                    </div>
                    {bookSearched && bookResults.length === 0 && (
                      <p className="no-results">No books found.</p>
                    )}
                    {bookResults.length > 0 && (
                      <ul className="search-results">
                        {bookResults.map((b) => (
                          <li
                            key={b.id}
                            className={b.availableCopies === 0 ? 'unavailable-result' : ''}
                            onClick={() => {
                              if (b.availableCopies > 0) {
                                setSelectedBook(b);
                                setBookResults([]);
                                setBookSearched(false);
                              }
                            }}
                          >
                            <span>{b.title}</span>
                            <span className="result-meta">by {b.author} · {b.availableCopies} available</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={closeBorrowModal}>Cancel</button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitting || !selectedMember || !selectedBook}
                >
                  {submitting ? 'Processing…' : 'Borrow'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Borrowings;
