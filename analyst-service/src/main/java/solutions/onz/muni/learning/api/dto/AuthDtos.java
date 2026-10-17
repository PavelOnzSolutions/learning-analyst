package solutions.onz.muni.learning.api.dto;

import lombok.NoArgsConstructor;
import solutions.onz.muni.learning.api.dto.UserDtos.UserResponse;

@NoArgsConstructor
public final class AuthDtos {

    public record LoginRequest(String login, String password) {
    }

    public record LoginResponse(String token, long expiresIn, UserResponse user) {
    }
}
