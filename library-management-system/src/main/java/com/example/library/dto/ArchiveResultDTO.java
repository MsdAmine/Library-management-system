package com.example.library.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Builder
public class ArchiveResultDTO {
    private final int archivedCount;
    private final int retentionDays;
    private final LocalDate cutoffDate;
    private final LocalDateTime archivedAt;
}
