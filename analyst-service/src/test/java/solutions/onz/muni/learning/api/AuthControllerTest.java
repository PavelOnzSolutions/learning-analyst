package solutions.onz.muni.learning.api;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import solutions.onz.muni.learning.domain.AppUser;
import solutions.onz.muni.learning.domain.Role;
import solutions.onz.muni.learning.repository.AppUserRepository;
import solutions.onz.muni.learning.repository.ApiTokenRepository;

import java.time.Instant;
import java.util.Optional;

import static org.hamcrest.Matchers.notNullValue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AppUserRepository userRepository;

    @MockitoBean
    private ApiTokenRepository apiTokenRepository;

    private AppUser adminUser() {
        AppUser user = new AppUser();
        user.setId("u1");
        user.setEmail("admin@local.test");
        user.setUsername("admin");
        user.setPasswordHash(new BCryptPasswordEncoder().encode("ChangeMe123!"));
        user.setRole(Role.ADMIN);
        user.setEnabled(true);
        user.setCreatedAt(Instant.now());
        return user;
    }

    @Test
    void loginWithCorrectCredentialsReturnsToken() throws Exception {
        when(userRepository.findByEmailIgnoreCase("admin")).thenReturn(Optional.empty());
        when(userRepository.findByUsernameIgnoreCase("admin")).thenReturn(Optional.of(adminUser()));
        when(apiTokenRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"login\":\"admin\",\"password\":\"ChangeMe123!\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value(notNullValue()))
                .andExpect(jsonPath("$.user.username").value("admin"))
                .andExpect(jsonPath("$.user.role").value("ADMIN"));
    }

    @Test
    void loginWithWrongPasswordReturns401() throws Exception {
        when(userRepository.findByEmailIgnoreCase("admin")).thenReturn(Optional.empty());
        when(userRepository.findByUsernameIgnoreCase("admin")).thenReturn(Optional.of(adminUser()));

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"login\":\"admin\",\"password\":\"wrong\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void refreshWithoutTokenReturns401() throws Exception {
        mockMvc.perform(post("/api/v1/auth/refresh"))
                .andExpect(status().isUnauthorized());
    }
}
