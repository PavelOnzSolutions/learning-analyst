package solutions.onz.muni.learning.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import solutions.onz.muni.learning.api.dto.EmployeeHistoryResponse;
import solutions.onz.muni.learning.api.dto.EmployeeOption;
import solutions.onz.muni.learning.api.dto.EmployeeSummary;
import solutions.onz.muni.learning.api.dto.InsightsOverviewResponse;
import solutions.onz.muni.learning.api.dto.RunDetailResponse;
import solutions.onz.muni.learning.api.dto.SchedulingOpportunity;
import solutions.onz.muni.learning.api.dto.SchedulingSuggestionsResponse;
import solutions.onz.muni.learning.api.dto.TimeslotSummary;
import solutions.onz.muni.learning.domain.Counts;
import solutions.onz.muni.learning.domain.ImportRun;
import solutions.onz.muni.learning.domain.RunCompletedTraining;
import solutions.onz.muni.learning.domain.RunEmployee;
import solutions.onz.muni.learning.domain.RunTrainingCatalogEntry;
import solutions.onz.muni.learning.domain.enums.ComplianceStatus;
import solutions.onz.muni.learning.domain.enums.RunStatus;
import solutions.onz.muni.learning.repository.ImportRunRepository;
import solutions.onz.muni.learning.repository.RunCompletedTrainingRepository;
import solutions.onz.muni.learning.repository.RunEmployeeRepository;
import solutions.onz.muni.learning.repository.RunTrainingCatalogEntryRepository;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

class InsightsServiceTest {

    private final ImportRunRepository importRunRepository = Mockito.mock(ImportRunRepository.class);
    private final RunEmployeeRepository runEmployeeRepository = Mockito.mock(RunEmployeeRepository.class);
    private final RunTrainingCatalogEntryRepository runTrainingCatalogEntryRepository = Mockito.mock(RunTrainingCatalogEntryRepository.class);
    private final RunCompletedTrainingRepository runCompletedTrainingRepository = Mockito.mock(RunCompletedTrainingRepository.class);
    private final TrainingComplianceService trainingComplianceService = new TrainingComplianceService();
    private final RunDetailService runDetailService = Mockito.mock(RunDetailService.class);

    private final InsightsService insightsService = new InsightsService(
            importRunRepository, runEmployeeRepository, runTrainingCatalogEntryRepository,
            runCompletedTrainingRepository, trainingComplianceService, runDetailService);

    private ImportRun run(String id, String name, Instant confirmedAt, Counts counts) {
        ImportRun run = new ImportRun();
        run.setId(id);
        run.setName(name);
        run.setStatus(RunStatus.COMPLETED);
        run.setConfirmedAt(confirmedAt);
        run.setCounts(counts);
        return run;
    }

    private RunEmployee employee(String id, String jmeno, String prijmeni) {
        RunEmployee employee = new RunEmployee();
        employee.setIdZamestnance(id);
        employee.setJmeno(jmeno);
        employee.setPrijmeni(prijmeni);
        employee.setUtvar("Lab");
        employee.setPozice("Tech");
        employee.setStav("aktivní");
        return employee;
    }

    private RunTrainingCatalogEntry catalogEntry(String kod, Integer platnostMesicu) {
        RunTrainingCatalogEntry entry = new RunTrainingCatalogEntry();
        entry.setKod(kod);
        entry.setNazev("Training " + kod);
        entry.setPlatnostMesicu(platnostMesicu);
        entry.setPovinnePro("VSICHNI");
        return entry;
    }

    @BeforeEach
    void setUp() {
        when(runTrainingCatalogEntryRepository.findByRunId(Mockito.any())).thenReturn(List.of());
        when(runCompletedTrainingRepository.findByRunId(Mockito.any())).thenReturn(List.of());
        when(runEmployeeRepository.findByRunId(Mockito.any())).thenReturn(List.of());
    }

    @Test
    void getOverviewProjectsOneTrendPointPerCompletedRunFromItsPersistedCounts() {
        Counts counts = new Counts(10, 1, 1, 1, 0, 2, 7, 1, 2);
        when(importRunRepository.findByStatusOrderByCreatedAtAsc(RunStatus.COMPLETED))
                .thenReturn(List.of(run("r1", "October import", Instant.parse("2026-10-01T00:00:00Z"), counts)));

        InsightsOverviewResponse overview = insightsService.getOverview();

        assertThat(overview.runTrends()).hasSize(1);
        assertThat(overview.runTrends().get(0).runId()).isEqualTo("r1");
        assertThat(overview.runTrends().get(0).employees()).isEqualTo(10);
        assertThat(overview.runTrends().get(0).compliantCount()).isEqualTo(7);
        assertThat(overview.runTrends().get(0).overdueCount()).isEqualTo(2);
        assertThat(overview.runTrends().get(0).totalCostKc()).isEqualTo(BigDecimal.ZERO);
    }

