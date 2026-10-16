package solutions.onz.muni.learning.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import solutions.onz.muni.learning.domain.ApiToken;
import solutions.onz.muni.learning.repository.ApiTokenRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

class ApiTokenServiceTest {

    private final ApiTokenRepository repository = Mockito.mock(ApiTokenRepository.class);
    private final ApiTokenService service = new ApiTokenService(repository);

    @BeforeEach
    void setUp() {
        when(repository.save(any(ApiToken.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    private ApiToken token(String id, String userId, boolean revoked) {
        ApiToken token = new ApiToken();
        token.setId(id);
        token.setUserId(userId);
        token.setDescription("CI token");
        token.setIssuedAt(Instant.now());
        token.setExpiresAt(Instant.now().plusSeconds(3600));
        token.setRevoked(revoked);
        return token;
    }

    @Test
    void recordIssuedTokenSavesWithComputedExpiry() {
        ApiToken saved = service.recordIssuedToken("jti-1", "u1", "local-login", 1800);

        assertThat(saved.getId()).isEqualTo("jti-1");
        assertThat(saved.getUserId()).isEqualTo("u1");
        assertThat(saved.getDescription()).isEqualTo("local-login");
        assertThat(saved.isRevoked()).isFalse();
    }

    @Test
    void revokeForUserOnlyAffectsOwningUser() {
        when(repository.findById("jti-2")).thenReturn(Optional.of(token("jti-2", "u1", false)));

        Optional<ApiToken> revokedByOwner = service.revokeForUser("jti-2", "u1");
        assertThat(revokedByOwner).isPresent();
        assertThat(revokedByOwner.get().isRevoked()).isTrue();

        when(repository.findById("jti-3")).thenReturn(Optional.of(token("jti-3", "u1", false)));
        Optional<ApiToken> revokedByOther = service.revokeForUser("jti-3", "someone-else");
        assertThat(revokedByOther).isEmpty();
    }

    @Test
    void deleteForUserOnlyDeletesOwnedTokens() {
        when(repository.findAllById(List.of("jti-4", "jti-5"))).thenReturn(
                List.of(token("jti-4", "u1", false), token("jti-5", "someone-else", false)));

        service.deleteForUser(List.of("jti-4", "jti-5"), "u1");

        @SuppressWarnings("unchecked")
        org.mockito.ArgumentCaptor<List<ApiToken>> captor = org.mockito.ArgumentCaptor.forClass(List.class);
        Mockito.verify(repository).deleteAll(captor.capture());
        assertThat(captor.getValue()).hasSize(1);
        assertThat(captor.getValue().get(0).getId()).isEqualTo("jti-4");
    }
}
