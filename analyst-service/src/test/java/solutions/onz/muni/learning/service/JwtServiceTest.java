package solutions.onz.muni.learning.service;

import com.nimbusds.jwt.SignedJWT;
import org.junit.jupiter.api.Test;
import solutions.onz.muni.learning.config.ApplicationProperties;
import solutions.onz.muni.learning.domain.AppUser;
import solutions.onz.muni.learning.domain.Role;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;

class JwtServiceTest {

    private final ApplicationProperties applicationProperties = new ApplicationProperties();
    private final JwtService jwtService = new JwtService(applicationProperties);

    private AppUser sampleUser() {
        AppUser user = new AppUser();
        user.setId("u1");
        user.setEmail("admin@local.test");
        user.setUsername("admin");
        user.setRole(Role.ADMIN);
        user.setCreatedAt(Instant.now());
        return user;
    }

    @Test
    void signSessionTokenEncodesExpectedClaims() throws Exception {
        String token = jwtService.signSessionToken(sampleUser(), "jti-1");

        SignedJWT parsed = SignedJWT.parse(token);
        assertThat(parsed.getJWTClaimsSet().getSubject()).isEqualTo("u1");
        assertThat(parsed.getJWTClaimsSet().getIssuer()).isEqualTo("learning-analyst");
        assertThat(parsed.getJWTClaimsSet().getJWTID()).isEqualTo("jti-1");
        assertThat(parsed.getJWTClaimsSet().getClaim("role")).isEqualTo("ADMIN");
        assertThat(parsed.getJWTClaimsSet().getClaim("email")).isEqualTo("admin@local.test");
        assertThat(parsed.verify(new com.nimbusds.jose.crypto.RSASSAVerifier(jwtService.getRsaPublicKey()))).isTrue();
    }

    @Test
    void signApiTokenUsesCustomTtl() throws Exception {
        String token = jwtService.signApiToken(sampleUser(), 60, "jti-2");

        SignedJWT parsed = SignedJWT.parse(token);
        long ttlSeconds = (parsed.getJWTClaimsSet().getExpirationTime().getTime()
                - parsed.getJWTClaimsSet().getIssueTime().getTime()) / 1000;
        assertThat(ttlSeconds).isEqualTo(60L);
    }

    @Test
    void getExpirySecondsReturnsConfiguredValue() {
        assertThat(jwtService.getExpirySeconds()).isEqualTo(1800L);
    }
}
