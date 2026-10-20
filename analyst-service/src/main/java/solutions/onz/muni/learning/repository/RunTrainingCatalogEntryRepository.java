package solutions.onz.muni.learning.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import solutions.onz.muni.learning.domain.RunTrainingCatalogEntry;

import java.util.List;

public interface RunTrainingCatalogEntryRepository extends MongoRepository<RunTrainingCatalogEntry, String> {
    List<RunTrainingCatalogEntry> findByRunId(String runId);
    void deleteByRunId(String runId);
}
