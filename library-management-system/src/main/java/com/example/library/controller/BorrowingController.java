package com.example.library.controller;

import com.example.library.dto.ArchiveResultDTO;
import com.example.library.dto.BorrowingResponseDTO;
import org.springframework.transaction.annotation.Transactional;
import com.example.library.dto.ReturnRecordResponseDTO;
import com.example.library.model.BorrowingRecord;
import com.example.library.service.BorrowingService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/borrowings")
@RequiredArgsConstructor
public class BorrowingController {

    private final BorrowingService borrowingService;

    @Transactional(isolation = org.springframework.transaction.annotation.Isolation.READ_COMMITTED)
    @PostMapping("/borrow")
    @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN') or (authentication.principal != null and authentication.principal.id == #memberId)")
    public ResponseEntity<BorrowingResponseDTO> borrowBook(@RequestParam Long memberId, @RequestParam Long bookId) {
        return ResponseEntity.ok(BorrowingResponseDTO.from(borrowingService.borrowBook(memberId, bookId)));
    }

    @Transactional(isolation = org.springframework.transaction.annotation.Isolation.READ_COMMITTED)
    @PostMapping("/return/{recordId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
    public ResponseEntity<ReturnRecordResponseDTO> returnBook(@PathVariable Long recordId) {
        BorrowingRecord record = borrowingService.returnBook(recordId);
        return ResponseEntity.ok(borrowingService.toReturnDTO(record));
    }

    @Transactional(readOnly = true)
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
    public ResponseEntity<Page<BorrowingResponseDTO>> getAllBorrowings(
            @PageableDefault(size = 10, sort = "borrowDate") Pageable pageable) {
        return ResponseEntity.ok(borrowingService.getAllBorrowings(pageable).map(BorrowingResponseDTO::from));
    }

    @Transactional(readOnly = true)
    @GetMapping("/member/{memberId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN') or (authentication.principal != null and authentication.principal.id == #memberId)")
    public ResponseEntity<Page<BorrowingResponseDTO>> getMemberHistory(
            @PathVariable Long memberId,
            @PageableDefault(size = 10, sort = "borrowDate") Pageable pageable) {
        return ResponseEntity.ok(borrowingService.getMemberHistory(memberId, pageable).map(BorrowingResponseDTO::from));
    }

    @Transactional(readOnly = true)
    @GetMapping("/member/{memberId}/active")
    @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN') or (authentication.principal != null and authentication.principal.id == #memberId)")
    public ResponseEntity<List<BorrowingResponseDTO>> getActiveBorrowings(@PathVariable Long memberId) {
        return ResponseEntity.ok(borrowingService.getActiveBorrowings(memberId).stream().map(BorrowingResponseDTO::from).toList());
    }

    @PostMapping("/archive")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ArchiveResultDTO> archiveHistory(
            @RequestParam(defaultValue = "90") int retentionDays) {
        return ResponseEntity.ok(borrowingService.archiveReturnedRecords(retentionDays));
    }

    @Transactional(readOnly = true)
    @GetMapping("/archived")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<BorrowingResponseDTO>> getArchivedRecords() {
        return ResponseEntity.ok(borrowingService.getArchivedRecords().stream().map(BorrowingResponseDTO::from).toList());
    }
}
