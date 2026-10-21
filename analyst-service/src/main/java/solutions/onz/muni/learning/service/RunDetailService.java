package solutions.onz.muni.learning.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import solutions.onz.muni.learning.api.dto.EmployeeSummary;
import solutions.onz.muni.learning.api.dto.RunDetailResponse;
import solutions.onz.muni.learning.api.dto.SchedulingOpportunity;
import solutions.onz.muni.learning.api.dto.TimeslotSummary;
import solutions.onz.muni.learning.domain.ComplianceStatus;
import solutions.onz.muni.learning.domain.RunCompletedTraining;
import solutions.onz.muni.learning.domain.RunEmployee;
import solutions.onz.muni.learning.domain.RunTimeslot;
import solutions.onz.muni.learning.domain.RunTrainingCatalogEntry;
import solutions.onz.muni.learning.repository.RunCompletedTrainingRepository;
import solutions.onz.muni.learning.repository.RunEmployeeRepository;
import solutions.onz.muni.learning.repository.RunTimeslotRepository;
import solutions.onz.muni.learning.repository.RunTrainingCatalogEntryRepository;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RunDetailService {

    private static final String CANCELLED_STATUS = "zrušeno";

    private final RunService runService;
    private final RunEmployeeRepository runEmployeeRepository;
    private final RunTrainingCatalogEntryRepository runTrainingCatalogEntryRepository;
    private final RunTimeslotRepository runTimeslotRepository;
    private final RunCompletedTrainingRepository runCompletedTrainingRepository;
    private final TrainingComplianceService trainingComplianceService;

    public RunDetailResponse getDetail(String runId) {
        runService.getRun(runId);

        List<RunEmployee> employees = runEmployeeRepository.findByRunId(runId);
        List<RunTrainingCatalogEntry> catalog = runTrainingCatalogEntryRepository.findByRunId(runId);
        List<RunTimeslot> timeslots = runTimeslotRepository.findByRunId(runId);
        List<RunCompletedTraining> completedTrainings = runCompletedTrainingRepository.findByRunId(runId);

        List<ComplianceRecord> compliance = trainingComplianceService.computeDetail(
                employees, catalog, completedTrainings, LocalDate.now());
        List<SchedulingOpportunity> schedulingOpportunities = buildSchedulingOpportunities(compliance, timeslots, LocalDate.now());

        return new RunDetailResponse(
                employees.stream().map(EmployeeSummary::from).toList(),
                timeslots.stream().map(TimeslotSummary::from).toList(),
                compliance,
                schedulingOpportunities);
    }

    private List<SchedulingOpportunity> buildSchedulingOpportunities(List<ComplianceRecord> compliance,
                                                                       List<RunTimeslot> timeslots, LocalDate asOf) {
        List<SchedulingOpportunity> opportunities = new ArrayList<>();

        for (ComplianceRecord record : compliance) {
            if (record.status() == ComplianceStatus.COMPLIANT) {
                continue;
            }
            for (RunTimeslot slot : timeslots) {
                if (!matchesTrainingCode(slot, record)) {
                    continue;
                }
                if (!isUpcoming(slot, asOf)) {
                    continue;
                }
                if (isCancelled(slot)) {
                    continue;
                }
                if (!hasOpenSeats(slot)) {
                    continue;
                }
                opportunities.add(new SchedulingOpportunity(
                        record.idZamestnance(), record.employeeName(), record.kodSkoleni(), record.nazevSkoleni(),
                        record.status(), slot.getIdTerminu(), slot.getDatum(), slot.getKapacita(), slot.getObsazeno()));
            }
        }

        return opportunities;
    }

    private boolean matchesTrainingCode(RunTimeslot slot, ComplianceRecord record) {
        return slot.getKodSkoleni() != null && slot.getKodSkoleni().equalsIgnoreCase(record.kodSkoleni());
    }

    private boolean isUpcoming(RunTimeslot slot, LocalDate asOf) {
        return slot.getDatum() != null && !slot.getDatum().isBefore(asOf);
    }

    private boolean isCancelled(RunTimeslot slot) {
        return slot.getStav() != null && slot.getStav().trim().equalsIgnoreCase(CANCELLED_STATUS);
    }

    private boolean hasOpenSeats(RunTimeslot slot) {
        return slot.getKapacita() != null && slot.getObsazeno() != null && slot.getObsazeno() < slot.getKapacita();
    }
}
