package solutions.onz.muni.learning.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import solutions.onz.muni.learning.domain.ImportSettings;

public interface ImportSettingsRepository extends MongoRepository<ImportSettings, String> {
}
