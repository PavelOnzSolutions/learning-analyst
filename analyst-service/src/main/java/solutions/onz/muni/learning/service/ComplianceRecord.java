package solutions.onz.muni.learning.service;

import solutions.onz.muni.learning.domain.enums.ComplianceStatus;

import java.time.LocalDate;

public record ComplianceRecord(
        String idZamestnance,
        String employeeName,
        String utvar,
        String pozice,
        String kodSkoleni,
        String nazevSkoleni,
        ComplianceStatus status,
        LocalDate expiryDate
) {
}
