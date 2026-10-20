package solutions.onz.muni.learning.api;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import solutions.onz.muni.learning.api.dto.RunResponse;
import solutions.onz.muni.learning.domain.ImportRun;
import solutions.onz.muni.learning.domain.RunStatus;
import solutions.onz.muni.learning.service.RunService;

@RestController
@RequestMapping("/api/v1/runs")
@Tag(name = "Runs", description = "CSV import run lifecycle: create, review, confirm, or reject")
@RequiredArgsConstructor
public class RunController {

    private final RunService runService;

    @Operation(summary = "Create import run", description = "Uploads and analyzes the 4 CSV files (employees, training catalog, timeslots, completed trainings) and persists the result as a run awaiting review")
    @ApiResponse(responseCode = "201", description = "Run created and analyzed")
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<RunResponse> create(
            @RequestParam("name") String name,
            @RequestParam("employees") MultipartFile employees,
            @RequestParam("trainingCatalog") MultipartFile trainingCatalog,
            @RequestParam("timeslots") MultipartFile timeslots,
            @RequestParam("completedTrainings") MultipartFile completedTrainings,
            Authentication authentication) {
        ImportRun run = runService.createRun(name, employees, trainingCatalog, timeslots, completedTrainings,
                authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(RunResponse.from(run));
    }

    @Operation(summary = "List import runs", description = "Returns a paginated list of import runs, optionally filtered by status")
    @ApiResponse(responseCode = "200", description = "Runs returned")
    @GetMapping
    public Page<RunResponse> list(@RequestParam(required = false) RunStatus status, Pageable pageable) {
        return runService.listRuns(status, pageable).map(RunResponse::from);
    }

    @Operation(summary = "Get import run", description = "Returns a single import run by id")
    @ApiResponse(responseCode = "200", description = "Run returned")
    @ApiResponse(responseCode = "404", description = "Run not found")
    @GetMapping("/{id}")
    public RunResponse get(@PathVariable String id) {
        return RunResponse.from(runService.getRun(id));
    }

    @Operation(summary = "Confirm import run", description = "Finalizes a run that is pending review and has no remaining ERROR findings, marking it COMPLETED")
    @ApiResponse(responseCode = "200", description = "Run confirmed")
    @ApiResponse(responseCode = "404", description = "Run not found")
    @ApiResponse(responseCode = "409", description = "Run is not pending review, or has unresolved errors")
    @PostMapping("/{id}/confirm")
    public RunResponse confirm(@PathVariable String id) {
        return RunResponse.from(runService.confirmRun(id));
    }

    @Operation(summary = "Reject import run", description = "Deletes a run that is pending review, along with all of its parsed row data")
    @ApiResponse(responseCode = "204", description = "Run rejected and deleted")
    @ApiResponse(responseCode = "404", description = "Run not found")
    @ApiResponse(responseCode = "409", description = "Run is not pending review")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> reject(@PathVariable String id) {
        runService.rejectRun(id);
        return ResponseEntity.noContent().build();
    }
}
