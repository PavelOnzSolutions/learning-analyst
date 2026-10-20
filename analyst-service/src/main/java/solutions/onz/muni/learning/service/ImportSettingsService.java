package solutions.onz.muni.learning.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import solutions.onz.muni.learning.domain.DelimiterSetting;
import solutions.onz.muni.learning.domain.FileRole;
import solutions.onz.muni.learning.domain.ImportSettings;
import solutions.onz.muni.learning.repository.ImportSettingsRepository;

import java.util.EnumMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ImportSettingsService {

    private static final String SINGLETON_ID = "default";

    private final ImportSettingsRepository importSettingsRepository;

    public ImportSettings getSettings() {
        return importSettingsRepository.findById(SINGLETON_ID).orElseGet(this::createDefault);
    }

    public ImportSettings updateSettings(Map<FileRole, DelimiterSetting> delimiters) {
        ImportSettings settings = getSettings();
        settings.setDelimiters(new EnumMap<>(delimiters));
        return importSettingsRepository.save(settings);
    }

    private ImportSettings createDefault() {
        ImportSettings settings = new ImportSettings();
        settings.setId(SINGLETON_ID);
        Map<FileRole, DelimiterSetting> defaults = new EnumMap<>(FileRole.class);
        for (FileRole role : FileRole.values()) {
            defaults.put(role, DelimiterSetting.AUTO);
        }
        settings.setDelimiters(defaults);
        return importSettingsRepository.save(settings);
    }
}
