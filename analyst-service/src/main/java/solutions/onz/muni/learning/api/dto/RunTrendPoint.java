package solutions.onz.muni.learning.api.dto;

import solutions.onz.muni.learning.domain.Counts;
import solutions.onz.muni.learning.domain.ImportRun;

import java.time.Instant;

public record RunTrendPoint(
        String runId,
        String runName,
        Instant confirmedAt,
        int employees,
        long compliantCount,
        long expiringSoonCount,
        long overdueCount,
        long errorCount,
        long warningCount
) {
    public static RunTrendPoint from(ImportRun run) {
        Counts counts = run.getCounts();
        return new RunTrendPoint(run.getId(), run.getName(), run.getConfirmedAt(),
                counts.employees(), counts.compliantCount(), counts.expiringSoonCount(), counts.overdueCount(),
                counts.errorCount(), counts.warningCount());
    }
}
