package solutions.onz.muni.learning.domain;

import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class ImportRunTest {

    @Test
    void gettersAndSettersRoundTrip() {
        Instant now = Instant.now();
        Counts counts = new Counts(170, 11, 34, 2877, 2, 15, 50, 8, 12);
        Finding finding = new Finding(FindingSeverity.WARNING, FileRole.EMPLOYEES, 3, "email", "Malformed email");

        ImportRun run = new ImportRun();
        run.setId("r1");
        run.setName("October import");
        run.setStatus(RunStatus.PENDING_REVIEW);
        run.setCreatedAt(now);
        run.setConfirmedAt(null);
        run.setCreatedBy("u1");
        run.setCounts(counts);
        run.setFindings(List.of(finding));

        assertThat(run.getId()).isEqualTo("r1");
        assertThat(run.getStatus()).isEqualTo(RunStatus.PENDING_REVIEW);
        assertThat(run.getCreatedAt()).isEqualTo(now);
        assertThat(run.getConfirmedAt()).isNull();
        assertThat(run.getCounts().errorCount()).isEqualTo(2);
        assertThat(run.getFindings()).containsExactly(finding);
    }
}
