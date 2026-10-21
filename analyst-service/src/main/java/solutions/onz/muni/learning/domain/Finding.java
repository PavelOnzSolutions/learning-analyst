package solutions.onz.muni.learning.domain;

import solutions.onz.muni.learning.domain.enums.FileRole;
import solutions.onz.muni.learning.domain.enums.FindingSeverity;

public record Finding(FindingSeverity severity, FileRole file, int row, String field, String message) {
}
