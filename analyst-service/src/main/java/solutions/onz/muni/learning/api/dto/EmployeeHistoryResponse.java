package solutions.onz.muni.learning.api.dto;

import java.util.List;

public record EmployeeHistoryResponse(String idZamestnance, String employeeName, List<EmployeeHistoryPoint> history) {
}
