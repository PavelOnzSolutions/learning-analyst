package solutions.onz.muni.learning.api;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import solutions.onz.muni.learning.domain.AppUser;
import solutions.onz.muni.learning.domain.Role;
import solutions.onz.muni.learning.repository.AppUserRepository;
import solutions.onz.muni.learning.repository.ApiTokenRepository;

import java.time.Instant;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AppUserRepository userRepository;

    @MockitoBean
    private ApiTokenRepository apiTokenRepository;

    private AppUser plainUser() {
        AppUser user = new AppUser();
        user.setId("u2");
        user.setEmail("jane@local.test");
        user.setUsername("jane");
        user.setRole(Role.USER);
        user.setEnabled(true);
        user.setCreatedAt(Instant.now());
        return user;
    }

    private RequestPostProcessor asUser(String id, String role) {
        return jwt().jwt(builder -> builder.subject(id).claim("role", role))
                .authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_" + role));
    }

    @Test
    void listUsersAsPlainUserIsForbidden() throws Exception {
        mockMvc.perform(get("/api/v1/users").with(asUser("u2", "USER")))
                .andExpect(status().isForbidden());
    }

    @Test
    void getOwnProfileReturnsSelf() throws Exception {
        when(userRepository.findById("u2")).thenReturn(Optional.of(plainUser()));

        mockMvc.perform(get("/api/v1/users/me").with(asUser("u2", "USER")))
                .andExpect(status().isOk());
    }

    @Test
    void getOwnProfileWithoutTokenIsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/v1/users/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void adminCanGetUserById() throws Exception {
        when(userRepository.findById("u2")).thenReturn(Optional.of(plainUser()));

        mockMvc.perform(get("/api/v1/users/u2").with(asUser("admin-id", "ADMIN")))
                .andExpect(status().isOk())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.id").value("u2"))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.username").value("jane"));
    }

    @Test
    void plainUserGetUserByIdIsForbidden() throws Exception {
        mockMvc.perform(get("/api/v1/users/u2").with(asUser("u2", "USER")))
                .andExpect(status().isForbidden());
    }

    @Test
    void createUserWithMissingFieldsReturns400NotServerError() throws Exception {
        mockMvc.perform(post("/api/v1/users")
                        .with(asUser("admin-id", "ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"new@local.test\"}"))
                .andExpect(status().isBadRequest());
    }
}
