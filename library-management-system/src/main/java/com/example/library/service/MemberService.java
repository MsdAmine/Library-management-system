package com.example.library.service;

import com.example.library.exception.ResourceAlreadyExistsException;
import com.example.library.model.Member;
import com.example.library.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class MemberService {

    private final MemberRepository memberRepository;

    public Page<Member> getAllMembers(Pageable pageable) {
        return memberRepository.findAll(pageable);
    }

    public Optional<Member> getMemberById(Long id) {
        return memberRepository.findById(id);
    }

    public Optional<Member> getMemberByEmail(String email) {
        return memberRepository.findByEmail(email);
    }

    public Page<Member> searchMembersByName(String name, Pageable pageable) {
        return memberRepository.findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(name, name, pageable);
    }

    public Member addMember(Member member) {
        if (memberRepository.findByEmail(member.getEmail()).isPresent()) {
            throw new ResourceAlreadyExistsException("A member with email " + member.getEmail() + " already exists.");
        }
        return memberRepository.save(member);
    }

    public void deleteMember(Long id) {
        memberRepository.deleteById(id);
    }

    public Member updateMember(Long id, Member memberDetails) {
        return memberRepository.findById(id)
                .map(member -> {
                    member.setFirstName(memberDetails.getFirstName());
                    member.setLastName(memberDetails.getLastName());
                    member.setEmail(memberDetails.getEmail());
                    return memberRepository.save(member);
                }).orElseThrow(() -> new RuntimeException("Member not found with id " + id));
    }
}
