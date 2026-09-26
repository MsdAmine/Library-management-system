package com.example.library.controller;

import com.example.library.dto.FineResponseDTO;
import com.example.library.dto.PayFineRequestDTO;
import com.example.library.dto.WaiveFineRequestDTO;
import com.example.library.exception.GlobalExceptionHandler;
import com.example.library.model.FineStatus;
import com.example.library.model.User;
import com.example.library.service.FineService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class FineControllerTest {

    private MockMvc mockMvc;

    @Mock
    private FineService fineService;

    @InjectMocks
    private FineController fineController;

    private ObjectMapper objectMapper;
    private FineResponseDTO sampleFineDTO;
    private User authenticatedUser;

    @BeforeEach
    void setUp() {
        authenticatedUser = User.builder()
                .id(1L)
                .firstName("Alice")
                .lastName("Smith")
                .email("alice@example.com")
                .build();

        HandlerMethodArgumentResolver authenticationPrincipalResolver = new HandlerMethodArgumentResolver() {
            @Override
            public boolean supportsParameter(MethodParameter parameter) {
                return parameter.hasParameterAnnotation(AuthenticationPrincipal.class);
            }

            @Override
            public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
                                          NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
                return authenticatedUser;
            }
        };

        mockMvc = MockMvcBuilders.standaloneSetup(fineController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(authenticationPrincipalResolver)
                .build();

        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());

        sampleFineDTO = FineResponseDTO.builder()
                .id(100L)
                .borrowingRecordId(50L)
                .bookId(10L)
                .bookTitle("Clean Code")
                .bookAuthor("Robert C. Martin")
                .memberId(1L)
                .memberName("Alice Smith")
                .memberEmail("alice@example.com")
                .amount(new BigDecimal("9.00"))
                .status(FineStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .notes("Overdue return: 6 days late")
                .build();
    }

    @Test
    @DisplayName("GET /api/v1/fines/member/{memberId}: Returns fines for a member")
    void getFinesByMember_ReturnsOk() throws Exception {
        when(fineService.getFinesByMember(1L)).thenReturn(List.of(sampleFineDTO));

        mockMvc.perform(get("/api/v1/fines/member/1")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id", is(100)))
                .andExpect(jsonPath("$[0].bookTitle", is("Clean Code")))
                .andExpect(jsonPath("$[0].status", is("PENDING")))
                .andExpect(jsonPath("$[0].amount", is(9.00)));
    }

    @Test
    @DisplayName("GET /api/v1/fines/my-fines: Returns fines for authenticated user")
    void getMyFines_ReturnsOk() throws Exception {
        when(fineService.getMyFines(1L)).thenReturn(List.of(sampleFineDTO));

        mockMvc.perform(get("/api/v1/fines/my-fines")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id", is(100)))
                .andExpect(jsonPath("$[0].memberName", is("Alice Smith")));
    }

    @Test
    @DisplayName("POST /api/v1/fines/{id}/pay: Processes fine settlement")
    void payFine_ReturnsOk() throws Exception {
        sampleFineDTO.setStatus(FineStatus.PAID);
        sampleFineDTO.setPaymentReference("PAY-12345");
        sampleFineDTO.setSettledAt(LocalDateTime.now());

        when(fineService.payFine(eq(100L), eq("PAY-12345"))).thenReturn(sampleFineDTO);

        PayFineRequestDTO request = new PayFineRequestDTO("PAY-12345");

        mockMvc.perform(post("/api/v1/fines/100/pay")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("PAID")))
                .andExpect(jsonPath("$.paymentReference", is("PAY-12345")));
    }

    @Test
    @DisplayName("POST /api/v1/fines/{id}/waive: Processes fine waiver")
    void waiveFine_ReturnsOk() throws Exception {
        sampleFineDTO.setStatus(FineStatus.WAIVED);
        sampleFineDTO.setNotes("Waived by librarian");
        sampleFineDTO.setSettledAt(LocalDateTime.now());

        when(fineService.waiveFine(eq(100L), eq("Waived by librarian"))).thenReturn(sampleFineDTO);

        WaiveFineRequestDTO request = new WaiveFineRequestDTO("Waived by librarian");

        mockMvc.perform(post("/api/v1/fines/100/waive")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("WAIVED")))
                .andExpect(jsonPath("$.notes", is("Waived by librarian")));
    }
}
