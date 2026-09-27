package com.example.library.controller;

import com.example.library.dto.SchedulerSweepResponseDTO;
import com.example.library.scheduler.OverdueAndExpiryScheduler;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/v1/admin/scheduler")
@RequiredArgsConstructor
@Slf4j
public class SchedulerAdminController {

    private final OverdueAndExpiryScheduler scheduler;

    /**
     * Manually trigger the overdue borrowing sweep.
     * Restricted to ADMIN role only.
     */
    @PostMapping("/run-overdue-sweep")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SchedulerSweepResponseDTO> runOverdueSweep() {
        log.info("Admin manually triggered overdue borrowing sweep");
        int updated = scheduler.sweepOverdueBorrowings();
        SchedulerSweepResponseDTO response = SchedulerSweepResponseDTO.builder()
                .task("sweepOverdueBorrowings")
                .status("COMPLETED")
                .processedCount(updated)
                .message(updated == 0
                        ? "No overdue borrowings found to transition."
                        : updated + " borrowing(s) transitioned to OVERDUE status.")
                .executedAt(LocalDateTime.now())
                .build();
        return ResponseEntity.ok(response);
    }

    /**
     * Manually trigger the expired hold reservation sweep.
     * Restricted to ADMIN role only.
     */
    @PostMapping("/run-expiry-sweep")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SchedulerSweepResponseDTO> runExpirySweep() {
        log.info("Admin manually triggered expired hold reservation sweep");
        int expired = scheduler.sweepExpiredHoldPickups();
        SchedulerSweepResponseDTO response = SchedulerSweepResponseDTO.builder()
                .task("sweepExpiredHoldPickups")
                .status("COMPLETED")
                .processedCount(expired)
                .message(expired == 0
                        ? "No expired hold reservations found to process."
                        : expired + " hold reservation(s) expired and cascaded to next patron or stock restored.")
                .executedAt(LocalDateTime.now())
                .build();
        return ResponseEntity.ok(response);
    }
}
