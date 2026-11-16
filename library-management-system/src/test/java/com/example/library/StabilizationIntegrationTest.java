package com.example.library;

import com.example.library.model.*;
import com.example.library.repository.*;
import com.example.library.security.JwtService;
import com.example.library.service.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.PlatformTransactionManager;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;
import java.util.concurrent.*;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = "spring.jpa.open-in-view=false")
@AutoConfigureMockMvc
class StabilizationIntegrationTest extends IsolatedDatabaseTest {
    @Autowired MockMvc mvc;
    @Autowired JwtService jwt;
    @Autowired UserRepository users;
    @Autowired BookRepository books;
    @Autowired BorrowingRecordRepository loans;
    @Autowired ReservationRepository holds;
    @Autowired FineRepository fines;
    @Autowired BorrowingService borrowing;
    @Autowired ReservationService reservations;
    @Autowired FineService fineService;
    @Autowired PlatformTransactionManager transactionManager;

    User member(Role role) {
        return users.saveAndFlush(User.builder().firstName("Test").lastName("Member")
                .email(UUID.randomUUID() + "@test.local").password("unused").role(role).active(true).build());
    }
    Book book(int copies) {
        Book b = new Book(); b.setTitle("Test book"); b.setAuthor("Test author");
        b.setPublicationYear(2020); b.setTotalCopies(copies); b.setAvailableCopies(copies);
        return books.saveAndFlush(b);
    }
    String token(User user) { return "Bearer " + jwt.generateToken(user); }

