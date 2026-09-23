-- V2__add_performance_indexes.sql
-- Performance indexes for frequent search filters, loans, and reservations

-- Borrowing records composite indexes for status, member history, and overdue batch queries
CREATE INDEX idx_borrowing_user_status ON borrowing_records (user_id, status);
CREATE INDEX idx_borrowing_status_duedate ON borrowing_records (status, due_date);

-- Reservation queue indexing for fast hold queue calculation and FIFO fulfillment
CREATE INDEX idx_reservation_book_status_date ON reservations (book_id, status, reservation_date);

-- Book search and filtering indexes
CREATE INDEX idx_books_title ON books (title);
CREATE INDEX idx_books_author ON books (author);
CREATE INDEX idx_books_genre_active ON books (genre, active);

-- Member directory name search composite index
CREATE INDEX idx_users_names ON users (first_name, last_name);
