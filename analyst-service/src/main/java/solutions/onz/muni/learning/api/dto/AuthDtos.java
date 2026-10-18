package solutions.onz.muni.learning.api.dto;

import jakarta.validation.constraints.NotBlank;
import solutions.onz.muni.learning.api.dto.UserDtos.UserResponse;

public final class AuthDtos {

    private AuthDtos() {
    }

    public record LoginRequest(@NotBlank String login, @NotBlank String password) {
    }

    public record LoginResponse(String token, long expiresIn, UserResponse user) {
    }
}
