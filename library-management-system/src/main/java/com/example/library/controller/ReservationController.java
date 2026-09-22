package com.example.library.controller;

import com.example.library.dto.ReservationResponseDTO;
import com.example.library.model.Role;
import com.example.library.model.User;
import com.example.library.service.ReservationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/reservations")
@RequiredArgsConstructor
public class ReservationController {

    private final ReservationService reservationService;

    @PostMapping("/hold")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ReservationResponseDTO> placeHold(
            @RequestParam Long bookId,
            @RequestParam(required = false) Long memberId,
            @AuthenticationPrincipal User currentUser
    ) {
        Long targetMemberId;
        boolean isStaff = currentUser.getRole() == Role.ADMIN || currentUser.getRole() == Role.LIBRARIAN;

        if (memberId != null && isStaff) {
            targetMemberId = memberId;
        } else {
            targetMemberId = currentUser.getId();
        }

        ReservationResponseDTO dto = reservationService.placeHold(targetMemberId, bookId);
        return new ResponseEntity<>(dto, HttpStatus.CREATED);
    }

    @GetMapping("/my-holds")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<ReservationResponseDTO>> getMyHolds(@AuthenticationPrincipal User currentUser) {
        List<ReservationResponseDTO> holds = reservationService.getMyHolds(currentUser.getId());
        return ResponseEntity.ok(holds);
    }

    @GetMapping("/book/{bookId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
    public ResponseEntity<List<ReservationResponseDTO>> getBookHoldQueue(@PathVariable Long bookId) {
        List<ReservationResponseDTO> queue = reservationService.getBookHoldQueue(bookId);
        return ResponseEntity.ok(queue);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ReservationResponseDTO> cancelHold(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser
    ) {
        boolean isStaff = currentUser.getRole() == Role.ADMIN || currentUser.getRole() == Role.LIBRARIAN;
        ReservationResponseDTO cancelled = reservationService.cancelHold(id, currentUser.getId(), isStaff);
        return ResponseEntity.ok(cancelled);
    }

    @PostMapping("/{id}/fulfill")
    @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
    public ResponseEntity<ReservationResponseDTO> fulfillHold(@PathVariable Long id) {
        ReservationResponseDTO fulfilled = reservationService.fulfillReservation(id);
        return ResponseEntity.ok(fulfilled);
    }

    @PostMapping("/book/{bookId}/fulfill-next")
    @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
    public ResponseEntity<ReservationResponseDTO> fulfillNextHold(@PathVariable Long bookId) {
        return reservationService.fulfillNextPendingHold(bookId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }
}
