package com.example.library.controller;

import com.example.library.dto.FineResponseDTO;
import com.example.library.dto.PayFineRequestDTO;
import com.example.library.dto.WaiveFineRequestDTO;
import com.example.library.model.User;
import com.example.library.service.FineService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/fines")
@RequiredArgsConstructor
public class FineController {

    private final FineService fineService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
    public ResponseEntity<List<FineResponseDTO>> getAllFines() {
        return ResponseEntity.ok(fineService.getAllFines());
    }

    @GetMapping("/member/{memberId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN') or (authentication.principal != null and authentication.principal.id == #memberId)")
    public ResponseEntity<List<FineResponseDTO>> getFinesByMember(@PathVariable Long memberId) {
        return ResponseEntity.ok(fineService.getFinesByMember(memberId));
    }

    @GetMapping("/my-fines")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<FineResponseDTO>> getMyFines(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(fineService.getMyFines(currentUser.getId()));
    }

    @PostMapping("/{id}/pay")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<FineResponseDTO> payFine(
            @PathVariable Long id,
            @RequestBody(required = false) PayFineRequestDTO request,
            @RequestParam(required = false) String paymentReference
    ) {
        String reference = null;
        if (request != null && request.getPaymentReference() != null && !request.getPaymentReference().isBlank()) {
            reference = request.getPaymentReference();
        } else if (paymentReference != null && !paymentReference.isBlank()) {
            reference = paymentReference;
        }

        FineResponseDTO response = fineService.payFine(id, reference);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/waive")
    @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
    public ResponseEntity<FineResponseDTO> waiveFine(
            @PathVariable Long id,
            @RequestBody(required = false) WaiveFineRequestDTO request,
            @RequestParam(required = false) String notes
    ) {
        String waiverNotes = null;
        if (request != null && request.getNotes() != null && !request.getNotes().isBlank()) {
            waiverNotes = request.getNotes();
        } else if (notes != null && !notes.isBlank()) {
            waiverNotes = notes;
        }

        FineResponseDTO response = fineService.waiveFine(id, waiverNotes);
        return ResponseEntity.ok(response);
    }
}
