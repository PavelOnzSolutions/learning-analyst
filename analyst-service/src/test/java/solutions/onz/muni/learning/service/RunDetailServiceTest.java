package solutions.onz.muni.learning.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import solutions.onz.muni.learning.api.dto.RunDetailResponse;
import solutions.onz.muni.learning.api.dto.SchedulingOpportunity;
import solutions.onz.muni.learning.domain.enums.ComplianceStatus;
import solutions.onz.muni.learning.domain.ImportRun;
import solutions.onz.muni.learning.domain.RunCompletedTraining;
import solutions.onz.muni.learning.domain.RunEmployee;
import solutions.onz.muni.learning.domain.RunTimeslot;
import solutions.onz.muni.learning.domain.RunTrainingCatalogEntry;
import solutions.onz.muni.learning.repository.RunCompletedTrainingRepository;
import solutions.onz.muni.learning.repository.RunEmployeeRepository;
import solutions.onz.muni.learning.repository.RunTimeslotRepository;
import solutions.onz.muni.learning.repository.RunTrainingCatalogEntryRepository;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

class RunDetailServiceTest {

    private final RunService runService = Mockito.mock(RunService.class);
    private final RunEmployeeRepository runEmployeeRepository = Mockito.mock(RunEmployeeRepository.class);
    private final RunTrainingCatalogEntryRepository runTrainingCatalogEntryRepository = Mockito.mock(RunTrainingCatalogEntryRepository.class);
    private final RunTimeslotRepository runTimeslotRepository = Mockito.mock(RunTimeslotRepository.class);
    private final RunCompletedTrainingRepository runCompletedTrainingRepository = Mockito.mock(RunCompletedTrainingRepository.class);
    private final TrainingComplianceService trainingComplianceService = new TrainingComplianceService();

    private final RunDetailService runDetailService = new RunDetailService(
            runService, runEmployeeRepository, runTrainingCatalogEntryRepository,
            runTimeslotRepository, runCompletedTrainingRepository, trainingComplianceService);

    private RunEmployee employee(String id, String utvar, String pozice) {
        RunEmployee employee = new RunEmployee();
        employee.setIdZamestnance(id);
        employee.setJmeno("Test");
        employee.setPrijmeni("Employee");
        employee.setUtvar(utvar);
        employee.setPozice(pozice);
        employee.setStav("aktivní");
        return employee;
    }

    private RunTrainingCatalogEntry catalogEntry(String kod, Integer platnostMesicu, String povinnePro) {
        RunTrainingCatalogEntry entry = new RunTrainingCatalogEntry();
        entry.setKod(kod);
        entry.setNazev("Training " + kod);
        entry.setPlatnostMesicu(platnostMesicu);
        entry.setPovinnePro(povinnePro);
        return entry;
    }

    private RunTimeslot timeslot(String id, String kodSkoleni, LocalDate datum, int kapacita, int obsazeno, String stav) {
        RunTimeslot timeslot = new RunTimeslot();
        timeslot.setIdTerminu(id);
        timeslot.setKodSkoleni(kodSkoleni);
        timeslot.setDatum(datum);
        timeslot.setKapacita(kapacita);
        timeslot.setObsazeno(obsazeno);
        timeslot.setStav(stav);
        return timeslot;
    }

    @BeforeEach
    void setUp() {
        ImportRun run = new ImportRun();
        run.setId("r1");
        when(runService.getRun("r1")).thenReturn(run);
    }

    @Test
    void getDetailThrowsWhenRunIsMissing() {
        when(runService.getRun("missing")).thenThrow(
                new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.NOT_FOUND));

