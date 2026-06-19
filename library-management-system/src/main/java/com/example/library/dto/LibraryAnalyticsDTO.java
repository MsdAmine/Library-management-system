package com.example.library.dto;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class LibraryAnalyticsDTO {

    private final BookStats books;
    private final BorrowingStats borrowings;
    private final MemberStats members;

    @Getter
    @Builder
    public static class BookStats {
        private final long totalTitles;
        private final long totalCopies;
        private final long availableCopies;
        private final long borrowedCopies;
    }

    @Getter
    @Builder
    public static class BorrowingStats {
        private final long totalBorrowings;
        private final long activeBorrowings;
        private final long overdueBorrowings;
        private final BigDecimal totalFinesCollected;
    }

    @Getter
    @Builder
    public static class MemberStats {
        private final long totalMembers;
        private final long activeMembers;
    }
}
