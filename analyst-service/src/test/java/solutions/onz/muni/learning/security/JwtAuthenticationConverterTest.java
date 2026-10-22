package solutions.onz.muni.learning.security;

import org.junit.jupiter.api.Test;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import solutions.onz.muni.learning.config.SecurityConfig;

import java.time.Instant;
import java.util.Collection;

import static org.assertj.core.api.Assertions.assertThat;

class JwtAuthenticationConverterTest {

    @Test
    void mapsRoleClaimToRolePrefixedAuthority() {
        Jwt jwt = Jwt.withTokenValue("token")
                .header("alg", "RS256")
                .claim("role", "ADMIN")
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(60))
                .build();

        var converter = SecurityConfig.jwtAuthenticationConverter();
        Collection<GrantedAuthority> authorities = converter.convert(jwt).getAuthorities();

        // Spring Security 7.1's JwtAuthenticationConverter.convert() unconditionally adds a
        // FACTOR_BEARER authority (unrelated authentication-factor bookkeeping) alongside whatever
        // the configured jwtGrantedAuthoritiesConverter produces, so we isolate the ROLE_* authorities
        // that our custom converter is actually responsible for.
        assertThat(authorities).extracting(GrantedAuthority::getAuthority)
                .filteredOn(authority -> authority.startsWith("ROLE_"))
                .containsExactly("ROLE_ADMIN");
    }

    @Test
    void producesNoAuthoritiesWhenRoleClaimMissing() {
        Jwt jwt = Jwt.withTokenValue("token")
                .header("alg", "RS256")
                .claim("sub", "u1")
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(60))
                .build();

        var converter = SecurityConfig.jwtAuthenticationConverter();
        Collection<GrantedAuthority> authorities = converter.convert(jwt).getAuthorities();

        assertThat(authorities).extracting(GrantedAuthority::getAuthority)
                .noneMatch(authority -> authority.startsWith("ROLE_"));
    }
}
