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
    // @Indexed: UserManagement.tsx sorts the user list by createdAt (sort=createdAt,desc).
    // Azure Cosmos DB for MongoDB (RU API) rejects an order-by on a path its indexing
    // policy doesn't cover, so the sort field needs an explicit index (see ImportRun.createdAt).
    @Indexed
    private Instant createdAt;
}
