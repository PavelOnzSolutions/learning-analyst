package solutions.onz.muni.learning.api.dto;

import solutions.onz.muni.learning.service.ComplianceRecord;

import java.util.List;

public record RunDetailResponse(
        List<EmployeeSummary> employees,
        List<TimeslotSummary> timeslots,
        List<ComplianceRecord> compliance,
        List<SchedulingOpportunity> schedulingOpportunities
) {
}
