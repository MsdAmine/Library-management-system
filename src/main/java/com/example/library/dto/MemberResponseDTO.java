package com.example.library.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class MemberResponseDTO {
    private String firstName;
    private String lastName;
    private String email;
    private LocalDate membershipDate;
    private String fullName;


    public String getFullName() {
        return firstName + " " + lastName;
    }
}