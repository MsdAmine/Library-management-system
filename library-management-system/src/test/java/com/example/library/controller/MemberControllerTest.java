package com.example.library.controller;

import com.example.library.dto.MemberRequestDTO;
import com.example.library.exception.GlobalExceptionHandler;
import com.example.library.model.Role;
import com.example.library.model.User;
import com.example.library.service.MemberService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class MemberControllerTest {

    private MockMvc mockMvc;

    @Mock
    private MemberService memberService;

    @InjectMocks
    private MemberController memberController;

    private ObjectMapper objectMapper;
    private User sampleUser;
    private MemberRequestDTO validRequest;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(memberController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(new PageableHandlerMethodArgumentResolver())
                .build();

        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());

        sampleUser = User.builder()
                .id(1L)
                .firstName("John")
                .lastName("Doe")
                .email("john.doe@example.com")
                .membershipDate(LocalDate.of(2026, 1, 10))
                .role(Role.USER)
                .active(true)
                .build();

        validRequest = new MemberRequestDTO();
        validRequest.setFirstName("John");
        validRequest.setLastName("Doe");
        validRequest.setEmail("john.doe@example.com");
        validRequest.setMembershipDate(LocalDate.of(2026, 1, 10));
    }

    @Test
    @DisplayName("GET /api/v1/members: Returns paginated members")
    void getAllMembers_ReturnsOk() throws Exception {
        Page<User> userPage = new PageImpl<>(List.of(sampleUser), PageRequest.of(0, 10), 1);
        when(memberService.getAllMembers(any())).thenReturn(userPage);

        mockMvc.perform(get("/api/v1/members")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].firstName", is("John")))
                .andExpect(jsonPath("$.content[0].email", is("john.doe@example.com")));
    }

    @Test
    @DisplayName("POST /api/v1/members: Creates member when valid payload is passed")
    void addMember_Valid_Returns201() throws Exception {
        when(memberService.addMember(any(MemberRequestDTO.class))).thenReturn(sampleUser);

        mockMvc.perform(post("/api/v1/members")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", is(1)))
                .andExpect(jsonPath("$.firstName", is("John")));
    }

    @Test
    @DisplayName("POST /api/v1/members: Returns 400 Bad Request with field errors when invalid payload is passed")
    void addMember_Invalid_Returns400() throws Exception {
        MemberRequestDTO invalid = new MemberRequestDTO();
        invalid.setFirstName("");
        invalid.setLastName("");
        invalid.setEmail("not-an-email");

        mockMvc.perform(post("/api/v1/members")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalid)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.validationErrors.firstName", is("First name is required")))
                .andExpect(jsonPath("$.validationErrors.lastName", is("Last name is required")));

        verify(memberService, never()).addMember(any(MemberRequestDTO.class));
    }

    @Test
    @DisplayName("DELETE /api/v1/members/{id}: Deletes member and returns 204")
    void deleteMember_Returns204() throws Exception {
        doNothing().when(memberService).deleteMember(1L);

        mockMvc.perform(delete("/api/v1/members/1"))
                .andExpect(status().isNoContent());

        verify(memberService).deleteMember(1L);
    }
}
