package com.example.library;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

import static org.assertj.core.api.Assertions.assertThat;

@Testcontainers
class LegacyBorrowingSchemaMigrationTest {
    @Container
    static final MySQLContainer<?> MYSQL = new MySQLContainer<>("mysql:8.0");

    @Test
    void legacyMemberColumnBecomesOptionalWithoutChangingExistingBorrowers() throws Exception {
        Flyway.configure().dataSource(MYSQL.getJdbcUrl(), MYSQL.getUsername(), MYSQL.getPassword())
                .target("4").load().migrate();

        try (Connection connection = DriverManager.getConnection(
                MYSQL.getJdbcUrl(), MYSQL.getUsername(), MYSQL.getPassword());
             Statement statement = connection.createStatement()) {
            statement.execute("CREATE TABLE members (id BIGINT PRIMARY KEY)");
            statement.execute("INSERT INTO members (id) VALUES (20)");
            statement.execute("ALTER TABLE borrowing_records ADD COLUMN member_id BIGINT NOT NULL, "
                    + "ADD CONSTRAINT fk_legacy_borrowing_member FOREIGN KEY (member_id) REFERENCES members(id)");
            statement.execute("INSERT INTO users (id,first_name,last_name,email,password,role,membership_date) "
                    + "VALUES (10,'Legacy','Reader','legacy@test.local','unused','USER','2026-01-01')");
            statement.execute("INSERT INTO books (id,title,author,publication_year,total_copies,available_copies) "
                    + "VALUES (30,'Legacy book','Author',2020,3,2)");
            statement.execute("INSERT INTO borrowing_records "
                    + "(id,user_id,member_id,book_id,borrow_date,due_date,status) "
                    + "VALUES (40,10,20,30,'2026-01-01','2026-01-15','BORROWED')");

            Flyway latest = Flyway.configure()
                    .dataSource(MYSQL.getJdbcUrl(), MYSQL.getUsername(), MYSQL.getPassword()).target("5").load();
            assertThat(latest.migrate().migrationsExecuted).isEqualTo(1);

            try (ResultSet row = statement.executeQuery(
                    "SELECT user_id,member_id FROM borrowing_records WHERE id=40")) {
                assertThat(row.next()).isTrue();
                assertThat(row.getLong("user_id")).isEqualTo(10);
                assertThat(row.getLong("member_id")).isEqualTo(20);
            }
            // This is the same column list Hibernate uses: no legacy member_id.
            statement.execute("INSERT INTO borrowing_records "
                    + "(user_id,book_id,borrow_date,due_date,status) "
                    + "VALUES (10,30,'2026-02-01','2026-02-15','BORROWED')");
            try (ResultSet row = statement.executeQuery(
                    "SELECT user_id,member_id FROM borrowing_records WHERE id<>40")) {
                assertThat(row.next()).isTrue();
                assertThat(row.getLong("user_id")).isEqualTo(10);
                assertThat(row.getObject("member_id")).isNull();
            }
            try (ResultSet row = statement.executeQuery(
                    "SELECT COUNT(*) FROM information_schema.key_column_usage WHERE table_schema=DATABASE() "
                            + "AND table_name='borrowing_records' AND column_name='member_id' "
                            + "AND referenced_table_name='members'")) {
                assertThat(row.next()).isTrue();
                assertThat(row.getInt(1)).isEqualTo(1);
            }
            try (ResultSet row = statement.executeQuery(
                    "SELECT is_nullable FROM information_schema.columns WHERE table_schema=DATABASE() "
                            + "AND table_name='borrowing_records' AND column_name='user_id'")) {
                assertThat(row.next()).isTrue();
                assertThat(row.getString(1)).isEqualTo("NO");
            }
            assertThat(latest.migrate().migrationsExecuted).isZero();
        }
    }
}
