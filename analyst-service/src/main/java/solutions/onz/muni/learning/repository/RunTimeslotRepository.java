package solutions.onz.muni.learning.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import solutions.onz.muni.learning.domain.RunTimeslot;

import java.util.List;

public interface RunTimeslotRepository extends MongoRepository<RunTimeslot, String> {
    List<RunTimeslot> findByRunId(String runId);
    void deleteByRunId(String runId);
}
