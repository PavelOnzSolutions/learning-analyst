package solutions.onz.muni.learning.domain;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import solutions.onz.muni.learning.domain.enums.Role;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@Document("users")
public class AppUser {

    @Id
    private String id;

    @Indexed(unique = true)
    private String email;

    @Indexed(unique = true)
    private String username;

    private String displayName;
    private String avatarUrl;
    private String passwordHash;
    private Role role;
    private boolean enabled;
    private Instant createdAt;
}
