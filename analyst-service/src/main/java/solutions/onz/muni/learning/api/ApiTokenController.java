package solutions.onz.muni.learning.api;

import com.nimbusds.jose.JOSEException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import solutions.onz.muni.learning.api.dto.ApiTokenDtos.*;
import solutions.onz.muni.learning.domain.AppUser;
import solutions.onz.muni.learning.service.ApiTokenService;
import solutions.onz.muni.learning.service.JwtService;
import solutions.onz.muni.learning.service.UserService;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/tokens")
@RequiredArgsConstructor
public class ApiTokenController {

    private static final long DEFAULT_EXPIRATION_DAYS = 30;
    private static final long SECONDS_PER_DAY = 86_400L;

    private final ApiTokenService apiTokenService;
    private final JwtService jwtService;
    private final UserService userService;

    @GetMapping
    public List<ApiTokenResponse> list(Authentication authentication) {
        return apiTokenService.listForUser(authentication.getName()).stream()
                .map(ApiTokenResponse::from)
                .toList();
    }

    @PostMapping
    public ResponseEntity<CreateTokenResponse> create(Authentication authentication, @RequestBody CreateTokenRequest request) {
        AppUser user = userService.findById(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        long expirationDays = request.expirationDays() != null ? request.expirationDays() : DEFAULT_EXPIRATION_DAYS;
        long ttlSeconds = expirationDays * SECONDS_PER_DAY;
        String jti = UUID.randomUUID().toString();
        String token;
        try {
            token = jwtService.signApiToken(user, ttlSeconds, jti);
        } catch (JOSEException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Token generation failed");
        }
        var saved = apiTokenService.recordIssuedToken(jti, user.getId(), request.name(), ttlSeconds);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new CreateTokenResponse(saved.getId(), token, request.name(), saved.getExpiresAt().toString()));
    }

    @PostMapping("/{id}/revoke")
    public ResponseEntity<ApiTokenResponse> revoke(Authentication authentication, @PathVariable String id) {
        var token = apiTokenService.revokeForUser(id, authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        return ResponseEntity.ok(ApiTokenResponse.from(token));
    }

    @DeleteMapping
    public ResponseEntity<Void> delete(Authentication authentication, @RequestParam("id") List<String> ids) {
        apiTokenService.deleteForUser(ids, authentication.getName());
        return ResponseEntity.noContent().build();
    }
}
