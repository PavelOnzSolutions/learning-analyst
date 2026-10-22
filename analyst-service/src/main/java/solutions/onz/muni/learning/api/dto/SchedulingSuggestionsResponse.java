package solutions.onz.muni.learning.api.dto;

import java.util.List;

public record SchedulingSuggestionsResponse(String basedOnRunId, String basedOnRunName, List<SchedulingOpportunity> suggestions) {
}
