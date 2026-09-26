package com.example.library.service;

import com.example.library.dto.FineResponseDTO;
import com.example.library.exception.ResourceNotFoundException;
import com.example.library.model.Fine;
import com.example.library.model.FineStatus;
import com.example.library.model.User;
import com.example.library.repository.FineRepository;
import com.example.library.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FineService {

    private final FineRepository fineRepository;
    private final UserRepository userRepository;

    @Transactional
    public FineResponseDTO payFine(Long fineId, String paymentReference) {
        Fine fine = fineRepository.findById(fineId)
                .orElseThrow(() -> new ResourceNotFoundException("Fine not found with id " + fineId));

        if (fine.getStatus() != FineStatus.PENDING) {
            throw new IllegalStateException("Fine is already settled with status: " + fine.getStatus());
        }

        String ref = (paymentReference != null && !paymentReference.trim().isEmpty())
                ? paymentReference.trim()
                : "PAY-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        fine.setStatus(FineStatus.PAID);
        fine.setSettledAt(LocalDateTime.now());
        fine.setPaymentReference(ref);

        Fine saved = fineRepository.save(fine);
        return toDTO(saved);
    }

    @Transactional
    public FineResponseDTO waiveFine(Long fineId, String notes) {
        Fine fine = fineRepository.findById(fineId)
                .orElseThrow(() -> new ResourceNotFoundException("Fine not found with id " + fineId));

        if (fine.getStatus() != FineStatus.PENDING) {
            throw new IllegalStateException("Fine is already settled with status: " + fine.getStatus());
        }

        String waiverNotes = (notes != null && !notes.trim().isEmpty())
                ? notes.trim()
                : "Fine waived by library administration.";

        fine.setStatus(FineStatus.WAIVED);
        fine.setSettledAt(LocalDateTime.now());
        fine.setNotes(waiverNotes);

        Fine saved = fineRepository.save(fine);
        return toDTO(saved);
    }

    @Transactional(readOnly = true)
    public List<FineResponseDTO> getFinesByMember(Long memberId) {
        userRepository.findById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id " + memberId));

        return fineRepository.findByMemberIdOrderByCreatedAtDesc(memberId)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<FineResponseDTO> getMyFines(Long userId) {
        return fineRepository.findByMemberIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<FineResponseDTO> getAllFines() {
        return fineRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public BigDecimal getTotalOutstandingFines(Long memberId) {
        BigDecimal sum = fineRepository.sumAmountByMemberIdAndStatus(memberId, FineStatus.PENDING);
        return sum != null ? sum : BigDecimal.ZERO;
    }

    public FineResponseDTO toDTO(Fine fine) {
        Long bookId = null;
        String bookTitle = null;
        String bookAuthor = null;
        String bookIsbn = null;
        LocalDate dueDate = null;
        LocalDate returnDate = null;
        Long daysOverdue = 0L;

        if (fine.getBorrowingRecord() != null) {
            dueDate = fine.getBorrowingRecord().getDueDate();
            returnDate = fine.getBorrowingRecord().getReturnDate();
            if (dueDate != null && returnDate != null && returnDate.isAfter(dueDate)) {
                daysOverdue = ChronoUnit.DAYS.between(dueDate, returnDate);
            }
            if (fine.getBorrowingRecord().getBook() != null) {
                bookId = fine.getBorrowingRecord().getBook().getId();
                bookTitle = fine.getBorrowingRecord().getBook().getTitle();
                bookAuthor = fine.getBorrowingRecord().getBook().getAuthor();
                bookIsbn = fine.getBorrowingRecord().getBook().getIsbn();
            }
        }

        Long memberId = null;
        String memberName = null;
        String memberEmail = null;
        if (fine.getMember() != null) {
            memberId = fine.getMember().getId();
            memberName = (fine.getMember().getFirstName() + " " + fine.getMember().getLastName()).trim();
            memberEmail = fine.getMember().getEmail();
        }

        return FineResponseDTO.builder()
                .id(fine.getId())
                .borrowingRecordId(fine.getBorrowingRecord() != null ? fine.getBorrowingRecord().getId() : null)
                .bookId(bookId)
                .bookTitle(bookTitle)
                .bookAuthor(bookAuthor)
                .bookIsbn(bookIsbn)
                .memberId(memberId)
                .memberName(memberName)
                .memberEmail(memberEmail)
                .amount(fine.getAmount())
                .status(fine.getStatus())
                .createdAt(fine.getCreatedAt())
                .settledAt(fine.getSettledAt())
                .paymentReference(fine.getPaymentReference())
                .notes(fine.getNotes())
                .dueDate(dueDate)
                .returnDate(returnDate)
                .daysOverdue(daysOverdue)
                .build();
    }
}
