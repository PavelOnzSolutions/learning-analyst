package solutions.onz.muni.learning.service.analysis;

import org.junit.jupiter.api.Test;
import solutions.onz.muni.learning.domain.FindingSeverity;
import solutions.onz.muni.learning.domain.RunCompletedTraining;
import solutions.onz.muni.learning.service.csv.SanitizationService;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class CompletedTrainingAnalyzerTest {

    private final CompletedTrainingAnalyzer analyzer = new CompletedTrainingAnalyzer(new SanitizationService());
    private final Set<String> validCodes = Set.of("BOZP-Z", "GDPR");
    private final Set<String> validEmployeeIds = Set.of("E0131", "E0149");

    private Map<String, String> validRow() {
        Map<String, String> row = new LinkedHashMap<>();
        row.put("id_zaznamu", "Z000001");
        row.put("id_zamestnance", "E0131");
        row.put("zamestnanec", "Vacková Hana");
        row.put("kod_skoleni", "BOZP-Z");
        row.put("datum_absolvovani", "2019-01-06");
        row.put("platnost_do", "2021-01-06");
        row.put("poskytovatel", "Interní školitel");
        row.put("cena_kc", "450");
        row.put("poznamka", "");
        return row;
    }

    @Test
    void validRowProducesNoFindings() {
        AnalysisResult<RunCompletedTraining> result = analyzer.analyze(List.of(validRow()), validCodes, validEmployeeIds);

        assertThat(result.findings()).isEmpty();
        RunCompletedTraining training = result.rows().get(0);
        assertThat(training.getDatumAbsolvovani()).isEqualTo(LocalDate.of(2019, 1, 6));
        assertThat(training.getCenaKc()).isEqualTo(new BigDecimal("450"));
    }

    @Test
    void duplicateIdZaznamuIsDroppedWithWarning() {
        Map<String, String> row = validRow();

        AnalysisResult<RunCompletedTraining> result = analyzer.analyze(List.of(row, row), validCodes, validEmployeeIds);

        assertThat(result.rows()).hasSize(1);
        assertThat(result.findings()).hasSize(1);
        assertThat(result.findings().get(0).severity()).isEqualTo(FindingSeverity.WARNING);
    }

    @Test
    void unknownEmployeeIdIsErrorButRowIsKept() {
        Map<String, String> row = validRow();
        row.put("id_zamestnance", "E9999");

        AnalysisResult<RunCompletedTraining> result = analyzer.analyze(List.of(row), validCodes, validEmployeeIds);

        assertThat(result.rows()).hasSize(1);
        assertThat(result.findings()).hasSize(1);
        assertThat(result.findings().get(0).severity()).isEqualTo(FindingSeverity.ERROR);
        assertThat(result.findings().get(0).field()).isEqualTo("id_zamestnance");
    }

    @Test
    void unknownTrainingCodeIsErrorButRowIsKept() {
        Map<String, String> row = validRow();
        row.put("kod_skoleni", "UNKNOWN");

        AnalysisResult<RunCompletedTraining> result = analyzer.analyze(List.of(row), validCodes, validEmployeeIds);

        assertThat(result.rows()).hasSize(1);
        assertThat(result.findings().get(0).field()).isEqualTo("kod_skoleni");
    }

    @Test
    void blankPlatnostDoIsNotAnError() {
        Map<String, String> row = validRow();
        row.put("platnost_do", "");

        AnalysisResult<RunCompletedTraining> result = analyzer.analyze(List.of(row), validCodes, validEmployeeIds);

        assertThat(result.findings()).isEmpty();
        assertThat(result.rows().get(0).getPlatnostDo()).isNull();
    }

    @Test
    void negativePriceProducesWarning() {
        Map<String, String> row = validRow();
        row.put("cena_kc", "-600,00");

        AnalysisResult<RunCompletedTraining> result = analyzer.analyze(List.of(row), validCodes, validEmployeeIds);

        assertThat(result.rows().get(0).getCenaKc()).isEqualTo(new BigDecimal("-600.00"));
        assertThat(result.findings()).hasSize(1);
        assertThat(result.findings().get(0).field()).isEqualTo("cena_kc");
    }
}
