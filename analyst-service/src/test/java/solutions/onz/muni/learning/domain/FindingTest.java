package solutions.onz.muni.learning.domain;

import org.junit.jupiter.api.Test;
import solutions.onz.muni.learning.domain.enums.DelimiterSetting;
import solutions.onz.muni.learning.domain.enums.FileRole;
import solutions.onz.muni.learning.domain.enums.FindingSeverity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class FindingTest {

    @Test
    void recordHoldsAllFields() {
        Finding finding = new Finding(FindingSeverity.ERROR, FileRole.EMPLOYEES, 7, "datum_nastupu", "Invalid date");

        assertThat(finding.severity()).isEqualTo(FindingSeverity.ERROR);
        assertThat(finding.file()).isEqualTo(FileRole.EMPLOYEES);
        assertThat(finding.row()).isEqualTo(7);
        assertThat(finding.field()).isEqualTo("datum_nastupu");
        assertThat(finding.message()).isEqualTo("Invalid date");
    }

    @Test
    void delimiterSettingResolvesToCharacter() {
        assertThat(DelimiterSetting.COMMA.toChar()).isEqualTo(',');
        assertThat(DelimiterSetting.SEMICOLON.toChar()).isEqualTo(';');
        assertThat(DelimiterSetting.TAB.toChar()).isEqualTo('\t');
        assertThat(DelimiterSetting.PIPE.toChar()).isEqualTo('|');
    }

    @Test
    void delimiterSettingAutoHasNoCharacter() {
        assertThatThrownBy(DelimiterSetting.AUTO::toChar).isInstanceOf(IllegalStateException.class);
    }
}
