package solutions.onz.muni.learning.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import solutions.onz.muni.learning.domain.*;
import solutions.onz.muni.learning.domain.enums.FileRole;
import solutions.onz.muni.learning.domain.enums.FindingSeverity;
import solutions.onz.muni.learning.domain.enums.RunStatus;
import solutions.onz.muni.learning.repository.*;
import solutions.onz.muni.learning.service.analysis.CompletedTrainingAnalyzer;
import solutions.onz.muni.learning.service.analysis.EmployeeAnalyzer;
import solutions.onz.muni.learning.service.analysis.TimeslotAnalyzer;
import solutions.onz.muni.learning.service.analysis.TrainingCatalogAnalyzer;
import solutions.onz.muni.learning.service.csv.CsvIngestionService;
import solutions.onz.muni.learning.service.csv.SanitizationService;

import java.nio.charset.StandardCharsets;
import java.util.EnumMap;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

class RunServiceTest {

    private final ImportSettingsService importSettingsService = Mockito.mock(ImportSettingsService.class);
    private final ImportRunRepository importRunRepository = Mockito.mock(ImportRunRepository.class);
    private final RunEmployeeRepository runEmployeeRepository = Mockito.mock(RunEmployeeRepository.class);
    private final RunTrainingCatalogEntryRepository runTrainingCatalogEntryRepository = Mockito.mock(RunTrainingCatalogEntryRepository.class);
    private final RunTimeslotRepository runTimeslotRepository = Mockito.mock(RunTimeslotRepository.class);
    private final RunCompletedTrainingRepository runCompletedTrainingRepository = Mockito.mock(RunCompletedTrainingRepository.class);

    private final SanitizationService sanitizationService = new SanitizationService();

    private final RunService runService = new RunService(
            new CsvIngestionService(),
            importSettingsService,
            new EmployeeAnalyzer(sanitizationService),
            new TrainingCatalogAnalyzer(sanitizationService),
            new TimeslotAnalyzer(sanitizationService),
            new CompletedTrainingAnalyzer(sanitizationService),
            new TrainingComplianceService(),
            importRunRepository,
            runEmployeeRepository,
            runTrainingCatalogEntryRepository,
            runTimeslotRepository,
            runCompletedTrainingRepository
    );

    @BeforeEach
    void setUp() {
        ImportSettings settings = new ImportSettings();
        settings.setDelimiters(new EnumMap<>(FileRole.class));
        when(importSettingsService.getSettings()).thenReturn(settings);
        when(importRunRepository.save(any(ImportRun.class))).thenAnswer(invocation -> {
            ImportRun run = invocation.getArgument(0);
            if (run.getId() == null) {
                run.setId("generated-id");
            }
            return run;
        });
    }

    private MultipartFile csvFile(String content) {
        return new MockMultipartFile("file", content.getBytes(StandardCharsets.UTF_8));
    }

    @Test
    void createRunAggregatesCountsAcrossAllFourFiles() {
        MultipartFile employees = csvFile("id_zamestnance,jmeno\nE1,Tereza\n");
        MultipartFile catalog = csvFile("kod,nazev,platnost_mesicu,povinne_pro\nBOZP-Z,Test,24,VSICHNI\n");
        MultipartFile timeslots = csvFile("id_terminu;kod_skoleni;kapacita;obsazeno\nT1;BOZP-Z;10;5\n");
        MultipartFile completed = csvFile("id_zaznamu;id_zamestnance;kod_skoleni;datum_absolvovani\nZ1;E1;BOZP-Z;2024-01-01\n");

        ImportRun run = runService.createRun("Test run", employees, catalog, timeslots, completed, "u1");

        assertThat(run.getStatus()).isEqualTo(RunStatus.PENDING_REVIEW);
        assertThat(run.getCounts().employees()).isEqualTo(1);
        assertThat(run.getCounts().trainingCatalogEntries()).isEqualTo(1);
        assertThat(run.getCounts().timeslots()).isEqualTo(1);
        assertThat(run.getCounts().completedTrainings()).isEqualTo(1);
        assertThat(run.getCounts().errorCount()).isEqualTo(0);
        Mockito.verify(runEmployeeRepository).saveAll(Mockito.<List<RunEmployee>>any());
        Mockito.verify(runTrainingCatalogEntryRepository).saveAll(Mockito.<List<RunTrainingCatalogEntry>>any());
        Mockito.verify(runTimeslotRepository).saveAll(Mockito.<List<RunTimeslot>>any());
        Mockito.verify(runCompletedTrainingRepository).saveAll(Mockito.<List<RunCompletedTraining>>any());
    }

