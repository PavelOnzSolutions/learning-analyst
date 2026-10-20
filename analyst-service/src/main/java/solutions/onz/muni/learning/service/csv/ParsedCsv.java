package solutions.onz.muni.learning.service.csv;

import solutions.onz.muni.learning.domain.Finding;

import java.util.List;
import java.util.Map;

public record ParsedCsv(List<String> headers, List<Map<String, String>> rows, List<Finding> findings) {
}
