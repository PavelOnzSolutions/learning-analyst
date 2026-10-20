package solutions.onz.muni.learning.service.analysis;

import org.junit.jupiter.api.Test;
import solutions.onz.muni.learning.domain.FindingSeverity;
import solutions.onz.muni.learning.domain.RunTimeslot;
import solutions.onz.muni.learning.service.csv.SanitizationService;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class TimeslotAnalyzerTest {

    private final TimeslotAnalyzer analyzer = new TimeslotAnalyzer(new SanitizationService());
    private final Set<String> validCodes = Set.of("KYBER", "BOZP-Z");

    private Map<String, String> validRow() {
        Map<String, String> row = new LinkedHashMap<>();
        row.put("id_terminu", "T001");
        row.put("kod_skoleni", "KYBER");
        row.put("datum", "2026-10-14");
        row.put("cas", "09:00-12:00");
        row.put("misto", "Aula A");
        row.put("kapacita", "25");
        row.put("obsazeno", "22");
        row.put("cena_na_osobu", "800");
        row.put("stav", "plánováno");
        return row;
    }

    @Test
    void validRowProducesNoFindings() {
        AnalysisResult<RunTimeslot> result = analyzer.analyze(List.of(validRow()), validCodes);

        assertThat(result.findings()).isEmpty();
        RunTimeslot slot = result.rows().get(0);
        assertThat(slot.getDatum()).isEqualTo(LocalDate.of(2026, 10, 14));
        assertThat(slot.getCenaNaOsobu()).isEqualTo(new BigDecimal("800"));
    }

    @Test
    void duplicateIdTerminuIsDroppedWithWarning() {
        Map<String, String> row = validRow();

        AnalysisResult<RunTimeslot> result = analyzer.analyze(List.of(row, row), validCodes);

        assertThat(result.rows()).hasSize(1);
        assertThat(result.findings()).hasSize(1);
        assertThat(result.findings().get(0).severity()).isEqualTo(FindingSeverity.WARNING);
    }

    @Test
    void unknownTrainingCodeIsErrorButRowIsKept() {
        Map<String, String> row = validRow();
        row.put("kod_skoleni", "KYB3R");

        AnalysisResult<RunTimeslot> result = analyzer.analyze(List.of(row), validCodes);

        assertThat(result.rows()).hasSize(1);
        assertThat(result.findings()).hasSize(1);
        assertThat(result.findings().get(0).severity()).isEqualTo(FindingSeverity.ERROR);
    }

    @Test
    void caseMismatchedTrainingCodeIsWarningOnly() {
        Map<String, String> row = validRow();
        row.put("kod_skoleni", "kyber");

        AnalysisResult<RunTimeslot> result = analyzer.analyze(List.of(row), validCodes);

        assertThat(result.findings()).hasSize(1);
        assertThat(result.findings().get(0).severity()).isEqualTo(FindingSeverity.WARNING);
    }

    @Test
    void overbookedSlotProducesWarning() {
        Map<String, String> row = validRow();
        row.put("kapacita", "30");
        row.put("obsazeno", "31");

        AnalysisResult<RunTimeslot> result = analyzer.analyze(List.of(row), validCodes);

        assertThat(result.findings()).hasSize(1);
        assertThat(result.findings().get(0).field()).isEqualTo("obsazeno");
    }

    @Test
    void zeroCapacityOnNonCancelledSlotProducesWarning() {
        Map<String, String> row = validRow();
        row.put("kapacita", "0");
        row.put("stav", "plánováno");

        AnalysisResult<RunTimeslot> result = analyzer.analyze(List.of(row), validCodes);

        assertThat(result.findings()).hasSize(1);
        assertThat(result.findings().get(0).field()).isEqualTo("kapacita");
    }

    @Test
    void zeroCapacityOnCancelledSlotProducesNoWarning() {
        Map<String, String> row = validRow();
        row.put("kapacita", "0");
        row.put("stav", "zrušeno");

        AnalysisResult<RunTimeslot> result = analyzer.analyze(List.of(row), validCodes);

        assertThat(result.findings()).isEmpty();
    }
}
