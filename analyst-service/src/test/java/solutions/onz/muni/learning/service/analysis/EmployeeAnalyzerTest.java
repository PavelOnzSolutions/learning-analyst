package solutions.onz.muni.learning.service.analysis;

import org.junit.jupiter.api.Test;
import solutions.onz.muni.learning.domain.enums.FindingSeverity;
import solutions.onz.muni.learning.domain.RunEmployee;
import solutions.onz.muni.learning.service.csv.SanitizationService;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class EmployeeAnalyzerTest {

    private final EmployeeAnalyzer analyzer = new EmployeeAnalyzer(new SanitizationService());

    private Map<String, String> validRow() {
        Map<String, String> row = new LinkedHashMap<>();
        row.put("id_zamestnance", "E0001");
        row.put("jmeno", "Tereza");
        row.put("prijmeni", "Urbanová");
        row.put("email", "tereza.urbanova@vzorova.example");
        row.put("utvar", "Studijní oddělení");
        row.put("pozice", "Vedoucí");
        row.put("vedouci_email", "jitka.simkova@vzorova.example");
        row.put("datum_nastupu", "2008-02-23");
        row.put("datum_ukonceni", "");
        row.put("stav", "aktivní");
        row.put("rodne_cislo", "665917/0359");
        row.put("poznamka", "");
        return row;
    }

    @Test
    void validRowProducesNoFindings() {
        AnalysisResult<RunEmployee> result = analyzer.analyze(List.of(validRow()));

        assertThat(result.findings()).isEmpty();
        assertThat(result.rows()).hasSize(1);
        RunEmployee employee = result.rows().get(0);
        assertThat(employee.getIdZamestnance()).isEqualTo("E0001");
        assertThat(employee.getDatumNastupu()).isEqualTo(LocalDate.of(2008, 2, 23));
        assertThat(employee.getRodneCisloMasked()).isEqualTo("0359");
    }

    @Test
    void missingEmployeeIdExcludesRowWithError() {
        Map<String, String> row = validRow();
        row.put("id_zamestnance", "");

        AnalysisResult<RunEmployee> result = analyzer.analyze(List.of(row));

        assertThat(result.rows()).isEmpty();
        assertThat(result.findings()).hasSize(1);
        assertThat(result.findings().get(0).severity()).isEqualTo(FindingSeverity.ERROR);
        assertThat(result.findings().get(0).field()).isEqualTo("id_zamestnance");
    }

    @Test
    void malformedEmailProducesWarningButKeepsRow() {
        Map<String, String> row = validRow();
        row.put("email", "tereza.jandova @vzorova.example");

        AnalysisResult<RunEmployee> result = analyzer.analyze(List.of(row));

        assertThat(result.rows()).hasSize(1);
        assertThat(result.findings()).hasSize(1);
        assertThat(result.findings().get(0).severity()).isEqualTo(FindingSeverity.WARNING);
        assertThat(result.findings().get(0).field()).isEqualTo("email");
    }

    @Test
    void invalidStartDateProducesErrorButKeepsRowWithNullDate() {
        Map<String, String> row = validRow();
        row.put("datum_nastupu", "not a date");

        AnalysisResult<RunEmployee> result = analyzer.analyze(List.of(row));

        assertThat(result.rows()).hasSize(1);
        assertThat(result.rows().get(0).getDatumNastupu()).isNull();
        assertThat(result.findings()).hasSize(1);
        assertThat(result.findings().get(0).severity()).isEqualTo(FindingSeverity.ERROR);
        assertThat(result.findings().get(0).field()).isEqualTo("datum_nastupu");
    }

    @Test
    void malformedRodneCisloProducesWarningButStillMasks() {
        Map<String, String> row = validRow();
        row.put("rodne_cislo", "not-a-birth-number");

        AnalysisResult<RunEmployee> result = analyzer.analyze(List.of(row));

        assertThat(result.findings()).hasSize(1);
        assertThat(result.findings().get(0).field()).isEqualTo("rodne_cislo");
        assertThat(result.rows().get(0).getRodneCisloMasked()).isNotNull();
    }

    @Test
    void formulaInjectionInNoteIsNeutralized() {
        Map<String, String> row = validRow();
        row.put("poznamka", "=HYPERLINK(\"https://example.com\")");

        AnalysisResult<RunEmployee> result = analyzer.analyze(List.of(row));

        assertThat(result.rows().get(0).getPoznamka()).startsWith("'=");
    }

    @Test
    void utvarSpellingVariantsDifferingOnlyByDiacriticsOrCaseAreMergedToTheMostCommonSpelling() {
        Map<String, String> r1 = rowWithId("E0001");
        r1.put("utvar", "Správa budov");
        Map<String, String> r2 = rowWithId("E0002");
        r2.put("utvar", "Správa budov");
        Map<String, String> r3 = rowWithId("E0003");
        r3.put("utvar", "Sprava budov");
        Map<String, String> r4 = rowWithId("E0004");
        r4.put("utvar", "SPRÁVA BUDOV");

        AnalysisResult<RunEmployee> result = analyzer.analyze(List.of(r1, r2, r3, r4));

        assertThat(result.rows()).extracting(RunEmployee::getUtvar)
                .containsOnly("Správa budov");
        assertThat(result.findings())
                .anySatisfy(f -> {
                    assertThat(f.severity()).isEqualTo(FindingSeverity.WARNING);
                    assertThat(f.field()).isEqualTo("utvar");
                    assertThat(f.message()).contains("Správa budov");
                });
    }

    @Test
    void utvarSpellingVariantTiesAreResolvedByKeepingTheFirstEncounteredSpelling() {
        Map<String, String> r1 = rowWithId("E0001");
        r1.put("utvar", "Sprava budov");
        Map<String, String> r2 = rowWithId("E0002");
        r2.put("utvar", "Správa budov");

        AnalysisResult<RunEmployee> result = analyzer.analyze(List.of(r1, r2));

        assertThat(result.rows()).extracting(RunEmployee::getUtvar)
                .containsOnly("Sprava budov");
    }

    @Test
    void pozicSpellingVariantsAreMergedIndependentlyOfUtvar() {
        Map<String, String> r1 = rowWithId("E0001");
        r1.put("pozice", "Vedoucí");
        Map<String, String> r2 = rowWithId("E0002");
        r2.put("pozice", "Vedoucí");
        Map<String, String> r3 = rowWithId("E0003");
        r3.put("pozice", "vedouci");

        AnalysisResult<RunEmployee> result = analyzer.analyze(List.of(r1, r2, r3));

        assertThat(result.rows()).extracting(RunEmployee::getPozice)
                .containsOnly("Vedoucí");
        assertThat(result.findings())
                .anySatisfy(f -> assertThat(f.field()).isEqualTo("pozice"));
    }

    @Test
    void consistentUtvarSpellingAcrossEmployeesProducesNoMergeFinding() {
        Map<String, String> r1 = rowWithId("E0001");
        Map<String, String> r2 = rowWithId("E0002");

        AnalysisResult<RunEmployee> result = analyzer.analyze(List.of(r1, r2));

        assertThat(result.findings()).isEmpty();
    }

    private Map<String, String> rowWithId(String id) {
        Map<String, String> row = validRow();
        row.put("id_zamestnance", id);
        return row;
    }
}
