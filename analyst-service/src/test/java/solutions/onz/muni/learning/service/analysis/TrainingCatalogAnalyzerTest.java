package solutions.onz.muni.learning.service.analysis;

import org.junit.jupiter.api.Test;
import solutions.onz.muni.learning.domain.FindingSeverity;
import solutions.onz.muni.learning.domain.RunEmployee;
import solutions.onz.muni.learning.domain.RunTrainingCatalogEntry;
import solutions.onz.muni.learning.service.csv.SanitizationService;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class TrainingCatalogAnalyzerTest {

    private final TrainingCatalogAnalyzer analyzer = new TrainingCatalogAnalyzer(new SanitizationService());

    private Map<String, String> validRow() {
        Map<String, String> row = new LinkedHashMap<>();
        row.put("kod", "BOZP-Z");
        row.put("nazev", "BOZP – základní školení");
        row.put("platnost_mesicu", "24");
        row.put("povinne_pro", "VSICHNI");
        row.put("poznamka", "");
        return row;
    }

    @Test
    void validRowProducesNoFindings() {
        AnalysisResult<RunTrainingCatalogEntry> result = analyzer.analyze(List.of(validRow()));

        assertThat(result.findings()).isEmpty();
        assertThat(result.rows().get(0).getPlatnostMesicu()).isEqualTo(24);
    }

    @Test
    void missingKodExcludesRowWithError() {
        Map<String, String> row = validRow();
        row.put("kod", "");

        AnalysisResult<RunTrainingCatalogEntry> result = analyzer.analyze(List.of(row));

        assertThat(result.rows()).isEmpty();
        assertThat(result.findings().get(0).severity()).isEqualTo(FindingSeverity.ERROR);
    }

    @Test
    void nonStandardValidityFormatParsesYearsWithWarning() {
        Map<String, String> row = validRow();
        row.put("platnost_mesicu", "2 roky");

        AnalysisResult<RunTrainingCatalogEntry> result = analyzer.analyze(List.of(row));

        assertThat(result.rows().get(0).getPlatnostMesicu()).isEqualTo(24);
        assertThat(result.findings()).hasSize(1);
        assertThat(result.findings().get(0).severity()).isEqualTo(FindingSeverity.WARNING);
    }

    @Test
    void blankValidityMonthsIsNullWithNoFinding() {
        Map<String, String> row = validRow();
        row.put("platnost_mesicu", "");

        AnalysisResult<RunTrainingCatalogEntry> result = analyzer.analyze(List.of(row));

        assertThat(result.rows().get(0).getPlatnostMesicu()).isNull();
        assertThat(result.findings()).isEmpty();
    }

    @Test
    void validatePovinneProReferencesFlagsUnmatchedUtvar() {
        RunTrainingCatalogEntry entry = new RunTrainingCatalogEntry();
        entry.setKod("PRV-POM");
        entry.setPovinnePro("UTVAR:Laboratoře;Sklad");

        RunEmployee employee = new RunEmployee();
        employee.setUtvar("Laboratoře");

        List<solutions.onz.muni.learning.domain.Finding> findings =
                analyzer.validatePovinneProReferences(List.of(entry), List.of(employee));

        assertThat(findings).hasSize(1);
        assertThat(findings.get(0).message()).contains("Sklad");
    }
}
