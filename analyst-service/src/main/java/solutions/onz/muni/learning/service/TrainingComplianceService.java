package solutions.onz.muni.learning.service;

import org.springframework.stereotype.Service;
import solutions.onz.muni.learning.domain.enums.ComplianceStatus;
import solutions.onz.muni.learning.domain.RunCompletedTraining;
import solutions.onz.muni.learning.domain.RunEmployee;
import solutions.onz.muni.learning.domain.RunTrainingCatalogEntry;
import solutions.onz.muni.learning.service.analysis.PovinneProRule;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
public class TrainingComplianceService {

    private static final int EXPIRING_SOON_DAYS = 60;
    private static final String TERMINATED_STATUS = "ukončen";

    public ComplianceSummary summarize(List<RunEmployee> employees, List<RunTrainingCatalogEntry> catalog,
                                        List<RunCompletedTraining> completedTrainings, LocalDate asOf) {
        List<ComplianceRecord> records = computeDetail(employees, catalog, completedTrainings, asOf);
        long compliant = records.stream().filter(r -> r.status() == ComplianceStatus.COMPLIANT).count();
        long expiring = records.stream().filter(r -> r.status() == ComplianceStatus.EXPIRING_SOON).count();
        long overdue = records.stream().filter(r -> r.status() == ComplianceStatus.OVERDUE).count();
        return new ComplianceSummary(compliant, expiring, overdue);
    }

    public List<ComplianceRecord> computeDetail(List<RunEmployee> employees, List<RunTrainingCatalogEntry> catalog,
                                                 List<RunCompletedTraining> completedTrainings, LocalDate asOf) {
        List<ComplianceRecord> records = new ArrayList<>();

        for (RunEmployee employee : employees) {
            if (isTerminated(employee)) {
                continue;
            }
            for (RunTrainingCatalogEntry entry : catalog) {
                PovinneProRule rule = PovinneProRule.parse(entry.getPovinnePro());
                if (rule.type() == PovinneProRule.Type.NEPOVINNE) {
                    continue;
                }
                if (!rule.matches(employee.getUtvar(), employee.getPozice())) {
                    continue;
                }
                ComplianceStatus status = classify(employee, entry, completedTrainings, asOf);
                LocalDate expiryDate = resolveExpiryForDisplay(employee, entry, completedTrainings);
                BigDecimal costKc = resolveCostForDisplay(employee, entry, completedTrainings);
                records.add(new ComplianceRecord(
                        employee.getIdZamestnance(), formatName(employee), employee.getUtvar(), employee.getPozice(),
                        entry.getKod(), entry.getNazev(), status, expiryDate, costKc));
            }
        }

        return records;
    }

    ComplianceStatus classify(RunEmployee employee, RunTrainingCatalogEntry entry,
                               List<RunCompletedTraining> completedTrainings, LocalDate asOf) {
        RunCompletedTraining mostRecent = findMostRecentCompletion(employee, entry, completedTrainings);

        if (mostRecent == null) {
            return ComplianceStatus.OVERDUE;
        }

        LocalDate expiry;
        if (mostRecent.getPlatnostDo() != null) {
            expiry = mostRecent.getPlatnostDo();
        } else if (entry.getPlatnostMesicu() == null || entry.getPlatnostMesicu() == 0) {
            return ComplianceStatus.COMPLIANT;
        } else if (mostRecent.getDatumAbsolvovani() != null) {
            expiry = mostRecent.getDatumAbsolvovani().plusMonths(entry.getPlatnostMesicu());
        } else {
            return ComplianceStatus.OVERDUE;
        }

        if (expiry.isBefore(asOf)) {
            return ComplianceStatus.OVERDUE;
        }
        if (!expiry.isAfter(asOf.plusDays(EXPIRING_SOON_DAYS))) {
            return ComplianceStatus.EXPIRING_SOON;
        }
        return ComplianceStatus.COMPLIANT;
    }

    private LocalDate resolveExpiryForDisplay(RunEmployee employee, RunTrainingCatalogEntry entry,
                                               List<RunCompletedTraining> completedTrainings) {
        RunCompletedTraining mostRecent = findMostRecentCompletion(employee, entry, completedTrainings);
        if (mostRecent == null) {
            return null;
        }
        if (mostRecent.getPlatnostDo() != null) {
            return mostRecent.getPlatnostDo();
        }
        if (entry.getPlatnostMesicu() == null || entry.getPlatnostMesicu() == 0) {
            return null;
        }
        if (mostRecent.getDatumAbsolvovani() != null) {
            return mostRecent.getDatumAbsolvovani().plusMonths(entry.getPlatnostMesicu());
        }
        return null;
    }

    private BigDecimal resolveCostForDisplay(RunEmployee employee, RunTrainingCatalogEntry entry,
                                              List<RunCompletedTraining> completedTrainings) {
        RunCompletedTraining mostRecent = findMostRecentCompletion(employee, entry, completedTrainings);
        return mostRecent == null ? null : mostRecent.getCenaKc();
    }

    private RunCompletedTraining findMostRecentCompletion(RunEmployee employee, RunTrainingCatalogEntry entry,
                                                            List<RunCompletedTraining> completedTrainings) {
        return completedTrainings.stream()
                .filter(t -> employee.getIdZamestnance().equals(t.getIdZamestnance())
                        && entry.getKod().equalsIgnoreCase(t.getKodSkoleni()))
                .max(Comparator.comparing(RunCompletedTraining::getDatumAbsolvovani,
                        Comparator.nullsFirst(Comparator.naturalOrder())))
                .orElse(null);
    }

    private String formatName(RunEmployee employee) {
        String jmeno = employee.getJmeno() != null ? employee.getJmeno() : "";
        String prijmeni = employee.getPrijmeni() != null ? employee.getPrijmeni() : "";
        return (jmeno + " " + prijmeni).trim();
    }

    private boolean isTerminated(RunEmployee employee) {
        return employee.getStav() != null && employee.getStav().trim().equalsIgnoreCase(TERMINATED_STATUS);
    }
}
