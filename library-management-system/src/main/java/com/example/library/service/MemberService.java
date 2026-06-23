package com.example.library.service;

import com.example.library.exception.ResourceAlreadyExistsException;
import com.example.library.model.Member;
import com.example.library.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class MemberService {

    private final MemberRepository memberRepository;

    public Page<Member> getAllMembers(Pageable pageable) {
        return memberRepository.findAllActive(pageable);
    }

    public Optional<Member> getMemberById(Long id) {
        return memberRepository.findActiveById(id);
    }

    public Optional<Member> getMemberByEmail(String email) {
        return memberRepository.findByEmail(email);
    }

    public Page<Member> searchMembersByName(String name, Pageable pageable) {
        return memberRepository.findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(name, name, pageable);
    }

    @Transactional
    public Member addMember(Member member) {
        Optional<Member> existingMemberOpt = memberRepository.findAnyByEmail(member.getEmail());
        
        if (existingMemberOpt.isPresent()) {
            Member existingMember = existingMemberOpt.get();
            if (existingMember.isActive()) {
                throw new ResourceAlreadyExistsException("A member with email " + member.getEmail() + " already exists.");
            } else {
                existingMember.setFirstName(member.getFirstName());
                existingMember.setLastName(member.getLastName());
                existingMember.setMembershipDate(member.getMembershipDate());
                existingMember.setActive(true);
                return memberRepository.save(existingMember);
            }
        }
        return memberRepository.save(member);
    }

    @Transactional
    public void deleteMember(Long id) {
        memberRepository.findActiveById(id).ifPresent(member -> {
            member.setActive(false);
            memberRepository.save(member);
        });
    }

    @Transactional
    public Member updateMember(Long id, Member memberDetails) {
        return memberRepository.findActiveById(id)
                .map(member -> {
                    member.setFirstName(memberDetails.getFirstName());
                    member.setLastName(memberDetails.getLastName());
                    member.setEmail(memberDetails.getEmail());
                    member.setMembershipDate(memberDetails.getMembershipDate());
                    return memberRepository.save(member);
                }).orElseThrow(() -> new RuntimeException("Member not found with id " + id));
    }
}