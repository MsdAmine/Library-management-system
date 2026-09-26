package com.example.library.service;

import com.example.library.dto.FineResponseDTO;
import com.example.library.exception.ResourceNotFoundException;
import com.example.library.model.*;
import com.example.library.repository.FineRepository;
import com.example.library.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FineServiceTest {

    @Mock
    private FineRepository fineRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private FineService fineService;

    private User sampleUser;
    private Book sampleBook;
    private BorrowingRecord sampleBorrowingRecord;
    private Fine samplePendingFine;

    @BeforeEach
    void setUp() {
        sampleUser = User.builder()
                .id(1L)
                .firstName("Alice")
                .lastName("Smith")
                .email("alice.smith@example.com")
                .role(Role.USER)
                .membershipDate(LocalDate.of(2026, 1, 15))
                .active(true)
                .build();

        sampleBook = new Book();
        sampleBook.setId(10L);
        sampleBook.setTitle("Clean Code");
        sampleBook.setAuthor("Robert C. Martin");
        sampleBook.setIsbn("9780132350884");
        sampleBook.setPublicationYear(2008);
        sampleBook.setTotalCopies(5);
        sampleBook.setAvailableCopies(4);
        sampleBook.setActive(true);

        sampleBorrowingRecord = BorrowingRecord.builder()
                .id(50L)
                .user(sampleUser)
                .book(sampleBook)
                .borrowDate(LocalDate.now().minusDays(20))
                .dueDate(LocalDate.now().minusDays(6))
                .returnDate(LocalDate.now())
                .status(BorrowingRecord.BorrowingStatus.RETURNED)
                .fineAmount(new BigDecimal("9.00"))
                .build();

        samplePendingFine = Fine.builder()
                .id(100L)
                .borrowingRecord(sampleBorrowingRecord)
                .member(sampleUser)
                .amount(new BigDecimal("9.00"))
                .status(FineStatus.PENDING)
                .createdAt(LocalDateTime.now().minusHours(2))
                .notes("Overdue return: 6 days late")
                .build();
    }

    @Test
    @DisplayName("payFine: Successfully settles pending fine with provided payment reference")
    void payFine_Success_WithProvidedReference() {
        when(fineRepository.findById(100L)).thenReturn(Optional.of(samplePendingFine));
        when(fineRepository.save(any(Fine.class))).thenAnswer(invocation -> invocation.getArgument(0));

        FineResponseDTO result = fineService.payFine(100L, "STRIPE_CH_987654");

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(100L);
        assertThat(result.getStatus()).isEqualTo(FineStatus.PAID);
        assertThat(result.getSettledAt()).isNotNull();
        assertThat(result.getPaymentReference()).isEqualTo("STRIPE_CH_987654");
        assertThat(result.getAmount()).isEqualByComparingTo("9.00");
        assertThat(result.getMemberName()).isEqualTo("Alice Smith");
        assertThat(result.getBookTitle()).isEqualTo("Clean Code");

        verify(fineRepository).save(samplePendingFine);
    }

    @Test
    @DisplayName("payFine: Auto-generates payment reference when none is provided")
    void payFine_Success_GeneratesDefaultReference() {
        when(fineRepository.findById(100L)).thenReturn(Optional.of(samplePendingFine));
        when(fineRepository.save(any(Fine.class))).thenAnswer(invocation -> invocation.getArgument(0));

        FineResponseDTO result = fineService.payFine(100L, null);

        assertThat(result.getStatus()).isEqualTo(FineStatus.PAID);
        assertThat(result.getPaymentReference()).startsWith("PAY-");
        assertThat(result.getSettledAt()).isNotNull();
    }

    @Test
    @DisplayName("payFine: Throws ResourceNotFoundException when fine does not exist")
    void payFine_ThrowsException_WhenNotFound() {
        when(fineRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> fineService.payFine(999L, "REF-123"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Fine not found with id 999");
    }

    @Test
    @DisplayName("payFine: Throws IllegalStateException when fine is already PAID or WAIVED")
    void payFine_ThrowsException_WhenAlreadySettled() {
        samplePendingFine.setStatus(FineStatus.PAID);
        when(fineRepository.findById(100L)).thenReturn(Optional.of(samplePendingFine));

        assertThatThrownBy(() -> fineService.payFine(100L, "REF-123"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Fine is already settled with status: PAID");
    }

    @Test
    @DisplayName("waiveFine: Successfully waives fine with custom notes")
    void waiveFine_Success() {
        when(fineRepository.findById(100L)).thenReturn(Optional.of(samplePendingFine));
        when(fineRepository.save(any(Fine.class))).thenAnswer(invocation -> invocation.getArgument(0));

        FineResponseDTO result = fineService.waiveFine(100L, "First-time overdue courtesy waiver approved by Librarian.");

        assertThat(result.getStatus()).isEqualTo(FineStatus.WAIVED);
        assertThat(result.getSettledAt()).isNotNull();
        assertThat(result.getNotes()).isEqualTo("First-time overdue courtesy waiver approved by Librarian.");

        verify(fineRepository).save(samplePendingFine);
    }

    @Test
    @DisplayName("waiveFine: Throws IllegalStateException when fine is already WAIVED")
    void waiveFine_ThrowsException_WhenAlreadyWaived() {
        samplePendingFine.setStatus(FineStatus.WAIVED);
        when(fineRepository.findById(100L)).thenReturn(Optional.of(samplePendingFine));

        assertThatThrownBy(() -> fineService.waiveFine(100L, "Notes"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Fine is already settled with status: WAIVED");
    }

    @Test
    @DisplayName("getFinesByMember: Returns list of member fines")
    void getFinesByMember_Success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(fineRepository.findByMemberIdOrderByCreatedAtDesc(1L)).thenReturn(List.of(samplePendingFine));

        List<FineResponseDTO> results = fineService.getFinesByMember(1L);

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getId()).isEqualTo(100L);
        assertThat(results.get(0).getMemberEmail()).isEqualTo("alice.smith@example.com");
    }

    @Test
    @DisplayName("getFinesByMember: Throws ResourceNotFoundException if user does not exist")
    void getFinesByMember_ThrowsNotFound() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> fineService.getFinesByMember(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("getMyFines: Returns fines for authenticated user")
    void getMyFines_Success() {
        when(fineRepository.findByMemberIdOrderByCreatedAtDesc(1L)).thenReturn(List.of(samplePendingFine));

        List<FineResponseDTO> results = fineService.getMyFines(1L);

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getAmount()).isEqualByComparingTo("9.00");
    }

    @Test
    @DisplayName("getTotalOutstandingFines: Returns total sum of pending fines")
    void getTotalOutstandingFines_ReturnsSum() {
        when(fineRepository.sumAmountByMemberIdAndStatus(1L, FineStatus.PENDING))
                .thenReturn(new BigDecimal("15.50"));

        BigDecimal total = fineService.getTotalOutstandingFines(1L);

        assertThat(total).isEqualByComparingTo("15.50");
    }

    @Test
    @DisplayName("getTotalOutstandingFines: Returns zero when no pending fines exist")
    void getTotalOutstandingFines_ReturnsZeroWhenNull() {
        when(fineRepository.sumAmountByMemberIdAndStatus(1L, FineStatus.PENDING)).thenReturn(null);

        BigDecimal total = fineService.getTotalOutstandingFines(1L);

        assertThat(total).isEqualByComparingTo(BigDecimal.ZERO);
    }
}
