package solutions.onz.muni.learning.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import solutions.onz.muni.learning.domain.RunCompletedTraining;

import java.util.List;

public interface RunCompletedTrainingRepository extends MongoRepository<RunCompletedTraining, String> {
    List<RunCompletedTraining> findByRunId(String runId);
    void deleteByRunId(String runId);
}
