package solutions.onz.muni.learning.service;

import org.junit.jupiter.api.Test;
import solutions.onz.muni.learning.domain.enums.ComplianceStatus;
import solutions.onz.muni.learning.domain.RunCompletedTraining;
import solutions.onz.muni.learning.domain.RunEmployee;
import solutions.onz.muni.learning.domain.RunTrainingCatalogEntry;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class TrainingComplianceServiceTest {

    private final TrainingComplianceService service = new TrainingComplianceService();
    private final LocalDate asOf = LocalDate.of(2026, 10, 18);

    private RunEmployee employee(String id, String utvar, String pozice, String stav) {
        RunEmployee employee = new RunEmployee();
        employee.setIdZamestnance(id);
        employee.setUtvar(utvar);
        employee.setPozice(pozice);
        employee.setStav(stav);
        return employee;
    }

    private RunTrainingCatalogEntry catalogEntry(String kod, Integer platnostMesicu, String povinnePro) {
        RunTrainingCatalogEntry entry = new RunTrainingCatalogEntry();
        entry.setKod(kod);
        entry.setPlatnostMesicu(platnostMesicu);
        entry.setPovinnePro(povinnePro);
        return entry;
    }

    private RunCompletedTraining completed(String employeeId, String kod, LocalDate datumAbsolvovani, LocalDate platnostDo) {
        RunCompletedTraining training = new RunCompletedTraining();
        training.setIdZamestnance(employeeId);
        training.setKodSkoleni(kod);
        training.setDatumAbsolvovani(datumAbsolvovani);
        training.setPlatnostDo(platnostDo);
        return training;
    }

    @Test
    void nepovinneTrainingIsExcludedEntirely() {
        RunEmployee employee = employee("E1", "Any", "Any", "aktivní");
        RunTrainingCatalogEntry entry = catalogEntry("ANGL", null, "NEPOVINNE");

        ComplianceSummary summary = service.summarize(List.of(employee), List.of(entry), List.of(), asOf);

        assertThat(summary.compliantCount() + summary.expiringSoonCount() + summary.overdueCount()).isZero();
    }

    @Test
    void terminatedEmployeeIsExcludedEntirely() {
        RunEmployee employee = employee("E1", "Any", "Any", "ukončen");
        RunTrainingCatalogEntry entry = catalogEntry("BOZP-Z", 24, "VSICHNI");

        ComplianceSummary summary = service.summarize(List.of(employee), List.of(entry), List.of(), asOf);

        assertThat(summary.compliantCount() + summary.expiringSoonCount() + summary.overdueCount()).isZero();
    }

    @Test
    void neverCompletedIsOverdue() {
        RunEmployee employee = employee("E1", "Any", "Any", "aktivní");
        RunTrainingCatalogEntry entry = catalogEntry("BOZP-Z", 24, "VSICHNI");

        ComplianceStatus status = service.classify(employee, entry, List.of(), asOf);

        assertThat(status).isEqualTo(ComplianceStatus.OVERDUE);
    }

    @Test
    void neverExpiringTrainingIsCompliantOnceCompleted() {
        RunEmployee employee = employee("E1", "Any", "Any", "aktivní");
        RunTrainingCatalogEntry entry = catalogEntry("LEAD", null, "POZICE:Vedoucí");
        RunCompletedTraining training = completed("E1", "LEAD", LocalDate.of(2019, 1, 24), null);

        ComplianceStatus status = service.classify(employee, entry, List.of(training), asOf);

        assertThat(status).isEqualTo(ComplianceStatus.COMPLIANT);
    }

    @Test
    void zeroValidityMonthsTrainingIsCompliantOnceCompleted() {
        RunEmployee employee = employee("E1", "Any", "Any", "aktivní");
        RunTrainingCatalogEntry entry = catalogEntry("LEAD", 0, "POZICE:Vedoucí");
        RunCompletedTraining training = completed("E1", "LEAD", LocalDate.of(2019, 1, 24), null);

        ComplianceStatus status = service.classify(employee, entry, List.of(training), asOf);

        assertThat(status).isEqualTo(ComplianceStatus.COMPLIANT);
    }

    @Test
    void expiringWithinSixtyDaysIsExpiringSoon() {
        RunEmployee employee = employee("E1", "Any", "Any", "aktivní");
        RunTrainingCatalogEntry entry = catalogEntry("GDPR", 36, "VSICHNI");
        RunCompletedTraining training = completed("E1", "GDPR", null, asOf.plusDays(30));

        ComplianceStatus status = service.classify(employee, entry, List.of(training), asOf);

        assertThat(status).isEqualTo(ComplianceStatus.EXPIRING_SOON);
    }

    @Test
    void expiringMoreThanSixtyDaysOutIsCompliant() {
        RunEmployee employee = employee("E1", "Any", "Any", "aktivní");
        RunTrainingCatalogEntry entry = catalogEntry("GDPR", 36, "VSICHNI");
        RunCompletedTraining training = completed("E1", "GDPR", null, asOf.plusDays(61));

        ComplianceStatus status = service.classify(employee, entry, List.of(training), asOf);

        assertThat(status).isEqualTo(ComplianceStatus.COMPLIANT);
    }

    @Test
    void utvarRuleOnlyAppliesToMatchingDepartment() {
        RunEmployee matching = employee("E1", "Laboratoře", "Laborant", "aktivní");
        RunEmployee notMatching = employee("E2", "Ekonomické oddělení", "Účetní", "aktivní");
        RunTrainingCatalogEntry entry = catalogEntry("LAB-BEZ", 24, "UTVAR:Laboratoře");

        ComplianceSummary summary = service.summarize(List.of(matching, notMatching), List.of(entry), List.of(), asOf);

        assertThat(summary.overdueCount()).isEqualTo(1);
    }

    @Test
    void computeDetailIncludesExpiryDateAndAppliesSameExclusionsAsSummarize() {
        RunEmployee active = employee("E1", "Laboratoře", "Laborant", "aktivní");
        RunEmployee terminated = employee("E2", "Laboratoře", "Laborant", "ukončen");
        RunTrainingCatalogEntry mandatory = catalogEntry("BOZP-Z", 24, "VSICHNI");
        RunTrainingCatalogEntry optional = catalogEntry("ANGL", null, "NEPOVINNE");
        RunCompletedTraining completion = completed("E1", "BOZP-Z", LocalDate.of(2025, 1, 1), LocalDate.of(2027, 1, 1));

        List<ComplianceRecord> records = service.computeDetail(
                List.of(active, terminated), List.of(mandatory, optional), List.of(completion), asOf);

        assertThat(records).hasSize(1);
        ComplianceRecord record = records.get(0);
        assertThat(record.idZamestnance()).isEqualTo("E1");
        assertThat(record.kodSkoleni()).isEqualTo("BOZP-Z");
        assertThat(record.status()).isEqualTo(ComplianceStatus.COMPLIANT);
        assertThat(record.expiryDate()).isEqualTo(LocalDate.of(2027, 1, 1));
    }

    @Test
    void computeDetailExpiryDateIsNullWhenTrainingNeverExpiresOrWasNeverCompleted() {
        RunEmployee employee = employee("E1", "Any", "Vedoucí", "aktivní");
        RunTrainingCatalogEntry neverExpires = catalogEntry("LEAD", null, "POZICE:Vedoucí");
        RunTrainingCatalogEntry neverCompleted = catalogEntry("GDPR", 36, "VSICHNI");
        RunCompletedTraining completion = completed("E1", "LEAD", LocalDate.of(2019, 1, 24), null);

        List<ComplianceRecord> records = service.computeDetail(
                List.of(employee), List.of(neverExpires, neverCompleted), List.of(completion), asOf);

        ComplianceRecord neverExpiresRecord = records.stream().filter(r -> r.kodSkoleni().equals("LEAD")).findFirst().orElseThrow();
        assertThat(neverExpiresRecord.status()).isEqualTo(ComplianceStatus.COMPLIANT);
        assertThat(neverExpiresRecord.expiryDate()).isNull();

        ComplianceRecord neverCompletedRecord = records.stream().filter(r -> r.kodSkoleni().equals("GDPR")).findFirst().orElseThrow();
        assertThat(neverCompletedRecord.status()).isEqualTo(ComplianceStatus.OVERDUE);
        assertThat(neverCompletedRecord.expiryDate()).isNull();
    }

    @Test
    void summarizeStillProducesTheSameCountsAfterTheComputeDetailRefactor() {
        RunEmployee employee = employee("E1", "Laboratoře", "Laborant", "aktivní");
        RunTrainingCatalogEntry entry = catalogEntry("LAB-BEZ", 24, "UTVAR:Laboratoře");

        ComplianceSummary summary = service.summarize(List.of(employee), List.of(entry), List.of(), asOf);

        assertThat(summary.overdueCount()).isEqualTo(1);
        assertThat(summary.compliantCount()).isZero();
        assertThat(summary.expiringSoonCount()).isZero();
    }
}
