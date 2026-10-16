package solutions.onz.muni.learning.repository;

import solutions.onz.muni.learning.domain.ApiToken;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface ApiTokenRepository extends MongoRepository<ApiToken, String> {
    List<ApiToken> findByUserId(String userId);
}
