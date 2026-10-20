package solutions.onz.muni.learning.api.dto;

import solutions.onz.muni.learning.domain.Counts;
import solutions.onz.muni.learning.domain.Finding;
import solutions.onz.muni.learning.domain.ImportRun;
import solutions.onz.muni.learning.domain.RunStatus;

import java.time.Instant;
import java.util.List;

public record RunResponse(
        String id,
        String name,
        RunStatus status,
        Instant createdAt,
        Instant confirmedAt,
        String createdBy,
        Counts counts,
        List<Finding> findings
) {
    public static RunResponse from(ImportRun run) {
        return new RunResponse(run.getId(), run.getName(), run.getStatus(), run.getCreatedAt(),
                run.getConfirmedAt(), run.getCreatedBy(), run.getCounts(), run.getFindings());
    }
}
