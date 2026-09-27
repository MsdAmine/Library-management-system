package com.example.library.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SchedulerSweepResponseDTO {
    private String task;
    private String status;
    private int processedCount;
    private String message;
    private LocalDateTime executedAt;
}
