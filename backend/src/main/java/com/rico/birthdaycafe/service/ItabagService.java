package com.rico.birthdaycafe.service;

import com.rico.birthdaycafe.entity.Itabag;
import com.rico.birthdaycafe.entity.User;
import com.rico.birthdaycafe.repository.ItabagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ItabagService {

    private final ItabagRepository itabagRepository;

    @Transactional(readOnly = true)
    public String getLayoutData(User user) {
        Optional<Itabag> itabagOpt = itabagRepository.findByUser(user);
        return itabagOpt.map(Itabag::getLayoutData).orElse(null);
    }

    @Transactional
    public void saveLayoutData(User user, String layoutData) {
        Itabag itabag = itabagRepository.findByUser(user)
                .orElse(Itabag.builder().user(user).build());
        
        itabag.setLayoutData(layoutData);
        itabagRepository.save(itabag);
    }
}
