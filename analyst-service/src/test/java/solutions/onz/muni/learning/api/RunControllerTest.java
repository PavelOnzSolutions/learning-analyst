package solutions.onz.muni.learning.api;

import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.web.server.ResponseStatusException;
import solutions.onz.muni.learning.api.dto.RunDetailResponse;
import solutions.onz.muni.learning.domain.Counts;
import solutions.onz.muni.learning.domain.ImportRun;
import solutions.onz.muni.learning.domain.RunStatus;
import solutions.onz.muni.learning.repository.AppUserRepository;
import solutions.onz.muni.learning.service.RunDetailService;
import solutions.onz.muni.learning.service.RunService;

import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
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

    @MockitoBean
    private RunDetailService runDetailService;

    @MockitoBean
    private AppUserRepository appUserRepository;

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

    @Test
    void createAcceptsMultipartRequestWithExactPartNames() throws Exception {
        ImportRun run = new ImportRun();
        run.setId("r1");
        run.setName("Test run");
        run.setStatus(RunStatus.PENDING_REVIEW);
        run.setCounts(new Counts(0, 0, 0, 0, 0, 0, 0, 0, 0));
        run.setFindings(List.of());
        when(runService.createRun(Mockito.any(), Mockito.any(), Mockito.any(), Mockito.any(), Mockito.any(), Mockito.any()))
                .thenReturn(run);

        MockMultipartFile employees = new MockMultipartFile("employees", "employees.csv", "text/csv",
                "id_zamestnance,jmeno\n".getBytes());
        MockMultipartFile trainingCatalog = new MockMultipartFile("trainingCatalog", "catalog.csv", "text/csv",
                "kod,nazev,platnost_mesicu,povinne_pro\n".getBytes());
        MockMultipartFile timeslots = new MockMultipartFile("timeslots", "timeslots.csv", "text/csv",
                "id_terminu;kod_skoleni;kapacita;obsazeno\n".getBytes());
        MockMultipartFile completedTrainings = new MockMultipartFile("completedTrainings", "completed.csv", "text/csv",
                "id_zaznamu;id_zamestnance;kod_skoleni;datum_absolvovani\n".getBytes());

        mockMvc.perform(multipart("/api/v1/runs")
                        .file(employees)
                        .file(trainingCatalog)
                        .file(timeslots)
                        .file(completedTrainings)
                        .param("name", "Test run")
                        .with(asUser("USER")))
                .andExpect(status().isCreated());
    }

    @Test
    void detailReturnsAssembledDashboardDataForAuthenticatedUser() throws Exception {
        RunDetailResponse detail = new RunDetailResponse(List.of(), List.of(), List.of(), List.of());
        when(runDetailService.getDetail("r1")).thenReturn(detail);

        mockMvc.perform(get("/api/v1/runs/r1/detail").with(asUser("USER")))
                .andExpect(status().isOk());
    }
}
