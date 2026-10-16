package solutions.onz.muni.learning.api.dto;

import solutions.onz.muni.learning.api.dto.UserDtos.UserResponse;

public final class AuthDtos {

    private AuthDtos() {
    }

    public record LoginRequest(String login, String password) {
    }

    public record LoginResponse(String token, long expiresIn, UserResponse user) {
    }
}
