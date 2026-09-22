package com.example.library.dto;

import com.example.library.model.ReservationStatus;
import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReservationResponseDTO {
    private Long id;
    private Long bookId;
    private String bookTitle;
    private String bookAuthor;
    private String bookIsbn;
    private Integer bookAvailableCopies;
    private Long memberId;
    private String memberName;
    private String memberEmail;
    private LocalDateTime reservationDate;
    private ReservationStatus status;
    private Integer queuePosition;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
