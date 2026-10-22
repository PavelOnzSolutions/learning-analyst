package solutions.onz.muni.learning.service;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import solutions.onz.muni.learning.api.dto.EmployeeHistoryPoint;
import solutions.onz.muni.learning.api.dto.EmployeeHistoryResponse;
import solutions.onz.muni.learning.api.dto.EmployeeOption;
import solutions.onz.muni.learning.api.dto.InsightsOverviewResponse;
import solutions.onz.muni.learning.api.dto.RunTrendPoint;
import solutions.onz.muni.learning.domain.ImportRun;
import solutions.onz.muni.learning.domain.RunCompletedTraining;
import solutions.onz.muni.learning.domain.RunEmployee;
import solutions.onz.muni.learning.domain.RunTrainingCatalogEntry;
import solutions.onz.muni.learning.domain.enums.RunStatus;
import solutions.onz.muni.learning.repository.ImportRunRepository;
import solutions.onz.muni.learning.repository.RunCompletedTrainingRepository;
import solutions.onz.muni.learning.repository.RunEmployeeRepository;
import solutions.onz.muni.learning.repository.RunTrainingCatalogEntryRepository;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class InsightsService {

    private final ImportRunRepository importRunRepository;
    private final RunEmployeeRepository runEmployeeRepository;
    private final RunTrainingCatalogEntryRepository runTrainingCatalogEntryRepository;
    private final RunCompletedTrainingRepository runCompletedTrainingRepository;
    private final TrainingComplianceService trainingComplianceService;

    public InsightsOverviewResponse getOverview() {
        List<RunTrendPoint> runTrends = completedRunsChronological().stream()
                .map(RunTrendPoint::from)
                .toList();
        return new InsightsOverviewResponse(runTrends);
    }

    public List<EmployeeOption> listEmployees() {
        // Last-run-wins: if an employee's name differs between imports, the most
        // recently confirmed run's spelling is the one shown.
        Map<String, String> displayNameByEmployeeId = new LinkedHashMap<>();
        for (ImportRun run : completedRunsChronological()) {
            for (RunEmployee employee : runEmployeeRepository.findByRunId(run.getId())) {
                displayNameByEmployeeId.put(employee.getIdZamestnance(), formatName(employee));
            }
        }
        return displayNameByEmployeeId.entrySet().stream()
                .map(e -> new EmployeeOption(e.getKey(), e.getValue()))
                .sorted((a, b) -> a.displayName().compareToIgnoreCase(b.displayName()))
                .toList();
    }

    public EmployeeHistoryResponse getEmployeeHistory(String idZamestnance) {
        List<EmployeeHistoryPoint> history = new ArrayList<>();
        String employeeName = null;

        for (ImportRun run : completedRunsChronological()) {
            RunEmployee employee = runEmployeeRepository.findByRunId(run.getId()).stream()
                    .filter(e -> e.getIdZamestnance().equals(idZamestnance))
                    .findFirst()
                    .orElse(null);
            if (employee == null) {
                continue;
            }
            employeeName = formatName(employee);

            List<RunTrainingCatalogEntry> catalog = runTrainingCatalogEntryRepository.findByRunId(run.getId());
            List<RunCompletedTraining> completedTrainings = runCompletedTrainingRepository.findByRunId(run.getId());
            LocalDate asOf = run.getConfirmedAt().atZone(ZoneOffset.UTC).toLocalDate();

            List<ComplianceRecord> records = trainingComplianceService.computeDetail(
                    List.of(employee), catalog, completedTrainings, asOf);

            for (ComplianceRecord record : records) {
                history.add(new EmployeeHistoryPoint(run.getId(), run.getName(), run.getConfirmedAt(),
                        record.kodSkoleni(), record.nazevSkoleni(), record.status(), record.expiryDate()));
            }
        }

        if (employeeName == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Employee not found in any completed run");
        }
        return new EmployeeHistoryResponse(idZamestnance, employeeName, history);
    }

    private List<ImportRun> completedRunsChronological() {
        return importRunRepository.findByStatusOrderByCreatedAtAsc(RunStatus.COMPLETED);
    }

    private String formatName(RunEmployee employee) {
        String jmeno = employee.getJmeno() != null ? employee.getJmeno() : "";
        String prijmeni = employee.getPrijmeni() != null ? employee.getPrijmeni() : "";
        return (jmeno + " " + prijmeni).trim();
    }
}
