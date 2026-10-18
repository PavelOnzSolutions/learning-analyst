package solutions.onz.muni.learning.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.server.ResponseStatusException;
import solutions.onz.muni.learning.api.dto.UserDtos.ChangePasswordRequest;
import solutions.onz.muni.learning.api.dto.UserDtos.CreateUserRequest;
import solutions.onz.muni.learning.api.dto.UserDtos.UpdateProfileRequest;
import solutions.onz.muni.learning.api.dto.UserDtos.UpdateUserRequest;
import solutions.onz.muni.learning.domain.AppUser;
import solutions.onz.muni.learning.domain.Role;
import solutions.onz.muni.learning.repository.AppUserRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

class UserServiceTest {

    private final AppUserRepository repository = Mockito.mock(AppUserRepository.class);
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    private final ApiTokenService apiTokenService = Mockito.mock(ApiTokenService.class);
    private final UserService service = new UserService(repository, passwordEncoder, apiTokenService);

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

    @Test
    void findByLoginFindsUserByEmail() {
        AppUser user = existingUser();
        when(repository.findByEmailIgnoreCase("jane@local.test")).thenReturn(Optional.of(user));

        Optional<AppUser> found = service.findByLogin("jane@local.test");

        assertThat(found).isPresent().contains(user);
    }

    @Test
    void findByLoginFallsBackToUsernameWhenEmailNotFound() {
        AppUser user = existingUser();
        when(repository.findByEmailIgnoreCase("jane")).thenReturn(Optional.empty());
        when(repository.findByUsernameIgnoreCase("jane")).thenReturn(Optional.of(user));

        Optional<AppUser> found = service.findByLogin("jane");

        assertThat(found).isPresent().contains(user);
    }

    @Test
    void listDelegatestoRepositoryFindAll() {
        AppUser user1 = existingUser();
        AppUser user2 = new AppUser();
        user2.setId("u2");
        user2.setEmail("bob@local.test");
        user2.setUsername("bob");
        user2.setPasswordHash(passwordEncoder.encode("password123"));
        user2.setRole(Role.ADMIN);
        user2.setEnabled(true);
        user2.setCreatedAt(Instant.now());

        Page<AppUser> page = new PageImpl<>(List.of(user1, user2));
        Pageable pageable = Mockito.mock(Pageable.class);
        when(repository.findAll(pageable)).thenReturn(page);

        Page<AppUser> result = service.list(pageable);

        assertThat(result.getContent()).hasSize(2).contains(user1, user2);
    }

    @Test
    void disableSetsEnabledToFalse() {
        AppUser user = existingUser();
        when(repository.findById("u1")).thenReturn(Optional.of(user));

        service.disable("u1");

        assertThat(user.isEnabled()).isFalse();
    }

    @Test
    void updateProfileUpdatesDisplayNameWhenProvided() {
        AppUser user = existingUser();
        when(repository.findById("u1")).thenReturn(Optional.of(user));

        AppUser updated = service.updateProfile("u1", new UpdateProfileRequest("Jane Doe", null));

        assertThat(updated.getDisplayName()).isEqualTo("Jane Doe");
    }

    @Test
    void updateProfileUpdatesAvatarUrlWhenProvided() {
        AppUser user = existingUser();
        when(repository.findById("u1")).thenReturn(Optional.of(user));

        AppUser updated = service.updateProfile("u1", new UpdateProfileRequest(null, "https://example.com/avatar.jpg"));

        assertThat(updated.getAvatarUrl()).isEqualTo("https://example.com/avatar.jpg");
    }

    @Test
    void createHappyPathSavesUserWithHashedPasswordAndEnabled() {
        when(repository.findByEmailIgnoreCase("new@local.test")).thenReturn(Optional.empty());
        when(repository.findByUsernameIgnoreCase("newuser")).thenReturn(Optional.empty());

        CreateUserRequest request = new CreateUserRequest("new@local.test", "newuser", "New User", "mypassword123", Role.USER);
        AppUser created = service.create(request);

        assertThat(created.getEmail()).isEqualTo("new@local.test");
        assertThat(created.getUsername()).isEqualTo("newuser");
        assertThat(created.getDisplayName()).isEqualTo("New User");
        assertThat(created.getRole()).isEqualTo(Role.USER);
        assertThat(created.isEnabled()).isTrue();
        assertThat(created.getPasswordHash()).isNotEqualTo("mypassword123");
        assertThat(passwordEncoder.matches("mypassword123", created.getPasswordHash())).isTrue();
        assertThat(created.getCreatedAt()).isNotNull();
    }

    @Test
    void changePasswordHappyPathRe_encodesAndSavesNewPassword() {
        AppUser user = existingUser();
        when(repository.findById("u1")).thenReturn(Optional.of(user));

        service.changePassword("u1", new ChangePasswordRequest("correct-password", "newpassword456"));

        assertThat(user.getPasswordHash()).isNotEqualTo(passwordEncoder.encode("correct-password"));
        assertThat(passwordEncoder.matches("newpassword456", user.getPasswordHash())).isTrue();
    }

    @Test
    void disableRevokesAllTokensForTheUser() {
        AppUser user = existingUser();
        when(repository.findById("u1")).thenReturn(Optional.of(user));

        service.disable("u1");

        Mockito.verify(apiTokenService).revokeAllForUser("u1");
    }

    @Test
    void updateWithRoleChangeRevokesTokens() {
        AppUser user = existingUser();
        user.setRole(Role.USER);
        when(repository.findById("u1")).thenReturn(Optional.of(user));

        service.update("u1", new UpdateUserRequest(Role.ADMIN, null));

        Mockito.verify(apiTokenService).revokeAllForUser("u1");
    }

    @Test
    void updateWithSameRoleDoesNotRevokeTokens() {
        AppUser user = existingUser();
        user.setRole(Role.USER);
        when(repository.findById("u1")).thenReturn(Optional.of(user));

        service.update("u1", new UpdateUserRequest(Role.USER, null));

        Mockito.verify(apiTokenService, Mockito.never()).revokeAllForUser(any());
    }

    @Test
    void updateWithOnlyEnabledChangeDoesNotRevokeTokens() {
        AppUser user = existingUser();
        when(repository.findById("u1")).thenReturn(Optional.of(user));

        service.update("u1", new UpdateUserRequest(null, false));

        Mockito.verify(apiTokenService, Mockito.never()).revokeAllForUser(any());
    }
}
