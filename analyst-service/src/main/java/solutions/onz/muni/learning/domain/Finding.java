package solutions.onz.muni.learning.domain;

public record Finding(FindingSeverity severity, FileRole file, int row, String field, String message) {
}
