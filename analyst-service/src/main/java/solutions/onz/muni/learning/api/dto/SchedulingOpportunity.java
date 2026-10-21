package solutions.onz.muni.learning.api.dto;

import solutions.onz.muni.learning.domain.ComplianceStatus;

import java.time.LocalDate;

public record SchedulingOpportunity(
        String idZamestnance,
        String employeeName,
        String kodSkoleni,
        String nazevSkoleni,
        ComplianceStatus status,
        String idTerminu,
        LocalDate datum,
        Integer kapacita,
        Integer obsazeno
) {
}
