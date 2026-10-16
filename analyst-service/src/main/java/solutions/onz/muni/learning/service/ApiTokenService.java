package solutions.onz.muni.learning.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import solutions.onz.muni.learning.domain.ApiToken;
import solutions.onz.muni.learning.repository.ApiTokenRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ApiTokenService {

    private final ApiTokenRepository apiTokenRepository;

    public ApiToken recordIssuedToken(String jti, String userId, String description, long ttlSeconds) {
        ApiToken token = new ApiToken();
        token.setId(jti);
        token.setUserId(userId);
        token.setDescription(description);
        token.setIssuedAt(Instant.now());
        token.setExpiresAt(Instant.now().plusSeconds(ttlSeconds));
        token.setRevoked(false);
        return apiTokenRepository.save(token);
    }

    public List<ApiToken> listForUser(String userId) {
        return apiTokenRepository.findByUserId(userId);
    }

    public Optional<ApiToken> revokeForUser(String id, String userId) {
        return apiTokenRepository.findById(id)
                .filter(t -> t.getUserId().equals(userId))
                .map(t -> {
                    t.setRevoked(true);
                    return apiTokenRepository.save(t);
                });
    }

    public void revoke(String jti) {
        apiTokenRepository.findById(jti).ifPresent(t -> {
            t.setRevoked(true);
            apiTokenRepository.save(t);
        });
    }

    public void deleteForUser(List<String> ids, String userId) {
        List<ApiToken> owned = apiTokenRepository.findAllById(ids).stream()
                .filter(t -> t.getUserId().equals(userId))
                .toList();
        apiTokenRepository.deleteAll(owned);
    }
}