    @Test
    void malformedCsvProducesErrorFindingInsteadOfThrowing() {
        MultipartFile employees = csvFile("id_zamestnance,jmeno\n\"E1,Tereza\n"); // unterminated quote
        MultipartFile catalog = csvFile("kod,nazev,platnost_mesicu,povinne_pro\nBOZP-Z,Test,24,VSICHNI\n");
        MultipartFile timeslots = csvFile("id_terminu;kod_skoleni;kapacita;obsazeno\nT1;BOZP-Z;10;5\n");
        MultipartFile completed = csvFile("id_zaznamu;id_zamestnance;kod_skoleni;datum_absolvovani\nZ1;E1;BOZP-Z;2024-01-01\n");

        ImportRun run = runService.createRun("Test run", employees, catalog, timeslots, completed, "u1");

        assertThat(run.getStatus()).isEqualTo(RunStatus.PENDING_REVIEW);
        assertThat(run.getFindings())
                .anyMatch(f -> f.file() == FileRole.EMPLOYEES && f.severity() == FindingSeverity.ERROR);
    }

    @Test
    void missingRequiredKeyColumnProducesSingleClearFindingAndBlocksConfirm() {
        // Wrong file uploaded into the Employees box: has headers, but none is id_zamestnance
        MultipartFile employees = csvFile("kod,nazev\nBOZP-Z,Test\n");
        MultipartFile catalog = csvFile("kod,nazev,platnost_mesicu,povinne_pro\nBOZP-Z,Test,24,VSICHNI\n");
        MultipartFile timeslots = csvFile("id_terminu;kod_skoleni;kapacita;obsazeno\nT1;BOZP-Z;10;5\n");
        MultipartFile completed = csvFile("id_zaznamu;id_zamestnance;kod_skoleni;datum_absolvovani\nZ1;E1;BOZP-Z;2024-01-01\n");

        ImportRun run = runService.createRun("Test run", employees, catalog, timeslots, completed, "u1");

        List<Finding> employeeFindings = run.getFindings().stream()
                .filter(f -> f.file() == FileRole.EMPLOYEES)
                .toList();
        assertThat(employeeFindings).hasSize(1);
        assertThat(employeeFindings.get(0).severity()).isEqualTo(FindingSeverity.ERROR);
        assertThat(employeeFindings.get(0).message()).contains("id_zamestnance");
        assertThat(run.getCounts().employees()).isEqualTo(0);
        assertThat(run.getCounts().errorCount()).isGreaterThanOrEqualTo(1);
    }

    @Test
    void confirmRunSucceedsEvenWithUnresolvedErrorFindings() {
        ImportRun run = new ImportRun();
        run.setId("r1");
        run.setStatus(RunStatus.PENDING_REVIEW);
        run.setFindings(List.of(new Finding(FindingSeverity.ERROR, FileRole.EMPLOYEES, 1, "id_zamestnance", "Missing")));
        when(importRunRepository.findById("r1")).thenReturn(Optional.of(run));

        ImportRun confirmed = runService.confirmRun("r1");

        assertThat(confirmed.getStatus()).isEqualTo(RunStatus.COMPLETED);
        assertThat(confirmed.getConfirmedAt()).isNotNull();
    }

    @Test
    void confirmRunThrowsConflictWhenNotPendingReview() {
        ImportRun run = new ImportRun();
        run.setId("r1");
        run.setStatus(RunStatus.COMPLETED);
        run.setFindings(List.of());
        when(importRunRepository.findById("r1")).thenReturn(Optional.of(run));

        assertThatThrownBy(() -> runService.confirmRun("r1")).isInstanceOf(ResponseStatusException.class);
    }

    @Test
    void confirmRunSucceedsWhenOnlyWarningsExist() {
        ImportRun run = new ImportRun();
        run.setId("r1");
        run.setStatus(RunStatus.PENDING_REVIEW);
        run.setFindings(List.of(new Finding(FindingSeverity.WARNING, FileRole.EMPLOYEES, 1, "email", "Malformed")));
        when(importRunRepository.findById("r1")).thenReturn(Optional.of(run));

        ImportRun confirmed = runService.confirmRun("r1");

        assertThat(confirmed.getStatus()).isEqualTo(RunStatus.COMPLETED);
        assertThat(confirmed.getConfirmedAt()).isNotNull();
    }

    @Test
    void rejectRunDeletesRunAndAllRowCollections() {
        ImportRun run = new ImportRun();
        run.setId("r1");
        run.setStatus(RunStatus.PENDING_REVIEW);
        when(importRunRepository.findById("r1")).thenReturn(Optional.of(run));

        runService.rejectRun("r1");

        Mockito.verify(runEmployeeRepository).deleteByRunId("r1");
        Mockito.verify(runTrainingCatalogEntryRepository).deleteByRunId("r1");
        Mockito.verify(runTimeslotRepository).deleteByRunId("r1");
        Mockito.verify(runCompletedTrainingRepository).deleteByRunId("r1");
        Mockito.verify(importRunRepository).deleteById("r1");
    }

    @Test
    void rejectRunThrowsConflictWhenAlreadyCompleted() {
        ImportRun run = new ImportRun();
        run.setId("r1");
        run.setStatus(RunStatus.COMPLETED);
        when(importRunRepository.findById("r1")).thenReturn(Optional.of(run));

        assertThatThrownBy(() -> runService.rejectRun("r1")).isInstanceOf(ResponseStatusException.class);
    }
}
