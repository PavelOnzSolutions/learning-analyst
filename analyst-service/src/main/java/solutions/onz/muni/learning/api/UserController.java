package solutions.onz.muni.learning.api;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import solutions.onz.muni.learning.api.dto.UserDtos.*;
import solutions.onz.muni.learning.domain.AppUser;
import solutions.onz.muni.learning.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/v1/users")
@Tag(name = "Users", description = "Admin user management and self-service profile endpoints")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @Operation(summary = "List users", description = "Admin-only paginated list of all user accounts")
    @ApiResponse(responseCode = "200", description = "Users returned")
    @GetMapping
    public Page<UserResponse> list(Pageable pageable) {
        return userService.list(pageable).map(UserResponse::from);
    }

    @Operation(summary = "Get user by id", description = "Admin-only lookup of a single user account")
    @ApiResponse(responseCode = "200", description = "User found")
    @ApiResponse(responseCode = "404", description = "User not found")
    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> get(@PathVariable String id) {
        AppUser user = userService.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        return ResponseEntity.ok(UserResponse.from(user));
    }

    @Operation(summary = "Create user", description = "Admin-only creation of a new local user account")
    @ApiResponse(responseCode = "201", description = "User created")
    @ApiResponse(responseCode = "400", description = "Validation failed")
    @PostMapping
    public ResponseEntity<UserResponse> create(@Valid @RequestBody CreateUserRequest request) {
        AppUser user = userService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(UserResponse.from(user));
    }

    @Operation(summary = "Update user", description = "Admin-only update of a user's role and/or enabled status")
    @ApiResponse(responseCode = "200", description = "User updated")
    @PutMapping("/{id}")
    public ResponseEntity<UserResponse> update(@PathVariable String id, @RequestBody UpdateUserRequest request) {
        return ResponseEntity.ok(UserResponse.from(userService.update(id, request)));
    }

    @Operation(summary = "Disable user", description = "Admin-only soft-disable of a user account")
    @ApiResponse(responseCode = "204", description = "User disabled")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> disable(@PathVariable String id) {
        userService.disable(id);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Get my profile", description = "Returns the authenticated user's own profile")
    @ApiResponse(responseCode = "200", description = "Profile returned")
    @ApiResponse(responseCode = "401", description = "Not authenticated")
    @GetMapping("/me")
    public ResponseEntity<UserResponse> me(Authentication authentication) {
        AppUser user = userService.findById(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        return ResponseEntity.ok(UserResponse.from(user));
    }

    @Operation(summary = "Update my profile", description = "Updates the authenticated user's own display name and/or avatar URL")
    @ApiResponse(responseCode = "200", description = "Profile updated")
    @PutMapping("/me")
    public ResponseEntity<UserResponse> updateMe(Authentication authentication, @RequestBody UpdateProfileRequest request) {
        AppUser user = userService.updateProfile(authentication.getName(), request);
        return ResponseEntity.ok(UserResponse.from(user));
    }

    @Operation(summary = "Change my password", description = "Changes the authenticated user's own password, given the current password")
    @ApiResponse(responseCode = "200", description = "Password changed")
    @ApiResponse(responseCode = "400", description = "Current password incorrect or new password invalid")
    @PutMapping("/me/password")
    public ResponseEntity<Void> changePassword(Authentication authentication, @Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(authentication.getName(), request);
        return ResponseEntity.ok().build();
    }
}
