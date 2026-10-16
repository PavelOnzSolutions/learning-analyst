package solutions.onz.muni.learning.api.dto;

import solutions.onz.muni.learning.domain.AppUser;
import solutions.onz.muni.learning.domain.Role;

public final class UserDtos {

    private UserDtos() {
    }

    public record CreateUserRequest(String email, String username, String displayName, String password, Role role) {
    }

    public record UpdateUserRequest(Role role, Boolean enabled) {
    }

    public record UpdateProfileRequest(String displayName, String avatarUrl) {
    }

    public record ChangePasswordRequest(String currentPassword, String newPassword) {
    }

    public record UserResponse(
            String id,
            String email,
            String username,
            String displayName,
            String avatarUrl,
            String role,
            boolean enabled,
            String createdAt
    ) {
        public static UserResponse from(AppUser user) {
            return new UserResponse(
                    user.getId(),
                    user.getEmail(),
                    user.getUsername(),
                    user.getDisplayName(),
                    user.getAvatarUrl(),
                    user.getRole().name(),
                    user.isEnabled(),
                    user.getCreatedAt().toString()
            );
        }
    }
}
