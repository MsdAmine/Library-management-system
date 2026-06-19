package com.example.library.controller;

import com.example.library.dto.ArchiveResultDTO;
import com.example.library.dto.ReturnRecordResponseDTO;
import com.example.library.model.BorrowingRecord;
import com.example.library.service.BorrowingService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/borrowings")
@RequiredArgsConstructor
public class BorrowingController {

    private final BorrowingService borrowingService;

    @PostMapping("/borrow")
    public ResponseEntity<BorrowingRecord> borrowBook(@RequestParam Long memberId, @RequestParam Long bookId) {
        return ResponseEntity.ok(borrowingService.borrowBook(memberId, bookId));
    }

    @PostMapping("/return/{recordId}")
    public ResponseEntity<ReturnRecordResponseDTO> returnBook(@PathVariable Long recordId) {
        BorrowingRecord record = borrowingService.returnBook(recordId);
        return ResponseEntity.ok(borrowingService.toReturnDTO(record));
    }

    @GetMapping
    public ResponseEntity<Page<BorrowingRecord>> getAllBorrowings(
            @PageableDefault(size = 10, sort = "borrowDate") Pageable pageable) {
        return ResponseEntity.ok(borrowingService.getAllBorrowings(pageable));
    }

    @GetMapping("/member/{memberId}")
    public ResponseEntity<Page<BorrowingRecord>> getMemberHistory(
            @PathVariable Long memberId,
            @PageableDefault(size = 10, sort = "borrowDate") Pageable pageable) {
        return ResponseEntity.ok(borrowingService.getMemberHistory(memberId, pageable));
    }

    @GetMapping("/member/{memberId}/active")
    public ResponseEntity<List<BorrowingRecord>> getActiveBorrowings(@PathVariable Long memberId) {
        return ResponseEntity.ok(borrowingService.getActiveBorrowings(memberId));
    }

    @PostMapping("/archive")
    public ResponseEntity<ArchiveResultDTO> archiveHistory(
            @RequestParam(defaultValue = "90") int retentionDays) {
        return ResponseEntity.ok(borrowingService.archiveReturnedRecords(retentionDays));
    }

    @GetMapping("/archived")
    public ResponseEntity<List<BorrowingRecord>> getArchivedRecords() {
        return ResponseEntity.ok(borrowingService.getArchivedRecords());
    }
}
