package solutions.onz.muni.learning.domain;

public record Counts(
        int employees,
        int trainingCatalogEntries,
        int timeslots,
        int completedTrainings,
        long errorCount,
        long warningCount,
        long compliantCount,
        long expiringSoonCount,
        long overdueCount
) {
}
