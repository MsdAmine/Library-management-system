package com.example.library.service;

import com.example.library.dto.LibraryAnalyticsDTO;
import com.example.library.model.BorrowingRecord;
import com.example.library.repository.BookRepository;
import com.example.library.repository.BorrowingRecordRepository;
import com.example.library.repository.UserRepository;
import com.example.library.repository.FineRepository;
import com.example.library.model.FineStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

        private final BookRepository bookRepository;
        private final BorrowingRecordRepository borrowingRecordRepository;
        private final UserRepository userRepository;
        private final FineRepository fineRepository;

        public LibraryAnalyticsDTO getAnalytics() {
                long totalCopies = bookRepository.sumTotalCopies();
                long availableCopies = bookRepository.sumAvailableCopies();

                long activeBorrowings = borrowingRecordRepository
                                .countByStatus(BorrowingRecord.BorrowingStatus.BORROWED)
                                + borrowingRecordRepository.countByStatus(BorrowingRecord.BorrowingStatus.OVERDUE);

                return LibraryAnalyticsDTO.builder()
                                .books(LibraryAnalyticsDTO.BookStats.builder()
                                                .totalTitles(bookRepository.count())
                                                .totalCopies(totalCopies)
                                                .availableCopies(availableCopies)
                                                .borrowedCopies(totalCopies - availableCopies)
                                                .build())
                                .borrowings(LibraryAnalyticsDTO.BorrowingStats.builder()
                                                .totalBorrowings(borrowingRecordRepository.count())
                                                .activeBorrowings(activeBorrowings)
                                                .overdueBorrowings(
                                                                borrowingRecordRepository.countOverdue(LocalDate.now()))
                                                .totalFinesCollected(fineRepository.sumAmountByStatus(FineStatus.PAID))
                                                .build())
                                .members(LibraryAnalyticsDTO.MemberStats.builder()
                                                .totalMembers(userRepository.count())
                                                .activeMembers(borrowingRecordRepository.countActiveMembers())
                                                .build())
                                .build();
        }
}