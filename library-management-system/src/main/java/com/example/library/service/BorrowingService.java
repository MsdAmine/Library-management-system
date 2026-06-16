package com.example.library.service;

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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BorrowingService {

    private final BorrowingRecordRepository borrowingRecordRepository;
    private final BookRepository bookRepository;
    private final MemberRepository memberRepository;

    public static final int MAX_ALLOWED_BOOKS = 5;

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
            throw new RuntimeException("Book already returned");
        }

        // Update book availability atomically
        bookRepository.incrementAvailableCopies(record.getBook().getId());

        // Update record
        record.setReturnDate(LocalDate.now());
        record.setStatus(BorrowingRecord.BorrowingStatus.RETURNED);

        return borrowingRecordRepository.save(record);
    }

    public List<BorrowingRecord> getMemberHistory(Long memberId) {
        return borrowingRecordRepository.findByMemberId(memberId);
    }
}
