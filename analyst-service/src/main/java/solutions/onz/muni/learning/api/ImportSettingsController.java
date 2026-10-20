package solutions.onz.muni.learning.api;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import solutions.onz.muni.learning.domain.DelimiterSetting;
import solutions.onz.muni.learning.domain.FileRole;
import solutions.onz.muni.learning.service.ImportSettingsService;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/import-settings")
@RequiredArgsConstructor
public class ImportSettingsController {

    private final ImportSettingsService importSettingsService;

    @GetMapping
    public Map<FileRole, DelimiterSetting> get() {
        return importSettingsService.getSettings().getDelimiters();
    }

    @PutMapping
    public Map<FileRole, DelimiterSetting> update(@RequestBody Map<FileRole, DelimiterSetting> delimiters) {
        return importSettingsService.updateSettings(delimiters).getDelimiters();
    }
}
