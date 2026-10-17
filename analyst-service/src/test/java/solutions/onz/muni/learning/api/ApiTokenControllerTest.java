package solutions.onz.muni.learning.api;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import solutions.onz.muni.learning.domain.AppUser;
import solutions.onz.muni.learning.domain.Role;
import solutions.onz.muni.learning.repository.AppUserRepository;
import solutions.onz.muni.learning.repository.ApiTokenRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class ApiTokenControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AppUserRepository userRepository;

    @MockitoBean
    private ApiTokenRepository apiTokenRepository;

    private RequestPostProcessor asUser(String id, String role) {
        return jwt().jwt(builder -> builder.subject(id).claim("role", role))
                .authorities(new SimpleGrantedAuthority("ROLE_" + role));
    }

    private AppUser user(String id) {
        AppUser user = new AppUser();
        user.setId(id);
        user.setEmail("jane@local.test");
        user.setUsername("jane");
        user.setRole(Role.USER);
        user.setEnabled(true);
        user.setCreatedAt(Instant.now());
        return user;
    }

    @Test
    void listWithoutTokenIsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/v1/tokens"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void listReturnsOnlyCallersTokens() throws Exception {
        when(apiTokenRepository.findByUserId("u2")).thenReturn(List.of());

        mockMvc.perform(get("/api/v1/tokens").with(asUser("u2", "USER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void createReturnsTokenOnce() throws Exception {
        when(userRepository.findById("u2")).thenReturn(Optional.of(user("u2")));
        when(apiTokenRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        mockMvc.perform(post("/api/v1/tokens").with(asUser("u2", "USER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"CI token\",\"expirationDays\":30}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.name").value("CI token"));
    }
}
