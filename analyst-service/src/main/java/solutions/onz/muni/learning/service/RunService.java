package solutions.onz.muni.learning.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import solutions.onz.muni.learning.domain.*;
import solutions.onz.muni.learning.repository.*;
import solutions.onz.muni.learning.service.analysis.*;
import solutions.onz.muni.learning.service.csv.CsvIngestionService;
import solutions.onz.muni.learning.service.csv.ParsedCsv;

import java.io.IOException;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RunService {

    private final CsvIngestionService csvIngestionService;
    private final ImportSettingsService importSettingsService;
    private final EmployeeAnalyzer employeeAnalyzer;
    private final TrainingCatalogAnalyzer trainingCatalogAnalyzer;
    private final TimeslotAnalyzer timeslotAnalyzer;
    private final CompletedTrainingAnalyzer completedTrainingAnalyzer;
    private final TrainingComplianceService trainingComplianceService;
    private final ImportRunRepository importRunRepository;
    private final RunEmployeeRepository runEmployeeRepository;
    private final RunTrainingCatalogEntryRepository runTrainingCatalogEntryRepository;
    private final RunTimeslotRepository runTimeslotRepository;
    private final RunCompletedTrainingRepository runCompletedTrainingRepository;

    public ImportRun createRun(String name, MultipartFile employeesFile, MultipartFile catalogFile,
                                MultipartFile timeslotsFile, MultipartFile completedTrainingsFile,
                                String createdByUserId) {
        ImportSettings settings = importSettingsService.getSettings();

        ParsedCsv employeesCsv = parseOrEmpty(employeesFile, FileRole.EMPLOYEES, settings);
        ParsedCsv catalogCsv = parseOrEmpty(catalogFile, FileRole.TRAINING_CATALOG, settings);
        ParsedCsv timeslotsCsv = parseOrEmpty(timeslotsFile, FileRole.TIMESLOTS, settings);
        ParsedCsv completedTrainingsCsv = parseOrEmpty(completedTrainingsFile, FileRole.COMPLETED_TRAININGS, settings);

        List<Finding> allFindings = new ArrayList<>();
        allFindings.addAll(employeesCsv.findings());
        allFindings.addAll(catalogCsv.findings());
        allFindings.addAll(timeslotsCsv.findings());
        allFindings.addAll(completedTrainingsCsv.findings());

        AnalysisResult<RunEmployee> employeeResult = employeeAnalyzer.analyze(employeesCsv.rows());
        AnalysisResult<RunTrainingCatalogEntry> catalogResult = trainingCatalogAnalyzer.analyze(catalogCsv.rows());
        allFindings.addAll(employeeResult.findings());
        allFindings.addAll(catalogResult.findings());
        allFindings.addAll(trainingCatalogAnalyzer.validatePovinneProReferences(catalogResult.rows(), employeeResult.rows()));

        Set<String> validCodes = catalogResult.rows().stream()
                .map(RunTrainingCatalogEntry::getKod).collect(Collectors.toSet());
        Set<String> validEmployeeIds = employeeResult.rows().stream()
                .map(RunEmployee::getIdZamestnance).collect(Collectors.toSet());

        AnalysisResult<RunTimeslot> timeslotResult = timeslotAnalyzer.analyze(timeslotsCsv.rows(), validCodes);
        AnalysisResult<RunCompletedTraining> completedResult =
                completedTrainingAnalyzer.analyze(completedTrainingsCsv.rows(), validCodes, validEmployeeIds);
        allFindings.addAll(timeslotResult.findings());
        allFindings.addAll(completedResult.findings());

        ComplianceSummary compliance = trainingComplianceService.summarize(
                employeeResult.rows(), catalogResult.rows(), completedResult.rows(), LocalDate.now());

        long errorCount = allFindings.stream().filter(f -> f.severity() == FindingSeverity.ERROR).count();
        long warningCount = allFindings.stream().filter(f -> f.severity() == FindingSeverity.WARNING).count();

        Counts counts = new Counts(
                employeeResult.rows().size(), catalogResult.rows().size(),
                timeslotResult.rows().size(), completedResult.rows().size(),
                errorCount, warningCount,
                compliance.compliantCount(), compliance.expiringSoonCount(), compliance.overdueCount());

        ImportRun run = new ImportRun();
        run.setName(name);
        run.setStatus(RunStatus.PENDING_REVIEW);
        run.setCreatedAt(Instant.now());
        run.setCreatedBy(createdByUserId);
        run.setCounts(counts);
        run.setFindings(allFindings);
        run = importRunRepository.save(run);

        String runId = run.getId();
        employeeResult.rows().forEach(e -> e.setRunId(runId));
        catalogResult.rows().forEach(e -> e.setRunId(runId));
        timeslotResult.rows().forEach(e -> e.setRunId(runId));
        completedResult.rows().forEach(e -> e.setRunId(runId));

        runEmployeeRepository.saveAll(employeeResult.rows());
        runTrainingCatalogEntryRepository.saveAll(catalogResult.rows());
        runTimeslotRepository.saveAll(timeslotResult.rows());
        runCompletedTrainingRepository.saveAll(completedResult.rows());

        return run;
    }

    private ParsedCsv parseOrEmpty(MultipartFile file, FileRole role, ImportSettings settings) {
        try {
            DelimiterSetting override = settings.getDelimiters() != null
                    ? settings.getDelimiters().getOrDefault(role, DelimiterSetting.AUTO)
                    : DelimiterSetting.AUTO;
            return csvIngestionService.parse(file.getBytes(), role, override);
        } catch (IOException e) {
            return new ParsedCsv(List.of(), List.of(), List.of(new Finding(FindingSeverity.ERROR, role, 0, null,
                    "File could not be read: " + e.getMessage())));
        }
    }

    public ImportRun confirmRun(String id) {
        ImportRun run = getRun(id);
        if (run.getStatus() != RunStatus.PENDING_REVIEW) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Run is not pending review");
        }
        boolean hasErrors = run.getFindings().stream().anyMatch(f -> f.severity() == FindingSeverity.ERROR);
        if (hasErrors) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Run has unresolved errors and cannot be confirmed");
        }
        run.setStatus(RunStatus.COMPLETED);
        run.setConfirmedAt(Instant.now());
        return importRunRepository.save(run);
    }

    public void rejectRun(String id) {
        ImportRun run = getRun(id);
        if (run.getStatus() != RunStatus.PENDING_REVIEW) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only a pending-review run can be rejected");
        }
        runEmployeeRepository.deleteByRunId(id);
        runTrainingCatalogEntryRepository.deleteByRunId(id);
        runTimeslotRepository.deleteByRunId(id);
        runCompletedTrainingRepository.deleteByRunId(id);
        importRunRepository.deleteById(id);
    }

    public ImportRun getRun(String id) {
        return importRunRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Run not found"));
    }

    public Page<ImportRun> listRuns(RunStatus statusFilter, Pageable pageable) {
        if (statusFilter != null) {
            return importRunRepository.findByStatus(statusFilter, pageable);
        }
        return importRunRepository.findAll(pageable);
    }
}
