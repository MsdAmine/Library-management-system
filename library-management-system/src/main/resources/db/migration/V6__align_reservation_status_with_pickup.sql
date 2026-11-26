-- Legacy Hibernate-created ENUM columns can omit HELD_FOR_PICKUP. Match the
-- canonical V1 definition so all application reservation states can be stored.
-- Converting the column keeps existing status strings, rows, indexes, and keys.
ALTER TABLE reservations
    MODIFY COLUMN status VARCHAR(50) NOT NULL DEFAULT 'PENDING';
