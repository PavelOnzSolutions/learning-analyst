package solutions.onz.muni.learning.config;

import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

class ApplicationPropertiesTest {

    @Test
    void defaultsAreSetWhenNoOverridesProvided() {
        ApplicationProperties properties = new ApplicationProperties();

        assertThat(properties.getJwt().getIssuer()).isEqualTo("learning-analyst");
        assertThat(properties.getJwt().getExpirySeconds()).isEqualTo(1800L);
        assertThat(properties.getAdmin().getEmail()).isEqualTo("admin@local.test");
        assertThat(properties.getAdmin().getUsername()).isEqualTo("admin");
        assertThat(properties.getAdmin().getPassword()).isEqualTo("ChangeMe123!");
        assertThat(properties.getFrontend().getBaseUrl()).isEqualTo("http://localhost:5173");
    }
}
