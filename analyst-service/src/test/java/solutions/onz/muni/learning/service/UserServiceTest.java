package solutions.onz.muni.learning.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.server.ResponseStatusException;
import solutions.onz.muni.learning.api.dto.UserDtos.ChangePasswordRequest;
import solutions.onz.muni.learning.api.dto.UserDtos.CreateUserRequest;
import solutions.onz.muni.learning.api.dto.UserDtos.UpdateUserRequest;
import solutions.onz.muni.learning.domain.AppUser;
import solutions.onz.muni.learning.domain.Role;
import solutions.onz.muni.learning.repository.AppUserRepository;

import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

class UserServiceTest {

    private final AppUserRepository repository = Mockito.mock(AppUserRepository.class);
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    private final UserService service = new UserService(repository, passwordEncoder);

    private AppUser existingUser() {
        AppUser user = new AppUser();
        user.setId("u1");
        user.setEmail("jane@local.test");
        user.setUsername("jane");
        user.setPasswordHash(passwordEncoder.encode("correct-password"));
        user.setRole(Role.USER);
        user.setEnabled(true);
        user.setCreatedAt(Instant.now());
        return user;
    }

    @BeforeEach
    void setUp() {
        when(repository.save(any(AppUser.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void validatePasswordAcceptsCorrectPassword() {
        assertThat(service.validatePassword(existingUser(), "correct-password")).isTrue();
    }

    @Test
    void validatePasswordRejectsWrongPassword() {
        assertThat(service.validatePassword(existingUser(), "wrong-password")).isFalse();
    }

    @Test
    void createRejectsDuplicateEmail() {
        when(repository.findByEmailIgnoreCase("jane@local.test")).thenReturn(Optional.of(existingUser()));

        CreateUserRequest request = new CreateUserRequest("jane@local.test", "other", null, "password123", Role.USER);

        assertThatThrownBy(() -> service.create(request)).isInstanceOf(ResponseStatusException.class);
    }

    @Test
    void changePasswordRejectsWrongCurrentPassword() {
        when(repository.findById("u1")).thenReturn(Optional.of(existingUser()));

        ChangePasswordRequest request = new ChangePasswordRequest("not-the-current-password", "newpassword123");

        assertThatThrownBy(() -> service.changePassword("u1", request)).isInstanceOf(ResponseStatusException.class);
    }

    @Test
    void updateAppliesRoleAndEnabledChanges() {
        AppUser user = existingUser();
        when(repository.findById("u1")).thenReturn(Optional.of(user));

        AppUser updated = service.update("u1", new UpdateUserRequest(Role.ADMIN, false));

        assertThat(updated.getRole()).isEqualTo(Role.ADMIN);
        assertThat(updated.isEnabled()).isFalse();
    }
}
