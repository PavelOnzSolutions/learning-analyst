package solutions.onz.muni.learning.domain;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@Document("tokens")
public class ApiToken {

    /** The signing JWT's {@code jti} — used directly as the Mongo _id so revocation
     *  lookups during JWT decode are a single findById. */
    @Id
    private String id;

    @Indexed
    private String userId;

    private String description;
    private Instant issuedAt;
    private Instant expiresAt;
    private boolean revoked;
}
