package solutions.onz.muni.learning.api;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.testcontainers.containers.MongoDBContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.nio.charset.StandardCharsets;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Testcontainers
@SpringBootTest
@AutoConfigureMockMvc
class RunLifecycleIntegrationTest {

    @Container
    static MongoDBContainer mongo = new MongoDBContainer("mongo:7.0");

    @DynamicPropertySource
    static void mongoProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.data.mongodb.uri", mongo::getReplicaSetUrl);
    }

    @Autowired
    private MockMvc mockMvc;

    private static final String EMPLOYEES_CSV =
            "id_zamestnance,jmeno,prijmeni,email,utvar,pozice,vedouci_email,datum_nastupu,datum_ukonceni,stav,rodne_cislo,poznamka\n" +
            "E0001,Tereza,Urbanova,tereza.urbanova@example.com,Studijni oddeleni,Vedouci,,2008-02-23,,aktivni,665917/0359,\n";

    private static final String CATALOG_CSV =
            "kod,nazev,platnost_mesicu,povinne_pro,poznamka\n" +
            "BOZP-Z,Zakladni skoleni,24,VSICHNI,\n";

    private static final String TIMESLOTS_CSV =
            "id_terminu;kod_skoleni;datum;cas;misto;kapacita;obsazeno;cena_na_osobu;stav\n" +
            "T001;BOZP-Z;2026-10-14;09:00-12:00;Aula A;25;22;450;planovano\n";

    private static final String COMPLETED_CSV_WITH_UNRESOLVABLE_EMPLOYEE =
            "id_zaznamu;id_zamestnance;zamestnanec;kod_skoleni;datum_absolvovani;platnost_do;poskytovatel;cena_kc;poznamka\n" +
            "Z0001;E9999;Unknown Person;BOZP-Z;2019-01-06;2021-01-06;Interni;450;\n";

    private RequestPostProcessor asUser() {
        return jwt().jwt(b -> b.subject("integration-test-user").claim("role", "USER"))
                .authorities(new SimpleGrantedAuthority("ROLE_USER"));
    }

    private MockMultipartFile file(String part, String content) {
        return new MockMultipartFile(part, part + ".csv", "text/csv", content.getBytes(StandardCharsets.UTF_8));
    }

    @Test
    void runWithAnUnresolvableReferenceCannotBeConfirmedButCanBeRejected() throws Exception {
        String createResponse = mockMvc.perform(multipart("/api/v1/runs")
                        .file(file("employees", EMPLOYEES_CSV))
                        .file(file("trainingCatalog", CATALOG_CSV))
                        .file(file("timeslots", TIMESLOTS_CSV))
                        .file(file("completedTrainings", COMPLETED_CSV_WITH_UNRESOLVABLE_EMPLOYEE))
                        .param("name", "Integration test run — has error")
                        .with(asUser()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("PENDING_REVIEW"))
                .andExpect(jsonPath("$.counts.errorCount").value(1))
                .andReturn().getResponse().getContentAsString();

        String runId = JsonPath.read(createResponse, "$.id");

        mockMvc.perform(post("/api/v1/runs/" + runId + "/confirm").with(asUser()))
                .andExpect(status().isConflict());

        mockMvc.perform(delete("/api/v1/runs/" + runId).with(asUser()))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/v1/runs/" + runId).with(asUser()))
                .andExpect(status().isNotFound());
    }

    @Test
    void runWithNoErrorsCanBeConfirmedAndThenAppearsInTheCompletedList() throws Exception {
        String cleanCompletedCsv =
                "id_zaznamu;id_zamestnance;zamestnanec;kod_skoleni;datum_absolvovani;platnost_do;poskytovatel;cena_kc;poznamka\n" +
                "Z0002;E0001;Tereza Urbanova;BOZP-Z;2019-01-06;2099-01-06;Interni;450;\n";

        String createResponse = mockMvc.perform(multipart("/api/v1/runs")
                        .file(file("employees", EMPLOYEES_CSV))
                        .file(file("trainingCatalog", CATALOG_CSV))
                        .file(file("timeslots", TIMESLOTS_CSV))
                        .file(file("completedTrainings", cleanCompletedCsv))
                        .param("name", "Integration test run — clean")
                        .with(asUser()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.counts.errorCount").value(0))
                .andReturn().getResponse().getContentAsString();

        String runId = JsonPath.read(createResponse, "$.id");

        mockMvc.perform(post("/api/v1/runs/" + runId + "/confirm").with(asUser()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"));

        mockMvc.perform(get("/api/v1/runs").param("status", "COMPLETED").param("sort", "createdAt,desc").with(asUser()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(runId));
    }
}
