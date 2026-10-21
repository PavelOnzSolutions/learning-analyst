package solutions.onz.muni.learning.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import solutions.onz.muni.learning.domain.ImportRun;
import solutions.onz.muni.learning.domain.enums.RunStatus;

public interface ImportRunRepository extends MongoRepository<ImportRun, String> {
    Page<ImportRun> findByStatus(RunStatus status, Pageable pageable);
}
