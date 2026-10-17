package solutions.onz.muni.learning.api.dto;

import solutions.onz.muni.learning.domain.ApiToken;

public final class ApiTokenDtos {

    private ApiTokenDtos() {
    }

    public record CreateTokenRequest(String name, Integer expirationDays) {
    }

    public record CreateTokenResponse(String id, String token, String name, String expiresAt) {
    }

    public record ApiTokenResponse(
            String id,
            String userId,
            String description,
            String issuedAt,
            String expiresAt,
            boolean revoked
    ) {
        public static ApiTokenResponse from(ApiToken token) {
            return new ApiTokenResponse(
                    token.getId(),
                    token.getUserId(),
                    token.getDescription(),
                    token.getIssuedAt().toString(),
                    token.getExpiresAt().toString(),
                    token.isRevoked()
            );
        }
    }
}
