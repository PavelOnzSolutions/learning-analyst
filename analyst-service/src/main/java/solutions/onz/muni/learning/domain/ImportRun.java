package solutions.onz.muni.learning.domain;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import solutions.onz.muni.learning.domain.enums.RunStatus;

import java.time.Instant;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@Document("import_runs")
public class ImportRun {

    @Id
    private String id;

    private String name;
    private RunStatus status;
    private Instant createdAt;
    private Instant confirmedAt;
    private String createdBy;
    private Counts counts;
    private List<Finding> findings;
}