    @Test void securityEnforcesRolesAndInactiveTokens() throws Exception {
        User member = member(Role.USER);
        mvc.perform(get("/api/v1/fines")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/v1/fines").header("Authorization", token(member))).andExpect(status().isForbidden());
        for (Role role : new Role[]{Role.ADMIN, Role.LIBRARIAN}) {
            mvc.perform(get("/api/v1/fines").header("Authorization", token(member(role)))).andExpect(status().isOk());
        }
        mvc.perform(post("/api/v1/auth/register").header("Authorization", token(member))
                .contentType("application/json").content("{}" )).andExpect(status().isForbidden());
        String oldToken = token(member); member.setActive(false); users.saveAndFlush(member);
        mvc.perform(get("/api/v1/fines/my-fines").header("Authorization", oldToken)).andExpect(status().isUnauthorized());
    }


    @Test void loanResponsesSerializeWithoutHibernateProxiesOrCredentials() throws Exception {
        User member = member(Role.USER); Book b = book(1);
        mvc.perform(post("/api/v1/borrowings/borrow").param("memberId", member.getId().toString())
                .param("bookId", b.getId().toString()).header("Authorization", token(member)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.user.password").doesNotExist());
        String[] routes = {"/api/v1/borrowings/member/" + member.getId() + "/active",
                "/api/v1/borrowings/member/" + member.getId()};
        for (String route : routes) {
            mvc.perform(get(route).header("Authorization", token(member))).andExpect(status().isOk())
                    .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.content()
                            .string(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("hibernateLazyInitializer"))));
        }
        mvc.perform(get("/api/v1/borrowings").header("Authorization", token(member(Role.ADMIN))))
                .andExpect(status().isOk()).andExpect(jsonPath("$.content[0].book.title").exists());
        mvc.perform(get("/api/v1/analytics").header("Authorization", token(member)))
                .andExpect(status().isForbidden());
    }

    @Autowired AnalyticsService analytics;

    @Test void collectedFinesIncludePaymentsAndExcludePendingAndWaivedAmounts() {
        var before = analytics.getAnalytics().getBorrowings().getTotalFinesCollected();
        User owner = member(Role.USER); Book b = book(1);
        BorrowingRecord first = borrowing.borrowBook(owner.getId(), b.getId());
        first.setDueDate(LocalDate.now().minusDays(1)); loans.saveAndFlush(first);
        borrowing.returnBook(first.getId());
        Fine waived = fines.findByBorrowingRecordId(first.getId()).orElseThrow();
        assertThat(analytics.getAnalytics().getBorrowings().getTotalFinesCollected()).isEqualByComparingTo(before);
        fineService.waiveFine(waived.getId(), "Test waiver");
        assertThat(analytics.getAnalytics().getBorrowings().getTotalFinesCollected()).isEqualByComparingTo(before);
        BorrowingRecord second = borrowing.borrowBook(owner.getId(), b.getId());
        second.setDueDate(LocalDate.now().minusDays(3)); loans.saveAndFlush(second);
        borrowing.returnBook(second.getId());
        fineService.payFine(fines.findByBorrowingRecordId(second.getId()).orElseThrow().getId(), "TEST-RECEIPT", owner);
        assertThat(analytics.getAnalytics().getBorrowings().getTotalFinesCollected())
                .isEqualByComparingTo(before.add(new java.math.BigDecimal("4.50")));
    }

    @Test void bookDeletionRequiresOutstandingLoansAndReservationsToBeResolved() throws Exception {
        User borrower = member(Role.USER); User waiting = member(Role.USER); User admin = member(Role.ADMIN);
        Book b = book(1); BorrowingRecord loan = borrowing.borrowBook(borrower.getId(), b.getId());
        mvc.perform(delete("/api/v1/books/" + b.getId()).header("Authorization", token(admin)))
                .andExpect(status().isConflict());
        var reservation = reservations.placeHold(waiting.getId(), b.getId());
        borrowing.returnBook(loan.getId());
        mvc.perform(delete("/api/v1/books/" + b.getId()).header("Authorization", token(admin)))
                .andExpect(status().isConflict());
        reservations.cancelHold(reservation.getId(), waiting.getId(), false);
        mvc.perform(delete("/api/v1/books/" + b.getId()).header("Authorization", token(admin)))
                .andExpect(status().isNoContent());
        assertThat(books.findById(b.getId()).orElseThrow().isActive()).isFalse();
    }

    @Test void onlyAdminCanCreateMemberAccounts() throws Exception {
        String body = "{\"firstName\":\"New\",\"lastName\":\"Member\",\"email\":\"" + UUID.randomUUID()
                + "@test.local\",\"password\":\"strong-test-password\",\"membershipDate\":\"2026-01-01\"}";
        mvc.perform(post("/api/v1/members").header("Authorization", token(member(Role.LIBRARIAN)))
                .contentType("application/json").content(body)).andExpect(status().isForbidden());
        mvc.perform(post("/api/v1/members").header("Authorization", token(member(Role.ADMIN)))
                .contentType("application/json").content(body)).andExpect(status().isCreated());
    }

    @Test void overdueReturnCreatesOneFineAndEnforcesOwnership() throws Exception {
        User owner = member(Role.USER); Book b = book(1);
        BorrowingRecord loan = borrowing.borrowBook(owner.getId(), b.getId());
        loan.setDueDate(LocalDate.now().minusDays(2)); loans.saveAndFlush(loan);
        borrowing.returnBook(loan.getId());
        assertThatThrownBy(() -> borrowing.returnBook(loan.getId())).isInstanceOf(RuntimeException.class);
        Fine fine = fines.findByBorrowingRecordId(loan.getId()).orElseThrow();
        assertThat(fine.getAmount()).isEqualByComparingTo("3.00");
        mvc.perform(post("/api/v1/fines/" + fine.getId() + "/pay")
                .header("Authorization", token(member(Role.USER)))).andExpect(status().isForbidden());
        mvc.perform(post("/api/v1/fines/" + fine.getId() + "/pay")
                .header("Authorization", token(owner))).andExpect(status().isOk());
        assertThat(fines.findById(fine.getId()).orElseThrow().getStatus()).isEqualTo(FineStatus.PAID);
    }

    @Test void overdueLoansCountTowardsLimitAndRemainVisible() {
        User member = member(Role.USER); Book b = book(6);
        for (int i = 0; i < 5; i++) {
            BorrowingRecord loan = borrowing.borrowBook(member.getId(), b.getId());
            loan.setStatus(BorrowingRecord.BorrowingStatus.OVERDUE); loans.saveAndFlush(loan);
        }
        assertThat(borrowing.getActiveBorrowings(member.getId())).hasSize(5);
        assertThatThrownBy(() -> borrowing.borrowBook(member.getId(), b.getId()))
                .isInstanceOf(com.example.library.exception.BorrowingLimitExceededException.class);
    }

    @Test void expiredHoldCannotBePickedUpBeforeSweep() {
        User member = member(Role.USER); Book b = book(0);
        holds.saveAndFlush(Reservation.builder().member(member).book(b).status(ReservationStatus.HELD_FOR_PICKUP)
                .reservationDate(LocalDateTime.now().minusDays(3)).pickupDeadline(LocalDateTime.now().minusMinutes(1)).build());
        assertThatThrownBy(() -> borrowing.borrowBook(member.getId(), b.getId()))
                .isInstanceOf(com.example.library.exception.BookNotAvailableException.class);
    }

    @Test void concurrentCheckoutsCannotClaimLastCopyTwice() throws Exception {
        Book b = book(1); User first = member(Role.USER); User second = member(Role.USER);
        ExecutorService pool = Executors.newFixedThreadPool(2); CountDownLatch ready = new CountDownLatch(2);
        Callable<Boolean> a = () -> checkout(first, b, ready);
        Callable<Boolean> c = () -> checkout(second, b, ready);
        try {
            Future<Boolean> one = pool.submit(a); Future<Boolean> two = pool.submit(c);
            assertThat(java.util.List.of(one.get(20, TimeUnit.SECONDS), two.get(20, TimeUnit.SECONDS)))
                    .containsExactlyInAnyOrder(true, false);
            assertThat(books.findById(b.getId()).orElseThrow().getAvailableCopies()).isZero();
        } finally { pool.shutdownNow(); }
    }

    @Test void concurrentReturnsRestoreOnlyOneCopyAndCreateOneFine() throws Exception {
        User owner = member(Role.USER); Book b = book(1);
        BorrowingRecord loan = borrowing.borrowBook(owner.getId(), b.getId());
        loan.setDueDate(LocalDate.now().minusDays(1)); loans.saveAndFlush(loan);
        ExecutorService pool = Executors.newFixedThreadPool(2); CountDownLatch ready = new CountDownLatch(2);
        Callable<Boolean> action = () -> {
            ready.countDown(); if (!ready.await(5, TimeUnit.SECONDS)) throw new AssertionError("Timeout");
            try { borrowing.returnBook(loan.getId()); return true; }
            catch (com.example.library.exception.BookAlreadyReturnedException expected) { return false; }
        };
        try {
            Future<Boolean> one = pool.submit(action); Future<Boolean> two = pool.submit(action);
            assertThat(java.util.List.of(one.get(20, TimeUnit.SECONDS), two.get(20, TimeUnit.SECONDS)))
                    .containsExactlyInAnyOrder(true, false);
            assertThat(books.findById(b.getId()).orElseThrow().getAvailableCopies()).isEqualTo(1);
            assertThat(fines.findByMemberIdOrderByCreatedAtDesc(owner.getId())).hasSize(1);
        } finally { pool.shutdownNow(); }
    }

    @Autowired com.example.library.scheduler.OverdueAndExpiryScheduler scheduler;

    @Test void cancellationRacingExpiryCannotRestoreTwoCopies() throws Exception {
        User owner = member(Role.USER); Book b = book(1);
        BorrowingRecord loan = borrowing.borrowBook(owner.getId(), b.getId());
        User queued = member(Role.USER);
        var reservation = reservations.placeHold(queued.getId(), b.getId());
        borrowing.returnBook(loan.getId());
        Reservation held = holds.findById(reservation.getId()).orElseThrow();
        held.setPickupDeadline(LocalDateTime.now().minusMinutes(1)); holds.saveAndFlush(held);
        ExecutorService pool = Executors.newFixedThreadPool(2); CountDownLatch ready = new CountDownLatch(2);
        try {
            Future<?> cancel = pool.submit(() -> {
                ready.countDown();
                try {
                    if (!ready.await(5, TimeUnit.SECONDS)) throw new AssertionError("Timeout");
                    reservations.cancelHold(held.getId(), queued.getId(), false);
                } catch (IllegalStateException alreadyExpired) { /* The expiry won. */ }
                catch (InterruptedException interrupted) { throw new RuntimeException(interrupted); }
            });
            Future<?> expire = pool.submit(() -> {
                ready.countDown();
                try { if (!ready.await(5, TimeUnit.SECONDS)) throw new AssertionError("Timeout"); }
                catch (InterruptedException interrupted) { throw new RuntimeException(interrupted); }
                scheduler.sweepExpiredHoldPickups();
            });
            cancel.get(20, TimeUnit.SECONDS); expire.get(20, TimeUnit.SECONDS);
            assertThat(books.findById(b.getId()).orElseThrow().getAvailableCopies()).isEqualTo(1);
            assertThat(holds.findById(held.getId()).orElseThrow().getStatus())
                    .isIn(ReservationStatus.CANCELLED, ReservationStatus.EXPIRED);
        } finally { pool.shutdownNow(); }
    }

    @Test void fineThresholdAllowsExactlyTenAndStaffCanWaive() throws Exception {
        User owner = member(Role.USER); Book b = book(2);
        BorrowingRecord previous = borrowing.borrowBook(owner.getId(), b.getId());
        borrowing.returnBook(previous.getId());
        Fine fine = fines.saveAndFlush(Fine.builder().member(owner).borrowingRecord(previous)
                .amount(new java.math.BigDecimal("10.00")).status(FineStatus.PENDING).build());
        assertThat(borrowing.borrowBook(owner.getId(), b.getId())).isNotNull();
        fine.setAmount(new java.math.BigDecimal("10.01")); fines.saveAndFlush(fine);
        assertThatThrownBy(() -> borrowing.borrowBook(owner.getId(), b.getId()))
                .isInstanceOf(com.example.library.exception.OutstandingFineException.class);
        mvc.perform(post("/api/v1/fines/" + fine.getId() + "/waive")
                .header("Authorization", token(member(Role.LIBRARIAN)))).andExpect(status().isOk());
        assertThat(fines.findById(fine.getId()).orElseThrow().getStatus()).isEqualTo(FineStatus.WAIVED);
    }

    boolean checkout(User member, Book book, CountDownLatch ready) throws Exception {
        ready.countDown(); assertThat(ready.await(5, TimeUnit.SECONDS)).isTrue();
        try { borrowing.borrowBook(member.getId(), book.getId()); return true; }
        catch (com.example.library.exception.BookNotAvailableException expected) { return false; }
    }


    @Test void fifoPickupFulfillmentCreatesLoanWithoutReleasingInventory() throws Exception {
        User borrower = member(Role.USER); User first = member(Role.USER); User second = member(Role.USER);
        Book b = book(1); BorrowingRecord original = borrowing.borrowBook(borrower.getId(), b.getId());
        var firstHold = reservations.placeHold(first.getId(), b.getId());
        var secondHold = reservations.placeHold(second.getId(), b.getId());
        // Equal timestamps still use ascending ID as the FIFO tie breaker.
        Reservation one = holds.findById(firstHold.getId()).orElseThrow();
        Reservation two = holds.findById(secondHold.getId()).orElseThrow();
        two.setReservationDate(one.getReservationDate()); holds.saveAndFlush(two);
        assertThat(reservations.getMyHolds(second.getId()).get(0).getQueuePosition()).isEqualTo(2);
        borrowing.returnBook(original.getId());
        mvc.perform(post("/api/v1/reservations/" + firstHold.getId() + "/fulfill")
                .header("Authorization", token(member(Role.LIBRARIAN))))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("FULFILLED"));
        assertThat(holds.findById(firstHold.getId()).orElseThrow().getStatus()).isEqualTo(ReservationStatus.FULFILLED);
        assertThat(borrowing.getActiveBorrowings(first.getId())).hasSize(1);
        assertThat(books.findById(b.getId()).orElseThrow().getAvailableCopies()).isZero();
    }

    @Test void cancellationAndExpiryTransferInventoryOnce() {
        User first = member(Role.USER); User second = member(Role.USER); Book b = book(1);
        BorrowingRecord loan = borrowing.borrowBook(first.getId(), b.getId());
        var hold = reservations.placeHold(second.getId(), b.getId());
        borrowing.returnBook(loan.getId());
        assertThat(holds.findById(hold.getId()).orElseThrow().getStatus()).isEqualTo(ReservationStatus.HELD_FOR_PICKUP);
        reservations.cancelHold(hold.getId(), second.getId(), false);
        assertThat(books.findById(b.getId()).orElseThrow().getAvailableCopies()).isEqualTo(1);
        assertThatThrownBy(() -> reservations.cancelHold(hold.getId(), second.getId(), false)).isInstanceOf(IllegalStateException.class);
    }
}
