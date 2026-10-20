package solutions.onz.muni.learning.service;

import org.springframework.stereotype.Service;
import solutions.onz.muni.learning.domain.ComplianceStatus;
import solutions.onz.muni.learning.domain.RunCompletedTraining;
import solutions.onz.muni.learning.domain.RunEmployee;
import solutions.onz.muni.learning.domain.RunTrainingCatalogEntry;
import solutions.onz.muni.learning.service.analysis.PovinneProRule;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;

@Service
public class TrainingComplianceService {

    private static final int EXPIRING_SOON_DAYS = 60;
    private static final String TERMINATED_STATUS = "ukončen";

    public ComplianceSummary summarize(List<RunEmployee> employees, List<RunTrainingCatalogEntry> catalog,
                                        List<RunCompletedTraining> completedTrainings, LocalDate asOf) {
        long compliant = 0;
        long expiring = 0;
        long overdue = 0;

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
                switch (classify(employee, entry, completedTrainings, asOf)) {
                    case COMPLIANT -> compliant++;
                    case EXPIRING_SOON -> expiring++;
                    case OVERDUE -> overdue++;
                }
            }
        }

        return new ComplianceSummary(compliant, expiring, overdue);
    }

    ComplianceStatus classify(RunEmployee employee, RunTrainingCatalogEntry entry,
                               List<RunCompletedTraining> completedTrainings, LocalDate asOf) {
        RunCompletedTraining mostRecent = completedTrainings.stream()
                .filter(t -> employee.getIdZamestnance().equals(t.getIdZamestnance())
                        && entry.getKod().equalsIgnoreCase(t.getKodSkoleni()))
                .max(Comparator.comparing(RunCompletedTraining::getDatumAbsolvovani,
                        Comparator.nullsFirst(Comparator.naturalOrder())))
                .orElse(null);

        if (mostRecent == null) {
            return ComplianceStatus.OVERDUE;
        }

        LocalDate expiry;
        if (mostRecent.getPlatnostDo() != null) {
            expiry = mostRecent.getPlatnostDo();
        } else if (entry.getPlatnostMesicu() == null) {
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

    private boolean isTerminated(RunEmployee employee) {
        return employee.getStav() != null && employee.getStav().trim().equalsIgnoreCase(TERMINATED_STATUS);
    }
}
