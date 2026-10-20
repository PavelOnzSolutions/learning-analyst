package solutions.onz.muni.learning.service.analysis;

import solutions.onz.muni.learning.domain.Finding;

import java.util.List;

public record AnalysisResult<T>(List<T> rows, List<Finding> findings) {
}