    @Test
    void getOverviewSumsCostAcrossAllEmployeesAndTrainingsForTheRun() {
        when(importRunRepository.findByStatusOrderByCreatedAtAsc(RunStatus.COMPLETED))
                .thenReturn(List.of(run("r1", "October import", Instant.parse("2026-10-01T00:00:00Z"), new Counts(2, 1, 0, 0, 0, 0, 0, 0, 0))));
        when(runEmployeeRepository.findByRunId("r1")).thenReturn(List.of(
                employee("E1", "Tereza", "Urbanová"), employee("E2", "Jan", "Novák")));
        RunTrainingCatalogEntry entry = catalogEntry("BOZP-Z", 24);
        when(runTrainingCatalogEntryRepository.findByRunId("r1")).thenReturn(List.of(entry));

        RunCompletedTraining completion1 = new RunCompletedTraining();
        completion1.setIdZamestnance("E1");
        completion1.setKodSkoleni("BOZP-Z");
        completion1.setDatumAbsolvovani(LocalDate.of(2026, 1, 1));
        completion1.setCenaKc(new BigDecimal("450"));
        RunCompletedTraining completion2 = new RunCompletedTraining();
        completion2.setIdZamestnance("E2");
        completion2.setKodSkoleni("BOZP-Z");
        completion2.setDatumAbsolvovani(LocalDate.of(2026, 1, 1));
        completion2.setCenaKc(new BigDecimal("300"));
        when(runCompletedTrainingRepository.findByRunId("r1")).thenReturn(List.of(completion1, completion2));

        InsightsOverviewResponse overview = insightsService.getOverview();

        assertThat(overview.runTrends().get(0).totalCostKc()).isEqualTo(new BigDecimal("750"));
    }

    @Test
    void listEmployeesDedupesAcrossRunsKeepingTheMostRecentRunsSpelling() {
        ImportRun r1 = run("r1", "Run 1", Instant.parse("2026-09-01T00:00:00Z"), new Counts(1, 0, 0, 0, 0, 0, 0, 0, 0));
        ImportRun r2 = run("r2", "Run 2", Instant.parse("2026-10-01T00:00:00Z"), new Counts(1, 0, 0, 0, 0, 0, 0, 0, 0));
        when(importRunRepository.findByStatusOrderByCreatedAtAsc(RunStatus.COMPLETED)).thenReturn(List.of(r1, r2));
        when(runEmployeeRepository.findByRunId("r1")).thenReturn(List.of(employee("E1", "Tereza", "Urbanova")));
        when(runEmployeeRepository.findByRunId("r2")).thenReturn(List.of(employee("E1", "Tereza", "Urbanová")));

        List<EmployeeOption> employees = insightsService.listEmployees();

        assertThat(employees).hasSize(1);
        assertThat(employees.get(0).idZamestnance()).isEqualTo("E1");
        assertThat(employees.get(0).displayName()).isEqualTo("Tereza Urbanová");
    }

    @Test
    void getEmployeeHistoryEvaluatesEachRunAsOfItsOwnConfirmationDateNotToday() {
        RunTrainingCatalogEntry entry = catalogEntry("BOZP-Z", 24);

        ImportRun r1 = run("r1", "Run 1", Instant.parse("2020-01-01T00:00:00Z"), new Counts(1, 1, 0, 0, 0, 0, 1, 0, 0));
        ImportRun r2 = run("r2", "Run 2", Instant.parse("2026-10-01T00:00:00Z"), new Counts(1, 1, 0, 0, 0, 0, 0, 0, 1));
        when(importRunRepository.findByStatusOrderByCreatedAtAsc(RunStatus.COMPLETED)).thenReturn(List.of(r1, r2));

        RunEmployee emp = employee("E1", "Tereza", "Urbanová");
        when(runEmployeeRepository.findByRunId("r1")).thenReturn(List.of(emp));
        when(runEmployeeRepository.findByRunId("r2")).thenReturn(List.of(emp));
        when(runTrainingCatalogEntryRepository.findByRunId("r1")).thenReturn(List.of(entry));
        when(runTrainingCatalogEntryRepository.findByRunId("r2")).thenReturn(List.of(entry));

        // Completed 2019-06-01, valid 24 months -> expires 2021-06-01.
        // As of r1's confirmation (2020-01-01), that's COMPLIANT (not yet within 60 days of expiry).
        // As of r2's confirmation (2026-10-01), the same completion is long OVERDUE.
        // If the implementation used LocalDate.now() instead of each run's own confirmedAt,
        // r1's history point would incorrectly also show OVERDUE.
        RunCompletedTraining completion = new RunCompletedTraining();
        completion.setIdZamestnance("E1");
        completion.setKodSkoleni("BOZP-Z");
        completion.setDatumAbsolvovani(LocalDate.of(2019, 6, 1));
        when(runCompletedTrainingRepository.findByRunId("r1")).thenReturn(List.of(completion));
        when(runCompletedTrainingRepository.findByRunId("r2")).thenReturn(List.of(completion));

        EmployeeHistoryResponse history = insightsService.getEmployeeHistory("E1");

        assertThat(history.employeeName()).isEqualTo("Tereza Urbanová");
        assertThat(history.history()).hasSize(2);
        assertThat(history.history().get(0).runId()).isEqualTo("r1");
        assertThat(history.history().get(0).status()).isEqualTo(ComplianceStatus.COMPLIANT);
        assertThat(history.history().get(1).runId()).isEqualTo("r2");
        assertThat(history.history().get(1).status()).isEqualTo(ComplianceStatus.OVERDUE);
    }

