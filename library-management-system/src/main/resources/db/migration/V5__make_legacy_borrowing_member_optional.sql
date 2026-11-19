-- Databases baselined before the members-to-users transition can retain this
-- unmapped NOT NULL column. Keep historical member IDs and their foreign key,
-- but let new loans identify the borrower exclusively through required user_id.
-- Fresh databases have no member_id column and need no schema change.
SET @library_legacy_borrower_sql = (
    SELECT IF(
        COUNT(*) = 0,
        'SELECT 1',
        CONCAT('ALTER TABLE borrowing_records MODIFY COLUMN member_id ', MAX(COLUMN_TYPE), ' NULL')
    )
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'borrowing_records'
      AND column_name = 'member_id'
      AND is_nullable = 'NO'
);

PREPARE library_legacy_borrower_statement FROM @library_legacy_borrower_sql;
EXECUTE library_legacy_borrower_statement;
DEALLOCATE PREPARE library_legacy_borrower_statement;
SET @library_legacy_borrower_sql = NULL;
