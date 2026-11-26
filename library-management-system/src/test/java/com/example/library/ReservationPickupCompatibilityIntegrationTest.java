package com.example.library;

import com.example.library.model.Book;
import com.example.library.model.Role;
import com.example.library.model.User;
import com.example.library.repository.BookRepository;
import com.example.library.repository.BorrowingRecordRepository;
import com.example.library.repository.UserRepository;
import com.example.library.security.JwtService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.sql.DriverManager;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = "spring.jpa.open-in-view=false")
@AutoConfigureMockMvc
@Testcontainers
class ReservationPickupCompatibilityIntegrationTest {
    @Container
    static final MySQLContainer<?> MYSQL = new MySQLContainer<>("mysql:8.0");
    static List<Map<String, Object>> legacyReservations;
    static List<Map<String, Object>> legacyIndexes;
    static List<Map<String, Object>> legacyForeignKeys;

    @DynamicPropertySource
    static void legacyDatabase(DynamicPropertyRegistry properties) throws Exception {
        // Prepare the real pre-upgrade schema before Spring runs pending migrations.
        if (!MYSQL.isRunning()) MYSQL.start();
        Flyway.configure().dataSource(MYSQL.getJdbcUrl(), MYSQL.getUsername(), MYSQL.getPassword())
                .target("5").load().migrate();
        try (var connection = DriverManager.getConnection(MYSQL.getJdbcUrl(), MYSQL.getUsername(), MYSQL.getPassword());
             var statement = connection.createStatement()) {
            statement.execute("ALTER TABLE reservations MODIFY COLUMN status "
                    + "ENUM('CANCELLED','EXPIRED','FULFILLED','PENDING') NOT NULL");
            statement.execute("INSERT INTO users (id,first_name,last_name,email,password,role,membership_date) "
                    + "VALUES (10,'Legacy','Reader','legacy@test.local','unused','USER','2026-01-01')");
            statement.execute("INSERT INTO books (id,title,author,publication_year,total_copies,available_copies) "
                    + "VALUES (20,'Legacy title','Author',2020,1,0)");
            for (String state : List.of("PENDING", "CANCELLED", "EXPIRED", "FULFILLED")) {
                statement.execute("INSERT INTO reservations "
                        + "(user_id,book_id,reservation_date,status,pickup_deadline,created_at,updated_at) "
                        + "VALUES (10,20,'2026-01-01 12:00:00','" + state
                        + "','2026-01-03 12:00:00','2026-01-01 12:00:00','2026-01-02 12:00:00')");
            }
            var snapshot = new JdbcTemplate(new org.springframework.jdbc.datasource.SingleConnectionDataSource(connection, true));
            legacyReservations = snapshot.queryForList("SELECT * FROM reservations ORDER BY id");
            legacyIndexes = snapshot.queryForList(indexQuery());
            legacyForeignKeys = snapshot.queryForList(foreignKeyQuery());
        }
        // All connection properties come from this disposable container, never local configuration.
        properties.add("spring.datasource.url", MYSQL::getJdbcUrl);
        properties.add("spring.datasource.username", MYSQL::getUsername);
        properties.add("spring.datasource.password", MYSQL::getPassword);
        properties.add("spring.datasource.driver-class-name", () -> "com.mysql.cj.jdbc.Driver");
        properties.add("app.scheduler.enabled", () -> "false");
        properties.add("app.bootstrap.enabled", () -> "false");
        properties.add("application.security.jwt.secret-key", () ->
                "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970");
    }

    @Autowired JdbcTemplate jdbc;
    @Autowired Flyway flyway;
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired JwtService jwt;
    @Autowired UserRepository users;
    @Autowired BookRepository books;
    @Autowired BorrowingRecordRepository loans;

    @Test
    void migrationPreservesReservationHistoryRelationshipsAndIndexes() {
        assertThat(jdbc.queryForList("SELECT * FROM reservations WHERE book_id=20 ORDER BY id"))
                .isEqualTo(legacyReservations);
        assertThat(jdbc.queryForList(indexQuery())).isEqualTo(legacyIndexes);
        assertThat(jdbc.queryForList(foreignKeyQuery())).isEqualTo(legacyForeignKeys);
        var column = jdbc.queryForMap("SELECT DATA_TYPE,CHARACTER_MAXIMUM_LENGTH,IS_NULLABLE,COLUMN_DEFAULT "
                + "FROM information_schema.columns WHERE table_schema=DATABASE() "
                + "AND table_name='reservations' AND column_name='status'");
        assertThat(column.get("DATA_TYPE")).isEqualTo("varchar");
        assertThat(((Number) column.get("CHARACTER_MAXIMUM_LENGTH")).intValue()).isEqualTo(50);
        assertThat(column.get("IS_NULLABLE")).isEqualTo("NO");
        assertThat(column.get("COLUMN_DEFAULT")).isEqualTo("PENDING");
        assertThat(flyway.migrate().migrationsExecuted).isZero();
        assertThat(jdbc.queryForList("SELECT * FROM reservations WHERE book_id=20 ORDER BY id"))
                .isEqualTo(legacyReservations);
    }

