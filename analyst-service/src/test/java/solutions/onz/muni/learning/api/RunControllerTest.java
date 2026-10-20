package solutions.onz.muni.learning.api;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.web.server.ResponseStatusException;
import solutions.onz.muni.learning.domain.Counts;
import solutions.onz.muni.learning.domain.ImportRun;
import solutions.onz.muni.learning.domain.RunStatus;
import solutions.onz.muni.learning.service.RunService;

import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class RunControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private RunService runService;

    private RequestPostProcessor asUser(String role) {
        return jwt().jwt(builder -> builder.subject("u1").claim("role", role))
                .authorities(new SimpleGrantedAuthority("ROLE_" + role));
    }

    @Test
    void listWithoutTokenIsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/v1/runs")).andExpect(status().isUnauthorized());
    }

    @Test
    void getReturnsRunForAuthenticatedUser() throws Exception {
        ImportRun run = new ImportRun();
        run.setId("r1");
        run.setName("Test run");
        run.setStatus(RunStatus.PENDING_REVIEW);
        run.setCounts(new Counts(0, 0, 0, 0, 0, 0, 0, 0, 0));
        run.setFindings(List.of());
        when(runService.getRun("r1")).thenReturn(run);

        mockMvc.perform(get("/api/v1/runs/r1").with(asUser("USER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("r1"))
                .andExpect(jsonPath("$.status").value("PENDING_REVIEW"));
    }

    @Test
    void confirmReturns409WhenServiceRejectsIt() throws Exception {
        when(runService.confirmRun("r1")).thenThrow(new ResponseStatusException(HttpStatus.CONFLICT, "has errors"));

        mockMvc.perform(post("/api/v1/runs/r1/confirm").with(asUser("USER")))
                .andExpect(status().isConflict());
    }
}
