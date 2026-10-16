package solutions.onz.muni.learning.api;

import com.nimbusds.jose.JOSEException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import solutions.onz.muni.learning.api.dto.AuthDtos.LoginRequest;
import solutions.onz.muni.learning.api.dto.AuthDtos.LoginResponse;
import solutions.onz.muni.learning.api.dto.UserDtos.UserResponse;
import solutions.onz.muni.learning.domain.AppUser;
import solutions.onz.muni.learning.service.ApiTokenService;
import solutions.onz.muni.learning.service.JwtService;
import solutions.onz.muni.learning.service.UserService;

import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final JwtService jwtService;
    private final ApiTokenService apiTokenService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        AppUser user = userService.findByLogin(request.login()).orElse(null);
        if (user == null || !user.isEnabled() || !userService.validatePassword(user, request.password())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }
        return ResponseEntity.ok(issueSessionToken(user, "local-login"));
    }

    @PostMapping("/refresh")
    public ResponseEntity<LoginResponse> refresh(Authentication authentication) {
        AppUser user = userService.findById(authentication.getName())
                .filter(AppUser::isEnabled)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        return ResponseEntity.ok(issueSessionToken(user, "token-refresh"));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@AuthenticationPrincipal Jwt jwt) {
        if (jwt != null) {
            apiTokenService.revoke(jwt.getId());
        }
        return ResponseEntity.ok().build();
    }

    private LoginResponse issueSessionToken(AppUser user, String description) {
        String jti = UUID.randomUUID().toString();
        String token;
        try {
            token = jwtService.signSessionToken(user, jti);
        } catch (JOSEException e) {
            log.error("Token generation failed for user {}", user.getUsername(), e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Token generation failed");
        }
        apiTokenService.recordIssuedToken(jti, user.getId(), description, jwtService.getExpirySeconds());
        return new LoginResponse(token, jwtService.getExpirySeconds(), UserResponse.from(user));
    }
}