    @Test
    void memberCanClaimReservedCopyAfterReturnOnUpgradedLegacyDatabase() throws Exception {
        User borrower = member(Role.USER);
        User waiting = member(Role.USER);
        User librarian = member(Role.LIBRARIAN);
        Book book = new Book();
        book.setTitle("Pickup workflow"); book.setAuthor("Author"); book.setPublicationYear(2020);
        book.setTotalCopies(1); book.setAvailableCopies(1);
        book = books.saveAndFlush(book);
        long bookId = book.getId();

        var checkout = mvc.perform(post("/api/v1/borrowings/borrow")
                        .param("memberId", borrower.getId().toString()).param("bookId", Long.toString(bookId))
                        .header("Authorization", token(borrower)))
                .andExpect(status().isOk()).andReturn();
        long originalLoanId = json.readTree(checkout.getResponse().getContentAsString()).get("id").asLong();
        var hold = mvc.perform(post("/api/v1/reservations/hold").param("bookId", Long.toString(bookId))
                        .header("Authorization", token(waiting)))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.queuePosition").value(1)).andReturn();
        long holdId = json.readTree(hold.getResponse().getContentAsString()).get("id").asLong();

        mvc.perform(post("/api/v1/borrowings/return/" + originalLoanId).header("Authorization", token(librarian)))
                .andExpect(status().isOk());
        mvc.perform(get("/api/v1/reservations/my-holds").header("Authorization", token(waiting)))
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].status").value("HELD_FOR_PICKUP"))
                .andExpect(jsonPath("$[0].pickupDeadline").isNotEmpty())
                .andExpect(jsonPath("$[0].queuePosition").value(1));
        assertThat(books.findById(bookId).orElseThrow().getAvailableCopies()).isZero();

        mvc.perform(post("/api/v1/borrowings/borrow")
                        .param("memberId", waiting.getId().toString()).param("bookId", Long.toString(bookId))
                        .header("Authorization", token(waiting)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.user.id").value(waiting.getId().intValue()))
                .andExpect(jsonPath("$.status").value("BORROWED"))
                .andExpect(jsonPath("$.dueDate").value(LocalDate.now().plusDays(14).toString()));
        assertThat(jdbc.queryForObject("SELECT status FROM reservations WHERE id=?", String.class, holdId))
                .isEqualTo("FULFILLED");
        assertThat(loans.findById(originalLoanId).orElseThrow().getReturnDate()).isEqualTo(LocalDate.now());
        assertThat(books.findById(bookId).orElseThrow().getAvailableCopies()).isZero();
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM borrowing_records WHERE book_id=?", Integer.class, bookId))
                .isEqualTo(2);
    }

    private User member(Role role) {
        return users.saveAndFlush(User.builder().firstName("Pickup").lastName("Tester")
                .email(UUID.randomUUID() + "@test.local").password("unused").role(role).active(true).build());
    }

    private String token(User user) { return "Bearer " + jwt.generateToken(user); }

    private static String indexQuery() {
        return "SELECT INDEX_NAME,NON_UNIQUE,SEQ_IN_INDEX,COLUMN_NAME FROM information_schema.statistics "
                + "WHERE table_schema=DATABASE() AND table_name='reservations' ORDER BY INDEX_NAME,SEQ_IN_INDEX";
    }

    private static String foreignKeyQuery() {
        return "SELECT CONSTRAINT_NAME,COLUMN_NAME,REFERENCED_TABLE_NAME,REFERENCED_COLUMN_NAME "
                + "FROM information_schema.key_column_usage WHERE table_schema=DATABASE() "
                + "AND table_name='reservations' AND REFERENCED_TABLE_NAME IS NOT NULL ORDER BY CONSTRAINT_NAME,COLUMN_NAME";
    }
}
