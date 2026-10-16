package solutions.onz.muni.learning;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableAsync;
import solutions.onz.muni.learning.config.ApplicationProperties;

@EnableConfigurationProperties({ApplicationProperties.class})
@SpringBootApplication
@EnableAsync
public class LearningAnalystApplication {
    static void main(String[] args) {
        SpringApplication.run(LearningAnalystApplication.class, args);
    }
}
