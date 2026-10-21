package solutions.onz.muni.learning.service.analysis;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import solutions.onz.muni.learning.domain.Finding;
import solutions.onz.muni.learning.domain.enums.FindingSeverity;
import solutions.onz.muni.learning.domain.enums.FileRole;
import solutions.onz.muni.learning.domain.RunEmployee;
import solutions.onz.muni.learning.domain.RunTrainingCatalogEntry;
import solutions.onz.muni.learning.service.csv.SanitizationService;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class TrainingCatalogAnalyzer {

    private static final Pattern YEARS_PATTERN = Pattern.compile("^(\\d+)\\s*(roky|rok|let)$", Pattern.CASE_INSENSITIVE);

    private final SanitizationService sanitizationService;

    public AnalysisResult<RunTrainingCatalogEntry> analyze(List<Map<String, String>> rawRows) {
        List<RunTrainingCatalogEntry> entries = new ArrayList<>();
        List<Finding> findings = new ArrayList<>();

        for (int i = 0; i < rawRows.size(); i++) {
            int rowNumber = i + 1;
            Map<String, String> raw = rawRows.get(i);

            String kod = trimToNull(raw.get("kod"));
            if (kod == null) {
                findings.add(new Finding(FindingSeverity.ERROR, FileRole.TRAINING_CATALOG, rowNumber,
                        "kod", "Missing required kod"));
                continue;
            }

            RunTrainingCatalogEntry entry = new RunTrainingCatalogEntry();
            entry.setKod(kod);
            entry.setNazev(sanitizationService.sanitizeText(raw.get("nazev")));
            entry.setPlatnostMesicu(parsePlatnostMesicu(raw.get("platnost_mesicu"), rowNumber, findings));
            entry.setPovinnePro(trimToNull(raw.get("povinne_pro")));
            entry.setPoznamka(sanitizationService.sanitizeText(raw.get("poznamka")));

            entries.add(entry);
        }

        return new AnalysisResult<>(entries, findings);
    }

    public List<Finding> validatePovinneProReferences(List<RunTrainingCatalogEntry> catalog, List<RunEmployee> employees) {
        List<String> normalizedUtvars = employees.stream()
                .map(e -> PovinneProRule.normalize(e.getUtvar()))
                .filter(v -> !v.isEmpty())
                .toList();
        List<String> normalizedPozice = employees.stream()
                .map(e -> PovinneProRule.normalize(e.getPozice()))
                .filter(v -> !v.isEmpty())
                .toList();

        List<Finding> findings = new ArrayList<>();
        for (RunTrainingCatalogEntry entry : catalog) {
            PovinneProRule rule = PovinneProRule.parse(entry.getPovinnePro());
            if (rule.type() == PovinneProRule.Type.UTVAR) {
                for (int i = 0; i < rule.normalizedValues().size(); i++) {
                    String normalizedValue = rule.normalizedValues().get(i);
                    String originalValue = rule.originalValues().get(i);
                    if (!normalizedUtvars.contains(normalizedValue)) {
                        findings.add(new Finding(FindingSeverity.WARNING, FileRole.TRAINING_CATALOG, 0, "povinne_pro",
                                "Training '" + entry.getKod() + "' references UTVAR '" + originalValue + "', which does not match any employee's utvar"));
                    }
                }
            } else if (rule.type() == PovinneProRule.Type.POZICE) {
                for (int i = 0; i < rule.normalizedValues().size(); i++) {
                    String normalizedValue = rule.normalizedValues().get(i);
                    String originalValue = rule.originalValues().get(i);
                    if (!normalizedPozice.contains(normalizedValue)) {
                        findings.add(new Finding(FindingSeverity.WARNING, FileRole.TRAINING_CATALOG, 0, "povinne_pro",
                                "Training '" + entry.getKod() + "' references POZICE '" + originalValue + "', which does not match any employee's pozice"));
                    }
                }
            }
        }
        return findings;
    }

    private Integer parsePlatnostMesicu(String raw, int rowNumber, List<Finding> findings) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String trimmed = raw.trim();
        try {
            return Integer.parseInt(trimmed);
        } catch (NumberFormatException e) {
            Matcher matcher = YEARS_PATTERN.matcher(trimmed);
            if (matcher.matches()) {
                int years = Integer.parseInt(matcher.group(1));
                findings.add(new Finding(FindingSeverity.WARNING, FileRole.TRAINING_CATALOG, rowNumber,
                        "platnost_mesicu", "Non-standard validity format parsed as " + years + " year(s): " + trimmed));
                return years * 12;
            }
            findings.add(new Finding(FindingSeverity.WARNING, FileRole.TRAINING_CATALOG, rowNumber,
                    "platnost_mesicu", "Could not parse validity months: " + trimmed));
            return null;
        }
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
