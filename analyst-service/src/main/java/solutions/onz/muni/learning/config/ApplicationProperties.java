package solutions.onz.muni.learning.config;

import lombok.Getter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@ConfigurationProperties(prefix = "analyst", ignoreUnknownFields = false)
public class ApplicationProperties {
}
