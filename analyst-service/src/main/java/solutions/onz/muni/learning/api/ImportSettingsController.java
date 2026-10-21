package solutions.onz.muni.learning.api;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import solutions.onz.muni.learning.domain.enums.DelimiterSetting;
import solutions.onz.muni.learning.domain.enums.FileRole;
import solutions.onz.muni.learning.service.ImportSettingsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/import-settings")
@Tag(name = "Import Settings", description = "Admin-only per-file-role CSV delimiter configuration")
@RequiredArgsConstructor
public class ImportSettingsController {

    private final ImportSettingsService importSettingsService;

    @Operation(summary = "Get import settings", description = "Returns the current CSV delimiter setting for each of the 4 import file roles")
    @ApiResponse(responseCode = "200", description = "Settings returned")
    @GetMapping
    public Map<FileRole, DelimiterSetting> get() {
        return importSettingsService.getSettings().getDelimiters();
    }

    @Operation(summary = "Update import settings", description = "Replaces the CSV delimiter setting for each of the 4 import file roles")
    @ApiResponse(responseCode = "200", description = "Settings updated")
    @PutMapping
    public Map<FileRole, DelimiterSetting> update(@RequestBody Map<FileRole, DelimiterSetting> delimiters) {
        return importSettingsService.updateSettings(delimiters).getDelimiters();
    }
}
