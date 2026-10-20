package solutions.onz.muni.learning.service.analysis;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class PovinneProRuleTest {

    @Test
    void vsichniMatchesEveryEmployee() {
        PovinneProRule rule = PovinneProRule.parse("VSICHNI");
        assertThat(rule.matches("Anything", "Anything")).isTrue();
    }

    @Test
    void nepovinneMatchesNoOne() {
        PovinneProRule rule = PovinneProRule.parse("NEPOVINNE");
        assertThat(rule.matches("Laboratoře", "Laborant")).isFalse();
    }

    @Test
    void utvarMatchesCaseAndDiacriticInsensitively() {
        PovinneProRule rule = PovinneProRule.parse("UTVAR:Laboratoře;Správa budov;Knihovna");

        assertThat(rule.matches("Laboratore", "ignored")).isTrue();
        assertThat(rule.matches("laboratoře", "ignored")).isTrue();
        assertThat(rule.matches("Ekonomické oddělení", "ignored")).isFalse();
    }

    @Test
    void pozicematchesCaseInsensitively() {
        PovinneProRule rule = PovinneProRule.parse("POZICE:Řidič");

        assertThat(rule.matches("ignored", "ridic")).isTrue();
        assertThat(rule.matches("ignored", "Vedoucí")).isFalse();
    }

    @Test
    void normalizedAndOriginalValuesStayIndexParallelWhenAValueNormalizesToEmpty() {
        // U+0301 is a lone combining acute accent: a non-blank raw token that NFD
        // decomposition + \p{M} stripping reduces to the empty string.
        String combiningAccent = "́";
        PovinneProRule rule = PovinneProRule.parse("UTVAR:" + combiningAccent + ";Laboratoře");

        assertThat(rule.normalizedValues()).hasSameSizeAs(rule.originalValues());
        assertThat(rule.originalValues()).containsExactly(combiningAccent, "Laboratoře");
        assertThat(rule.normalizedValues()).containsExactly("", "laboratore");
        // The normal token still pairs correctly by index after the empty entry.
        assertThat(rule.originalValues().get(1)).isEqualTo("Laboratoře");
        assertThat(rule.normalizedValues().get(1)).isEqualTo("laboratore");
        assertThat(rule.matches("Laboratore", "ignored")).isTrue();
    }
}
