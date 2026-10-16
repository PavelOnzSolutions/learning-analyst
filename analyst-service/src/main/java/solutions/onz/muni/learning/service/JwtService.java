package solutions.onz.muni.learning.service;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.RSASSASigner;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.gen.RSAKeyGenerator;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import solutions.onz.muni.learning.domain.AppUser;

import java.security.interfaces.RSAPublicKey;
import java.time.Instant;
import java.util.Date;

@Slf4j
@Service
public class JwtService {

    private final RSAKey rsaKey;
    private final long expirySeconds;
    private final String issuer;

    public JwtService(
            @Value("${analyst.jwt.issuer}") String issuer,
            @Value("${analyst.jwt.expiry-seconds}") long expirySeconds
    ) {
        this.issuer = issuer;
        this.expirySeconds = expirySeconds;
        log.warn("Generating an ephemeral in-memory RSA signing key for local-account JWTs. " +
                "Sessions and API tokens will not survive a service restart.");
        try {
            this.rsaKey = new RSAKeyGenerator(2048).keyID("analyst-key").generate();
        } catch (JOSEException e) {
            throw new IllegalStateException("Failed to generate RSA signing key", e);
        }
    }

    public String signSessionToken(AppUser user, String jti) throws JOSEException {
        return sign(user, expirySeconds, jti);
    }

    public String signApiToken(AppUser user, long ttlSeconds, String jti) throws JOSEException {
        return sign(user, ttlSeconds, jti);
    }

    private String sign(AppUser user, long ttlSeconds, String jti) throws JOSEException {
        Instant now = Instant.now();
        JWTClaimsSet claims = new JWTClaimsSet.Builder()
                .subject(user.getId())
                .issuer(issuer)
                .claim("email", user.getEmail())
                .claim("username", user.getUsername())
                .claim("role", user.getRole().name())
                .jwtID(jti)
                .issueTime(Date.from(now))
                .expirationTime(Date.from(now.plusSeconds(ttlSeconds)))
                .build();

        JWSHeader header = new JWSHeader.Builder(JWSAlgorithm.RS256).keyID(rsaKey.getKeyID()).build();
        SignedJWT signedJwt = new SignedJWT(header, claims);
        signedJwt.sign(new RSASSASigner(rsaKey));
        return signedJwt.serialize();
    }

    public RSAPublicKey getRsaPublicKey() throws JOSEException {
        return rsaKey.toRSAPublicKey();
    }

    public long getExpirySeconds() {
        return expirySeconds;
    }
}
