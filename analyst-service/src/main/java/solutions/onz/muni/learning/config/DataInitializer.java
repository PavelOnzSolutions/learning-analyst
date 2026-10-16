package solutions.onz.muni.learning.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import solutions.onz.muni.learning.domain.AppUser;
import solutions.onz.muni.learning.domain.Role;
import solutions.onz.muni.learning.repository.AppUserRepository;

import java.time.Instant;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements ApplicationRunner {

    private final AppUserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final ApplicationProperties applicationProperties;

    @Override
    public void run(ApplicationArguments args) {
        if (userRepository.count() > 0) {
            return;
        }
        ApplicationProperties.Admin admin = applicationProperties.getAdmin();
        AppUser user = new AppUser();
        user.setEmail(admin.getEmail());
        user.setUsername(admin.getUsername());
        user.setDisplayName("Administrator");
        user.setPasswordHash(passwordEncoder.encode(admin.getPassword()));
        user.setRole(Role.ADMIN);
        user.setEnabled(true);
        user.setCreatedAt(Instant.now());
        userRepository.save(user);
        log.warn("Seeded default admin account '{}' — change its password immediately.", admin.getUsername());
    }
}
