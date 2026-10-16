package solutions.onz.muni.learning.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "analyst", ignoreUnknownFields = false)
public class ApplicationProperties {

    private Jwt jwt = new Jwt();
    private Admin admin = new Admin();
    private Frontend frontend = new Frontend();

    @Getter
    @Setter
    public static class Jwt {
        private String issuer = "learning-analyst";
        private long expirySeconds = 1800;
    }

    @Getter
    @Setter
    public static class Admin {
        private String email = "admin@local.test";
        private String username = "admin";
        private String password = "ChangeMe123!";
    }

    @Getter
    @Setter
    public static class Frontend {
        private String baseUrl = "http://localhost:5173";
    }
}
