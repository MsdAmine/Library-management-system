package com.example.library.controller;

import com.example.library.dto.MemberResponseDTO;
import com.example.library.model.Member;
import com.example.library.service.MemberService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/members")
@RequiredArgsConstructor
public class MemberController {

    private final MemberService memberService;

    @GetMapping
    public ResponseEntity<Page<MemberResponseDTO>> getAllMembers(
            @PageableDefault(size = 10, sort = "lastName") Pageable pageable) {
        return ResponseEntity.ok(memberService.getAllMembers(pageable).map(this::convertToDTO));
    }

    @GetMapping("/{id}")
    public ResponseEntity<MemberResponseDTO> getMemberById(@PathVariable Long id) {
        return memberService.getMemberById(id)
                .map(this::convertToDTO)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<MemberResponseDTO> addMember(@Valid @RequestBody Member member) {
        Member savedMember = memberService.addMember(member);
        return new ResponseEntity<>(convertToDTO(savedMember), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<MemberResponseDTO> updateMember(@PathVariable Long id, @Valid @RequestBody Member member) {
        Member updatedMember = memberService.updateMember(id, member);
        return ResponseEntity.ok(convertToDTO(updatedMember));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteMember(@PathVariable Long id) {
        memberService.deleteMember(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/search")
    public ResponseEntity<Page<MemberResponseDTO>> searchMembers(
            @RequestParam String name,
            @PageableDefault(size = 10, sort = "lastName") Pageable pageable) {
        return ResponseEntity.ok(memberService.searchMembersByName(name, pageable).map(this::convertToDTO));
    }

    private MemberResponseDTO convertToDTO(Member member) {
        MemberResponseDTO dto = new MemberResponseDTO();
        dto.setId(member.getId());
        dto.setFirstName(member.getFirstName());
        dto.setLastName(member.getLastName());
        dto.setEmail(member.getEmail());
        dto.setMembershipDate(member.getMembershipDate());
        return dto;
    }
}