    @Test
    void getEmployeeHistorySkipsRunsWhereTheEmployeeIsAbsentWithoutError() {
        ImportRun r1 = run("r1", "Run 1", Instant.parse("2026-09-01T00:00:00Z"), new Counts(1, 0, 0, 0, 0, 0, 0, 0, 0));
        ImportRun r2 = run("r2", "Run 2", Instant.parse("2026-10-01T00:00:00Z"), new Counts(1, 0, 0, 0, 0, 0, 0, 0, 0));
        when(importRunRepository.findByStatusOrderByCreatedAtAsc(RunStatus.COMPLETED)).thenReturn(List.of(r1, r2));
        when(runEmployeeRepository.findByRunId("r1")).thenReturn(List.of());
        when(runEmployeeRepository.findByRunId("r2")).thenReturn(List.of(employee("E1", "Tereza", "Urbanová")));
        when(runTrainingCatalogEntryRepository.findByRunId("r2")).thenReturn(List.of());

        EmployeeHistoryResponse history = insightsService.getEmployeeHistory("E1");

        assertThat(history.history()).isEmpty();
        assertThat(history.employeeName()).isEqualTo("Tereza Urbanová");
    }

    @Test
    void getEmployeeHistoryThrowsNotFoundWhenTheEmployeeNeverAppearsInAnyCompletedRun() {
        when(importRunRepository.findByStatusOrderByCreatedAtAsc(RunStatus.COMPLETED)).thenReturn(List.of());

        assertThatThrownBy(() -> insightsService.getEmployeeHistory("unknown"))
                .isInstanceOf(org.springframework.web.server.ResponseStatusException.class);
    }

    @Test
    void getSchedulingSuggestionsDelegatesToRunDetailServiceForTheMostRecentlyConfirmedRun() {
        ImportRun older = run("r1", "Older run", Instant.parse("2026-09-01T00:00:00Z"), new Counts(1, 0, 0, 0, 0, 0, 0, 0, 0));
        ImportRun latest = run("r2", "Latest run", Instant.parse("2026-10-01T00:00:00Z"), new Counts(1, 0, 0, 0, 0, 0, 0, 0, 0));
        when(importRunRepository.findFirstByStatusOrderByCreatedAtDesc(RunStatus.COMPLETED)).thenReturn(java.util.Optional.of(latest));

        SchedulingOpportunity opportunity = new SchedulingOpportunity("E1", "Tereza Urbanová", "BOZP-Z", "Základní školení",
                ComplianceStatus.OVERDUE, "T1", LocalDate.of(2026, 11, 1), 10, 5, new BigDecimal("450"));
        RunDetailResponse detail = new RunDetailResponse(List.of(), List.of(), List.of(), List.of(opportunity));
        when(runDetailService.getDetail("r2")).thenReturn(detail);

        SchedulingSuggestionsResponse response = insightsService.getSchedulingSuggestions();

        assertThat(response.basedOnRunId()).isEqualTo("r2");
        assertThat(response.basedOnRunName()).isEqualTo("Latest run");
        assertThat(response.suggestions()).hasSize(1);
        assertThat(response.suggestions().get(0).idZamestnance()).isEqualTo("E1");
    }

    @Test
    void getSchedulingSuggestionsReturnsEmptyWhenThereIsNoCompletedRunYet() {
        when(importRunRepository.findFirstByStatusOrderByCreatedAtDesc(RunStatus.COMPLETED)).thenReturn(java.util.Optional.empty());

        SchedulingSuggestionsResponse response = insightsService.getSchedulingSuggestions();

        assertThat(response.basedOnRunId()).isNull();
        assertThat(response.suggestions()).isEmpty();
    }
}
