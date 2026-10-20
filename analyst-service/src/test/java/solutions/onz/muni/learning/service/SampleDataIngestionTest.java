package solutions.onz.muni.learning.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;
import solutions.onz.muni.learning.domain.FileRole;
import solutions.onz.muni.learning.domain.ImportRun;
import solutions.onz.muni.learning.domain.ImportSettings;
import solutions.onz.muni.learning.repository.ImportRunRepository;
import solutions.onz.muni.learning.repository.RunCompletedTrainingRepository;
import solutions.onz.muni.learning.repository.RunEmployeeRepository;
import solutions.onz.muni.learning.repository.RunTimeslotRepository;
import solutions.onz.muni.learning.repository.RunTrainingCatalogEntryRepository;
import solutions.onz.muni.learning.service.analysis.CompletedTrainingAnalyzer;
import solutions.onz.muni.learning.service.analysis.EmployeeAnalyzer;
import solutions.onz.muni.learning.service.analysis.TimeslotAnalyzer;
import solutions.onz.muni.learning.service.analysis.TrainingCatalogAnalyzer;
import solutions.onz.muni.learning.service.csv.CsvIngestionService;
import solutions.onz.muni.learning.service.csv.SanitizationService;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.EnumMap;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

/**
 * Reads the real files in /sample-data and runs them through the full RunService pipeline.
 * Every other analyzer/service test uses hand-typed, BOM-free, quirk-free Java string literals —
 * this is the only test that proves the pipeline actually ingests the real data (catching bugs
 * like a leading UTF-8 BOM that hand-typed fixtures would never exercise).
 */
class SampleDataIngestionTest {

    private static final Path SAMPLE_DATA_DIR = Path.of("../sample-data");

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

    private MultipartFile sampleFile(String fileName) throws IOException {
        byte[] bytes = Files.readAllBytes(SAMPLE_DATA_DIR.resolve(fileName));
        return new MockMultipartFile(fileName, bytes);
    }

    @Test
    void ingestsTheBulkOfTheRealSampleDataFiles() throws IOException {
        MultipartFile employees = sampleFile("zamestnanci.csv");
        MultipartFile catalog = sampleFile("katalog_skoleni.csv");
        MultipartFile timeslots = sampleFile("terminy_skoleni.csv");
        MultipartFile completedTrainings = sampleFile("absolvovana_skoleni.csv");

        ImportRun run = runService.createRun("Sample data run", employees, catalog, timeslots, completedTrainings, "u1");

        // Loose bounds on purpose: the real sample data has known data-quality issues
        // (an invalid date, a typo training code) that are EXPECTED to produce findings.
        // This test proves the pipeline ingests the bulk of the real data, not that the data is clean.
        assertThat(run.getCounts().employees()).isGreaterThan(100);
        assertThat(run.getCounts().trainingCatalogEntries()).isGreaterThan(0);
        assertThat(run.getCounts().timeslots()).isGreaterThan(0);
        assertThat(run.getCounts().completedTrainings()).isGreaterThan(1000);
    }
}
