package solutions.onz.muni.learning.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import solutions.onz.muni.learning.api.dto.UserDtos.ChangePasswordRequest;
import solutions.onz.muni.learning.api.dto.UserDtos.CreateUserRequest;
import solutions.onz.muni.learning.api.dto.UserDtos.UpdateProfileRequest;
import solutions.onz.muni.learning.api.dto.UserDtos.UpdateUserRequest;
import solutions.onz.muni.learning.domain.AppUser;
import solutions.onz.muni.learning.repository.AppUserRepository;

import java.time.Instant;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final AppUserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final ApiTokenService apiTokenService;

    public Optional<AppUser> findByLogin(String login) {
        return userRepository.findByEmailIgnoreCase(login)
                .or(() -> userRepository.findByUsernameIgnoreCase(login));
    }

    public Optional<AppUser> findById(String id) {
        return userRepository.findById(id);
    }

    public boolean validatePassword(AppUser user, String rawPassword) {
        return passwordEncoder.matches(rawPassword, user.getPasswordHash());
    }

    public Page<AppUser> list(Pageable pageable) {
        return userRepository.findAll(pageable);
    }

    public AppUser create(CreateUserRequest request) {
        if (userRepository.findByEmailIgnoreCase(request.email()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already in use");
        }
        if (userRepository.findByUsernameIgnoreCase(request.username()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already in use");
        }
        AppUser user = new AppUser();
        user.setEmail(request.email());
        user.setUsername(request.username());
        user.setDisplayName(request.displayName());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(request.role());
        user.setEnabled(true);
        user.setCreatedAt(Instant.now());
        return userRepository.save(user);
    }

    public AppUser update(String id, UpdateUserRequest request) {
        AppUser user = requireById(id);
        boolean roleChanged = request.role() != null && request.role() != user.getRole();
        if (request.role() != null) {
            user.setRole(request.role());
        }
        if (request.enabled() != null) {
            user.setEnabled(request.enabled());
        }
        AppUser saved = userRepository.save(user);
        if (roleChanged) {
            apiTokenService.revokeAllForUser(id);
        }
        return saved;
    }

    public void disable(String id) {
        AppUser user = requireById(id);
        user.setEnabled(false);
        userRepository.save(user);
        apiTokenService.revokeAllForUser(id);
    }

    public AppUser updateProfile(String id, UpdateProfileRequest request) {
        AppUser user = requireById(id);
        if (request.displayName() != null) {
            user.setDisplayName(request.displayName());
        }
        if (request.avatarUrl() != null) {
            user.setAvatarUrl(request.avatarUrl());
        }
        return userRepository.save(user);
    }

    public void changePassword(String id, ChangePasswordRequest request) {
        AppUser user = requireById(id);
        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Current password is incorrect");
        }
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
    }

    private AppUser requireById(String id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }
}
