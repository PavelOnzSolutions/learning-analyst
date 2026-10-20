package solutions.onz.muni.learning.service.csv;

import org.junit.jupiter.api.Test;
import solutions.onz.muni.learning.domain.DelimiterSetting;
import solutions.onz.muni.learning.domain.FileRole;
import solutions.onz.muni.learning.domain.FindingSeverity;

import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;

class CsvIngestionServiceTest {

    private final CsvIngestionService service = new CsvIngestionService();

    @Test
    void sniffsCommaDelimiterWhenOverrideIsAuto() {
        String csv = "kod,nazev,platnost_mesicu\nBOZP-Z,BOZP - zakladni skoleni,24\n";
        ParsedCsv result = service.parse(csv.getBytes(StandardCharsets.UTF_8), FileRole.TRAINING_CATALOG, DelimiterSetting.AUTO);

        assertThat(result.headers()).containsExactly("kod", "nazev", "platnost_mesicu");
        assertThat(result.rows()).hasSize(1);
        assertThat(result.rows().get(0).get("kod")).isEqualTo("BOZP-Z");
        assertThat(result.findings()).isEmpty();
    }

    @Test
    void sniffsSemicolonDelimiterWhenOverrideIsAuto() {
        String csv = "id_terminu;kod_skoleni;kapacita\nT001;KYBER;25\n";
        ParsedCsv result = service.parse(csv.getBytes(StandardCharsets.UTF_8), FileRole.TIMESLOTS, DelimiterSetting.AUTO);

        assertThat(result.headers()).containsExactly("id_terminu", "kod_skoleni", "kapacita");
        assertThat(result.rows().get(0).get("kod_skoleni")).isEqualTo("KYBER");
    }

    @Test
    void explicitOverrideSkipsSniffing() {
        String csv = "a;b\n1;2\n";
        ParsedCsv result = service.parse(csv.getBytes(StandardCharsets.UTF_8), FileRole.EMPLOYEES, DelimiterSetting.SEMICOLON);

        assertThat(result.headers()).containsExactly("a", "b");
    }

    @Test
    void mismatchedOverrideProducesWarningFinding() {
        String csv = "a;b\n1;2\n"; // semicolon-delimited, but caller forces comma
        ParsedCsv result = service.parse(csv.getBytes(StandardCharsets.UTF_8), FileRole.EMPLOYEES, DelimiterSetting.COMMA);

        assertThat(result.headers()).containsExactly("a;b");
        assertThat(result.findings()).hasSize(1);
        assertThat(result.findings().get(0).severity()).isEqualTo(FindingSeverity.WARNING);
        assertThat(result.findings().get(0).file()).isEqualTo(FileRole.EMPLOYEES);
    }

    @Test
    void detectsWindows1250FallbackWhenUtf8DecodingFails() {
        byte[] cp1250Bytes = "id;zamestnanec\nZ1;Vacková Hana\n".getBytes(Charset.forName("windows-1250"));

        ParsedCsv result = service.parse(cp1250Bytes, FileRole.COMPLETED_TRAININGS, DelimiterSetting.AUTO);

        assertThat(result.rows().get(0).get("zamestnanec")).isEqualTo("Vacková Hana");
    }

    @Test
    void shortRowProducesNullForMissingTrailingColumns() {
        String csv = "a,b,c\n1,2\n"; // third column missing on the data row
        ParsedCsv result = service.parse(csv.getBytes(StandardCharsets.UTF_8), FileRole.EMPLOYEES, DelimiterSetting.AUTO);

        assertThat(result.rows().get(0).get("c")).isNull();
    }
}
