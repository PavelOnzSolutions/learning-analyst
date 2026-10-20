package solutions.onz.muni.learning.api;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import solutions.onz.muni.learning.domain.DelimiterSetting;
import solutions.onz.muni.learning.domain.FileRole;
import solutions.onz.muni.learning.domain.ImportSettings;
import solutions.onz.muni.learning.repository.AppUserRepository;
import solutions.onz.muni.learning.repository.ImportSettingsRepository;

import java.util.EnumMap;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class ImportSettingsControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ImportSettingsRepository importSettingsRepository;

    @MockitoBean
    private AppUserRepository appUserRepository;

    private RequestPostProcessor asUser(String role) {
        return jwt().jwt(builder -> builder.subject("u1").claim("role", role))
                .authorities(new SimpleGrantedAuthority("ROLE_" + role));
    }

    @Test
    void plainUserIsForbiddenFromImportSettings() throws Exception {
        mockMvc.perform(get("/api/v1/admin/import-settings").with(asUser("USER")))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminCanReadImportSettings() throws Exception {
        ImportSettings settings = new ImportSettings();
        settings.setId("default");
        settings.setDelimiters(new EnumMap<>(FileRole.class));
        when(importSettingsRepository.findById("default")).thenReturn(Optional.of(settings));

        mockMvc.perform(get("/api/v1/admin/import-settings").with(asUser("ADMIN")))
                .andExpect(status().isOk());
    }
}
