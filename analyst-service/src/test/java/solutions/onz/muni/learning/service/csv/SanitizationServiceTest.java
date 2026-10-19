package solutions.onz.muni.learning.service.csv;

import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

class SanitizationServiceTest {

    private final SanitizationService service = new SanitizationService();

    @Test
    void sanitizeTextTrimsAndCollapsesWhitespace() {
        assertThat(service.sanitizeText("  Martina  ")).isEqualTo("Martina");
        assertThat(service.sanitizeText("Studijní   oddělení")).isEqualTo("Studijní oddělení");
        assertThat(service.sanitizeText(null)).isNull();
    }

    @Test
    void sanitizeTextNeutralizesLeadingFormulaCharacters() {
        assertThat(service.sanitizeText("=HYPERLINK(\"https://example.com\")")).startsWith("'=");
        assertThat(service.sanitizeText("@SUM(1+1)")).startsWith("'@");
        assertThat(service.sanitizeText("-2+3")).startsWith("'-");
        assertThat(service.sanitizeText("+1+1")).startsWith("'+");
    }

    @Test
    void sanitizeTextLeavesOrdinaryTextUnchanged() {
        assertThat(service.sanitizeText("bez certifikátu")).isEqualTo("bez certifikátu");
    }

    @Test
    void parseAmountHandlesCzechCurrencyFormats() {
        assertThat(service.parseAmount("2 100 Kč")).contains(new BigDecimal("2100"));
        assertThat(service.parseAmount("1 500,00")).contains(new BigDecimal("1500.00"));
        assertThat(service.parseAmount("-600,00")).contains(new BigDecimal("-600.00"));
        assertThat(service.parseAmount("800")).contains(new BigDecimal("800"));
        assertThat(service.parseAmount("")).isEmpty();
        assertThat(service.parseAmount(null)).isEmpty();
    }

    @Test
    void parseFlexibleDateAcceptsAllThreeFormats() {
        assertThat(service.parseFlexibleDate("2019-01-06")).contains(LocalDate.of(2019, 1, 6));
        assertThat(service.parseFlexibleDate("1. 1. 1900")).contains(LocalDate.of(1900, 1, 1));
        assertThat(service.parseFlexibleDate("07.01.2019")).contains(LocalDate.of(2019, 1, 7));
    }

    @Test
    void parseFlexibleDateRejectsCalendarInvalidDates() {
        assertThat(service.parseFlexibleDate("31. 9. 2026")).isEmpty();
        assertThat(service.parseFlexibleDate("not a date")).isEmpty();
        assertThat(service.parseFlexibleDate("")).isEmpty();
    }

    @Test
    void maskRodneCisloKeepsOnlyLastFourDigits() {
        assertThat(service.maskRodneCislo("665917/0359")).isEqualTo("0359");
        assertThat(service.maskRodneCislo(null)).isNull();
    }

    @Test
    void isValidRodneCisloFormatChecksDigitPattern() {
        assertThat(service.isValidRodneCisloFormat("665917/0359")).isTrue();
        assertThat(service.isValidRodneCisloFormat("6659170359")).isTrue();
        assertThat(service.isValidRodneCisloFormat("abc")).isFalse();
    }
}
