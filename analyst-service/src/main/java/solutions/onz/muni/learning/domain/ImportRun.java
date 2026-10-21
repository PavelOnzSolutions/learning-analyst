package solutions.onz.muni.learning.domain;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import solutions.onz.muni.learning.domain.enums.RunStatus;

import java.time.Instant;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@Document("import_runs")
// Both index shapes are needed because the History list query (RunService.listRuns)
// sorts by createdAt either with a status filter (findByStatus) or without (findAll) —
// without an index covering the sort path, Azure Cosmos DB for MongoDB (RU API) rejects
// the order-by with "The index path corresponding to the specified order-by item is
// excluded." Vanilla MongoDB tolerates an unindexed sort; Cosmos's indexing policy does not.
@CompoundIndexes({
        @CompoundIndex(name = "status_createdAt_idx", def = "{'status': 1, 'createdAt': -1}")
})
public class ImportRun {

    @Id
    private String id;

    private String name;
    private RunStatus status;
    @Indexed
    private Instant createdAt;
    private Instant confirmedAt;
    private String createdBy;
    private Counts counts;
    private List<Finding> findings;
}
