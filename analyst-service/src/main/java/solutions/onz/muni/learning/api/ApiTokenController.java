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
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/tokens")
@Tag(name = "API Tokens", description = "Create, list, revoke, and delete personal API tokens")
@RequiredArgsConstructor
public class ApiTokenController {

    private static final long DEFAULT_EXPIRATION_DAYS = 30;
    private static final long SECONDS_PER_DAY = 86_400L;

    private final ApiTokenService apiTokenService;
    private final JwtService jwtService;
    private final UserService userService;

    @Operation(summary = "List my tokens", description = "Lists all tokens (session and API) belonging to the authenticated user")
    @ApiResponse(responseCode = "200", description = "Tokens returned")
    @GetMapping
    public List<ApiTokenResponse> list(Authentication authentication) {
        return apiTokenService.listForUser(authentication.getName()).stream()
                .map(ApiTokenResponse::from)
                .toList();
    }

    @Operation(summary = "Create API token", description = "Issues a new long-lived API token for the authenticated user; the raw token value is returned only in this response")
    @ApiResponse(responseCode = "201", description = "Token created")
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

    @Operation(summary = "Revoke token", description = "Revokes one of the authenticated user's own tokens by id")
    @ApiResponse(responseCode = "200", description = "Token revoked")
    @ApiResponse(responseCode = "404", description = "Token not found or not owned by the caller")
    @PostMapping("/{id}/revoke")
    public ResponseEntity<ApiTokenResponse> revoke(Authentication authentication, @PathVariable String id) {
        var token = apiTokenService.revokeForUser(id, authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        return ResponseEntity.ok(ApiTokenResponse.from(token));
    }

    @Operation(summary = "Delete tokens", description = "Deletes one or more of the authenticated user's own tokens by id")
    @ApiResponse(responseCode = "204", description = "Tokens deleted")
    @DeleteMapping
    public ResponseEntity<Void> delete(Authentication authentication, @RequestParam("id") List<String> ids) {
        apiTokenService.deleteForUser(ids, authentication.getName());
        return ResponseEntity.noContent().build();
    }
}
