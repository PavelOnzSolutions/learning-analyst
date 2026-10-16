package solutions.onz.muni.learning.api;

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

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    public Page<UserResponse> list(Pageable pageable) {
        return userService.list(pageable).map(UserResponse::from);
    }

    @PostMapping
    public ResponseEntity<UserResponse> create(@RequestBody CreateUserRequest request) {
        AppUser user = userService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(UserResponse.from(user));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserResponse> update(@PathVariable String id, @RequestBody UpdateUserRequest request) {
        return ResponseEntity.ok(UserResponse.from(userService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> disable(@PathVariable String id) {
        userService.disable(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> me(Authentication authentication) {
        AppUser user = userService.findById(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        return ResponseEntity.ok(UserResponse.from(user));
    }

    @PutMapping("/me")
    public ResponseEntity<UserResponse> updateMe(Authentication authentication, @RequestBody UpdateProfileRequest request) {
        AppUser user = userService.updateProfile(authentication.getName(), request);
        return ResponseEntity.ok(UserResponse.from(user));
    }

    @PutMapping("/me/password")
    public ResponseEntity<Void> changePassword(Authentication authentication, @RequestBody ChangePasswordRequest request) {
        userService.changePassword(authentication.getName(), request);
        return ResponseEntity.ok().build();
    }
}
