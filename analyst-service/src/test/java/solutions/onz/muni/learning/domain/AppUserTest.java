package solutions.onz.muni.learning.domain;

import org.junit.jupiter.api.Test;
import solutions.onz.muni.learning.domain.enums.Role;

import java.time.Instant;
import static org.assertj.core.api.Assertions.assertThat;

class AppUserTest {

    @Test
    void gettersAndSettersRoundTrip() {
        AppUser user = new AppUser();
        Instant now = Instant.now();

        user.setId("u1");
        user.setEmail("admin@local.test");
        user.setUsername("admin");
        user.setDisplayName("Administrator");
        user.setAvatarUrl(null);
        user.setPasswordHash("hash");
        user.setRole(Role.ADMIN);
        user.setEnabled(true);
        user.setCreatedAt(now);

        assertThat(user.getId()).isEqualTo("u1");
        assertThat(user.getEmail()).isEqualTo("admin@local.test");
        assertThat(user.getUsername()).isEqualTo("admin");
        assertThat(user.getDisplayName()).isEqualTo("Administrator");
        assertThat(user.getAvatarUrl()).isNull();
        assertThat(user.getPasswordHash()).isEqualTo("hash");
        assertThat(user.getRole()).isEqualTo(Role.ADMIN);
        assertThat(user.isEnabled()).isTrue();
        assertThat(user.getCreatedAt()).isEqualTo(now);
    }
}
