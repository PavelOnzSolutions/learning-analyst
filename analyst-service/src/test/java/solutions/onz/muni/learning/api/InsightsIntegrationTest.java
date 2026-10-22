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
import java.util.List;
import java.util.Map;

import static org.hamcrest.Matchers.hasSize;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Testcontainers
@SpringBootTest
@AutoConfigureMockMvc
class InsightsIntegrationTest {

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

    // Completed long ago, already expired by the time either run is confirmed -> OVERDUE.
    private static final String COMPLETED_CSV_EXPIRED =
            "id_zaznamu;id_zamestnance;zamestnanec;kod_skoleni;datum_absolvovani;platnost_do;poskytovatel;cena_kc;poznamka\n" +
            "Z0001;E0001;Tereza Urbanova;BOZP-Z;2019-01-06;2021-01-06;Interni;450;\n";

    // Freshly completed with a far-future expiry -> COMPLIANT.
    private static final String COMPLETED_CSV_FRESH =
            "id_zaznamu;id_zamestnance;zamestnanec;kod_skoleni;datum_absolvovani;platnost_do;poskytovatel;cena_kc;poznamka\n" +
            "Z0002;E0001;Tereza Urbanova;BOZP-Z;2026-01-06;2099-01-06;Interni;450;\n";

    private RequestPostProcessor asUser() {
        return jwt().jwt(b -> b.subject("integration-test-user").claim("role", "USER"))
                .authorities(new SimpleGrantedAuthority("ROLE_USER"));
    }

    private MockMultipartFile file(String part, String content) {
        return new MockMultipartFile(part, part + ".csv", "text/csv", content.getBytes(StandardCharsets.UTF_8));
    }

    private String createAndConfirmRun(String name, String completedCsv) throws Exception {
        String createResponse = mockMvc.perform(multipart("/api/v1/runs")
                        .file(file("employees", EMPLOYEES_CSV))
                        .file(file("trainingCatalog", CATALOG_CSV))
                        .file(file("timeslots", TIMESLOTS_CSV))
                        .file(file("completedTrainings", completedCsv))
                        .param("name", name)
                        .with(asUser()))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        String runId = JsonPath.read(createResponse, "$.id");

        mockMvc.perform(post("/api/v1/runs/" + runId + "/confirm").with(asUser()))
                .andExpect(status().isOk());
        return runId;
    }

    // NOTE: this Mongo instance is not reliably isolated per test run (the same pattern in
    // RunLifecycleIntegrationTest shows the same symptom), so completed runs from earlier
    // executions can still be present. Assertions below are scoped to the specific runIds
    // this test creates rather than assuming exact list sizes or fixed positions.
    private Map<String, Object> findByRunId(List<Map<String, Object>> entries, String runId) {
        return entries.stream()
                .filter(entry -> runId.equals(entry.get("runId")))
                .findFirst()
                .orElseThrow(() -> new AssertionError("No entry found for runId " + runId));
    }

    @Test
    void insightsEndpointsReflectTwoCompletedRunsForTheSameEmployee() throws Exception {
        String run1Id = createAndConfirmRun("Insights integration — run 1 (overdue)", COMPLETED_CSV_EXPIRED);
        String run2Id = createAndConfirmRun("Insights integration — run 2 (compliant)", COMPLETED_CSV_FRESH);

        String overviewResponse = mockMvc.perform(get("/api/v1/insights/overview").with(asUser()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        List<Map<String, Object>> runTrends = JsonPath.read(overviewResponse, "$.runTrends");
        Map<String, Object> run1Trend = findByRunId(runTrends, run1Id);
        Map<String, Object> run2Trend = findByRunId(runTrends, run2Id);
        assertEquals(1, ((Number) run1Trend.get("overdueCount")).intValue());
        assertEquals(1, ((Number) run2Trend.get("compliantCount")).intValue());

        mockMvc.perform(get("/api/v1/insights/employees").with(asUser()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.idZamestnance == 'E0001')]", hasSize(1)));

        String historyResponse = mockMvc.perform(get("/api/v1/insights/employees/E0001/history").with(asUser()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        List<Map<String, Object>> history = JsonPath.read(historyResponse, "$.history");
        Map<String, Object> run1History = findByRunId(history, run1Id);
        Map<String, Object> run2History = findByRunId(history, run2Id);
        assertEquals("OVERDUE", run1History.get("status"));
        assertEquals("COMPLIANT", run2History.get("status"));
    }
}
