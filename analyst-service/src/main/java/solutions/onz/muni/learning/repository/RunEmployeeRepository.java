package solutions.onz.muni.learning.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import solutions.onz.muni.learning.domain.RunEmployee;

import java.util.List;

public interface RunEmployeeRepository extends MongoRepository<RunEmployee, String> {
    List<RunEmployee> findByRunId(String runId);
    void deleteByRunId(String runId);
}
