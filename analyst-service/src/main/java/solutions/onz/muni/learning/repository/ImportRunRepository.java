package solutions.onz.muni.learning.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import solutions.onz.muni.learning.domain.ImportRun;
import solutions.onz.muni.learning.domain.enums.RunStatus;

import java.util.List;
import java.util.Optional;

public interface ImportRunRepository extends MongoRepository<ImportRun, String> {
    Page<ImportRun> findByStatus(RunStatus status, Pageable pageable);
    List<ImportRun> findByStatusOrderByCreatedAtAsc(RunStatus status);
    Optional<ImportRun> findFirstByStatusOrderByCreatedAtDesc(RunStatus status);
}
