-- V3__create_fine_table.sql
-- Create fines domain ledger table and performance indexes

CREATE TABLE IF NOT EXISTS fines (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    borrowing_record_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    amount DECIMAL(38, 2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    created_at DATETIME(6) NULL,
    settled_at DATETIME(6) NULL,
    payment_reference VARCHAR(255) NULL,
    notes VARCHAR(1000) NULL,
    CONSTRAINT fk_fine_borrowing FOREIGN KEY (borrowing_record_id) REFERENCES borrowing_records (id) ON DELETE CASCADE,
    CONSTRAINT fk_fine_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_fines_user_status ON fines (user_id, status);
CREATE INDEX idx_fines_borrowing_record ON fines (borrowing_record_id);
CREATE INDEX idx_fines_status ON fines (status);
