package com.example.library.service;

import com.example.library.dto.ReturnRecordResponseDTO;
import com.example.library.exception.BookAlreadyReturnedException;
import com.example.library.exception.BookNotAvailableException;
import com.example.library.exception.BorrowingLimitExceededException;
import com.example.library.exception.ResourceNotFoundException;
import com.example.library.model.Book;
import com.example.library.model.BorrowingRecord;
import com.example.library.model.Member;
import com.example.library.repository.BookRepository;
import com.example.library.repository.BorrowingRecordRepository;
import com.example.library.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BorrowingService {

    private final BorrowingRecordRepository borrowingRecordRepository;
    private final BookRepository bookRepository;
    private final MemberRepository memberRepository;

    public static final int MAX_ALLOWED_BOOKS = 5;
    public static final BigDecimal FINE_PER_OVERDUE_DAY = new BigDecimal("1.50");

    @Transactional
    public BorrowingRecord borrowBook(Long memberId, Long bookId) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found with id " + memberId));

        long activeLoans = borrowingRecordRepository.countByMemberIdAndStatus(memberId, BorrowingRecord.BorrowingStatus.BORROWED);
        if (activeLoans >= MAX_ALLOWED_BOOKS) {
            throw new BorrowingLimitExceededException("Member has reached the maximum allowed borrowed books limit of " + MAX_ALLOWED_BOOKS);
        }

        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found with id " + bookId));

        int updatedRows = bookRepository.decrementAvailableCopies(bookId);
        if (updatedRows == 0) {
            throw new BookNotAvailableException("No copies available for book: " + book.getTitle());
        }

        // Create borrowing record
        BorrowingRecord record = new BorrowingRecord();
        record.setMember(member);
        record.setBook(book);
        record.setBorrowDate(LocalDate.now());
        record.setDueDate(LocalDate.now().plusDays(14)); // 2 weeks loan period
        record.setStatus(BorrowingRecord.BorrowingStatus.BORROWED);

        return borrowingRecordRepository.save(record);
    }

    @Transactional
    public BorrowingRecord returnBook(Long recordId) {
        BorrowingRecord record = borrowingRecordRepository.findById(recordId)
                .orElseThrow(() -> new ResourceNotFoundException("Borrowing record not found with id " + recordId));

        if (record.getStatus() == BorrowingRecord.BorrowingStatus.RETURNED) {
            throw new BookAlreadyReturnedException("Borrowing record " + recordId + " has already been returned");
        }

        // Update book availability atomically
        bookRepository.incrementAvailableCopies(record.getBook().getId());

        // Update record
        LocalDate currentDate = LocalDate.now();
        record.setReturnDate(currentDate);
        record.setStatus(BorrowingRecord.BorrowingStatus.RETURNED);

        if (currentDate.isAfter(record.getDueDate())) {
            long daysOverdue = ChronoUnit.DAYS.between(record.getDueDate(), currentDate);
            record.setFineAmount(FINE_PER_OVERDUE_DAY.multiply(BigDecimal.valueOf(daysOverdue)));
        } else {
            record.setFineAmount(BigDecimal.ZERO);
        }

        return borrowingRecordRepository.save(record);
    }

    public Page<BorrowingRecord> getAllBorrowings(Pageable pageable) {
        return borrowingRecordRepository.findAll(pageable);
    }

    public Page<BorrowingRecord> getMemberHistory(Long memberId, Pageable pageable) {
        return borrowingRecordRepository.findByMemberId(memberId, pageable);
    }

    public List<BorrowingRecord> getActiveBorrowings(Long memberId) {
        return borrowingRecordRepository.findByMemberIdAndStatus(memberId, BorrowingRecord.BorrowingStatus.BORROWED);
    }

    public ReturnRecordResponseDTO toReturnDTO(BorrowingRecord record) {
        long daysOverdue = record.getFineAmount() != null && record.getFineAmount().compareTo(BigDecimal.ZERO) > 0
                ? ChronoUnit.DAYS.between(record.getDueDate(), record.getReturnDate())
                : 0;

        return ReturnRecordResponseDTO.builder()
                .recordId(record.getId())
                .bookTitle(record.getBook().getTitle())
                .bookIsbn(record.getBook().getIsbn())
                .memberName(record.getMember().getFirstName() + " " + record.getMember().getLastName())
                .borrowDate(record.getBorrowDate())
                .dueDate(record.getDueDate())
                .returnDate(record.getReturnDate())
                .overdue(daysOverdue > 0)
                .daysOverdue(daysOverdue)
                .fineAmount(record.getFineAmount())
                .build();
    }
}