        assertThatThrownBy(() -> runDetailService.getDetail("missing"))
                .isInstanceOf(org.springframework.web.server.ResponseStatusException.class);
    }

    @Test
    void getDetailReturnsEmployeesAndTimeslotsMappedFromRepositories() {
        when(runEmployeeRepository.findByRunId("r1")).thenReturn(List.of(employee("E1", "Lab", "Tech")));
        when(runTrainingCatalogEntryRepository.findByRunId("r1")).thenReturn(List.of());
        when(runTimeslotRepository.findByRunId("r1")).thenReturn(List.of(timeslot("T1", "BOZP-Z", LocalDate.now().plusDays(5), 10, 5, "plánováno")));
        when(runCompletedTrainingRepository.findByRunId("r1")).thenReturn(List.of());

        RunDetailResponse detail = runDetailService.getDetail("r1");

        assertThat(detail.employees()).hasSize(1);
        assertThat(detail.employees().get(0).idZamestnance()).isEqualTo("E1");
        assertThat(detail.timeslots()).hasSize(1);
        assertThat(detail.timeslots().get(0).idTerminu()).isEqualTo("T1");
    }

    @Test
    void getDetailBuildsSchedulingOpportunitiesForOverdueEmployeesWithOpenUpcomingSeats() {
        when(runEmployeeRepository.findByRunId("r1")).thenReturn(List.of(employee("E1", "Lab", "Tech")));
        when(runTrainingCatalogEntryRepository.findByRunId("r1")).thenReturn(List.of(catalogEntry("BOZP-Z", 24, "VSICHNI")));
        when(runTimeslotRepository.findByRunId("r1")).thenReturn(List.of(
                timeslot("T1", "BOZP-Z", LocalDate.now().plusDays(5), 10, 5, "plánováno"),   // open seats, upcoming -> match
                timeslot("T2", "BOZP-Z", LocalDate.now().minusDays(5), 10, 5, "plánováno"),  // in the past -> no match
                timeslot("T3", "BOZP-Z", LocalDate.now().plusDays(5), 10, 10, "plánováno"),  // full -> no match
                timeslot("T4", "BOZP-Z", LocalDate.now().plusDays(5), 10, 5, "zrušeno"),     // cancelled -> no match
                timeslot("T5", "OTHER", LocalDate.now().plusDays(5), 10, 5, "plánováno")));  // wrong training -> no match
        when(runCompletedTrainingRepository.findByRunId("r1")).thenReturn(List.of());

        RunDetailResponse detail = runDetailService.getDetail("r1");

        assertThat(detail.compliance()).hasSize(1);
        assertThat(detail.compliance().get(0).status()).isEqualTo(ComplianceStatus.OVERDUE);

        assertThat(detail.schedulingOpportunities()).hasSize(1);
        SchedulingOpportunity opportunity = detail.schedulingOpportunities().get(0);
        assertThat(opportunity.idZamestnance()).isEqualTo("E1");
        assertThat(opportunity.idTerminu()).isEqualTo("T1");
        assertThat(opportunity.status()).isEqualTo(ComplianceStatus.OVERDUE);
    }

    @Test
    void getDetailExcludesCompliantEmployeesFromSchedulingOpportunitiesEvenWithOpenSeats() {
        when(runEmployeeRepository.findByRunId("r1")).thenReturn(List.of(employee("E1", "Any", "Any")));
        when(runTrainingCatalogEntryRepository.findByRunId("r1")).thenReturn(List.of(catalogEntry("LEAD", null, "POZICE:Any")));
        when(runTimeslotRepository.findByRunId("r1")).thenReturn(List.of(timeslot("T1", "LEAD", LocalDate.now().plusDays(5), 10, 5, "plánováno")));
        RunCompletedTraining completion = new RunCompletedTraining();
        completion.setIdZamestnance("E1");
        completion.setKodSkoleni("LEAD");
        completion.setDatumAbsolvovani(LocalDate.now().minusYears(1));
        when(runCompletedTrainingRepository.findByRunId("r1")).thenReturn(List.of(completion));

        RunDetailResponse detail = runDetailService.getDetail("r1");

        assertThat(detail.compliance().get(0).status()).isEqualTo(ComplianceStatus.COMPLIANT);
        assertThat(detail.schedulingOpportunities()).isEmpty();
    }
}
