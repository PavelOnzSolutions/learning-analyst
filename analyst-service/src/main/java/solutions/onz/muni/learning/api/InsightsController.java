package solutions.onz.muni.learning.api;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import solutions.onz.muni.learning.api.dto.EmployeeHistoryResponse;
import solutions.onz.muni.learning.api.dto.EmployeeOption;
import solutions.onz.muni.learning.api.dto.InsightsOverviewResponse;
import solutions.onz.muni.learning.service.InsightsService;

import java.util.List;

@RestController
@RequestMapping("/api/v1/insights")
@Tag(name = "Insights", description = "Cross-run compliance and capacity trends built from completed import runs")
@RequiredArgsConstructor
public class InsightsController {

    private final InsightsService insightsService;

    @Operation(summary = "Get run-level trends", description = "Returns one trend point per completed run (compliance counts, headcount, error/warning counts), in chronological order")
    @ApiResponse(responseCode = "200", description = "Trends returned")
    @GetMapping("/overview")
    public InsightsOverviewResponse overview() {
        return insightsService.getOverview();
    }

    @Operation(summary = "List known employees", description = "Returns every employee who has appeared in at least one completed run, for the employee-history picker")
    @ApiResponse(responseCode = "200", description = "Employees returned")
    @GetMapping("/employees")
    public List<EmployeeOption> employees() {
        return insightsService.listEmployees();
    }

    @Operation(summary = "Get employee compliance history", description = "Returns one entry per (run, training) the employee had a compliance record for, across every completed run, each evaluated as of that run's own confirmation date")
    @ApiResponse(responseCode = "200", description = "History returned")
    @ApiResponse(responseCode = "404", description = "Employee not found in any completed run")
    @GetMapping("/employees/{idZamestnance}/history")
    public EmployeeHistoryResponse employeeHistory(@PathVariable String idZamestnance) {
        return insightsService.getEmployeeHistory(idZamestnance);
    }
}
