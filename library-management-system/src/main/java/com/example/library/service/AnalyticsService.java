package com.example.library.service;

import com.example.library.dto.LibraryAnalyticsDTO;
import com.example.library.model.BorrowingRecord;
import com.example.library.repository.BookRepository;
import com.example.library.repository.BorrowingRecordRepository;
import com.example.library.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final BookRepository bookRepository;
    private final BorrowingRecordRepository borrowingRecordRepository;
    private final MemberRepository memberRepository;

    public LibraryAnalyticsDTO getAnalytics() {
        long totalCopies = bookRepository.sumTotalCopies();
        long availableCopies = bookRepository.sumAvailableCopies();

        long activeBorrowings = borrowingRecordRepository.countByStatus(BorrowingRecord.BorrowingStatus.BORROWED);

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
                        .overdueBorrowings(borrowingRecordRepository.countOverdue(LocalDate.now()))
                        .totalFinesCollected(borrowingRecordRepository.sumFinesCollected())
                        .build())
                .members(LibraryAnalyticsDTO.MemberStats.builder()
                        .totalMembers(memberRepository.count())
                        .activeMembers(borrowingRecordRepository.countActiveMembers())
                        .build())
                .build();
    }
}
