package solutions.onz.muni.learning.api.dto;

import solutions.onz.muni.learning.domain.enums.ComplianceStatus;

import java.time.Instant;
import java.time.LocalDate;

public record EmployeeHistoryPoint(
        String runId,
        String runName,
        Instant confirmedAt,
        String kodSkoleni,
        String nazevSkoleni,
        ComplianceStatus status,
        LocalDate expiryDate
) {
}
