-- V4__add_reservation_pickup_fields.sql
-- Add pickup_deadline column to reservations table and indexes for hold fulfillment

ALTER TABLE reservations ADD COLUMN pickup_deadline DATETIME(6) NULL;

CREATE INDEX idx_reservation_status_pickup ON reservations (status, pickup_deadline);
CREATE INDEX idx_reservation_user_status ON reservations (user_id, status);
