package solutions.onz.muni.learning.service;

import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import solutions.onz.muni.learning.domain.DelimiterSetting;
import solutions.onz.muni.learning.domain.FileRole;
import solutions.onz.muni.learning.domain.ImportSettings;
import solutions.onz.muni.learning.repository.ImportSettingsRepository;

import java.util.EnumMap;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

class ImportSettingsServiceTest {

    private final ImportSettingsRepository repository = Mockito.mock(ImportSettingsRepository.class);
    private final ImportSettingsService service = new ImportSettingsService(repository);

    @Test
    void getSettingsCreatesDefaultAllAutoWhenNoneExists() {
        when(repository.findById("default")).thenReturn(Optional.empty());
        when(repository.save(any(ImportSettings.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ImportSettings settings = service.getSettings();

        assertThat(settings.getId()).isEqualTo("default");
        for (FileRole role : FileRole.values()) {
            assertThat(settings.getDelimiters().get(role)).isEqualTo(DelimiterSetting.AUTO);
        }
    }

    @Test
    void getSettingsReturnsExistingRowWithoutRecreatingIt() {
        ImportSettings existing = new ImportSettings();
        existing.setId("default");
        existing.setDelimiters(new EnumMap<>(Map.of(FileRole.EMPLOYEES, DelimiterSetting.SEMICOLON)));
        when(repository.findById("default")).thenReturn(Optional.of(existing));

        ImportSettings settings = service.getSettings();

        assertThat(settings.getDelimiters().get(FileRole.EMPLOYEES)).isEqualTo(DelimiterSetting.SEMICOLON);
        Mockito.verify(repository, Mockito.never()).save(any());
    }

    @Test
    void updateSettingsPersistsNewDelimiters() {
        ImportSettings existing = new ImportSettings();
        existing.setId("default");
        existing.setDelimiters(new EnumMap<>(FileRole.class));
        when(repository.findById("default")).thenReturn(Optional.of(existing));
        when(repository.save(any(ImportSettings.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ImportSettings updated = service.updateSettings(Map.of(FileRole.TIMESLOTS, DelimiterSetting.PIPE));

        assertThat(updated.getDelimiters().get(FileRole.TIMESLOTS)).isEqualTo(DelimiterSetting.PIPE);
    }
}
