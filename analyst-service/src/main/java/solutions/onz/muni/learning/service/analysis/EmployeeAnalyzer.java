package solutions.onz.muni.learning.service.analysis;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import solutions.onz.muni.learning.domain.Finding;
import solutions.onz.muni.learning.domain.enums.FindingSeverity;
import solutions.onz.muni.learning.domain.enums.FileRole;
import solutions.onz.muni.learning.domain.RunEmployee;
import solutions.onz.muni.learning.service.csv.SanitizationService;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.BiConsumer;
import java.util.function.Function;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class EmployeeAnalyzer {

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");

    private final SanitizationService sanitizationService;

    public AnalysisResult<RunEmployee> analyze(List<Map<String, String>> rawRows) {
        List<RunEmployee> employees = new ArrayList<>();
        List<Finding> findings = new ArrayList<>();

        for (int i = 0; i < rawRows.size(); i++) {
            int rowNumber = i + 1;
            Map<String, String> raw = rawRows.get(i);

            String idZamestnance = trimToNull(raw.get("id_zamestnance"));
            if (idZamestnance == null) {
                findings.add(new Finding(FindingSeverity.ERROR, FileRole.EMPLOYEES, rowNumber,
                        "id_zamestnance", "Missing required id_zamestnance"));
                continue;
            }

            RunEmployee employee = new RunEmployee();
            employee.setIdZamestnance(idZamestnance);
            employee.setJmeno(sanitizationService.sanitizeText(raw.get("jmeno")));
            employee.setPrijmeni(sanitizationService.sanitizeText(raw.get("prijmeni")));

            String email = sanitizationService.sanitizeText(raw.get("email"));
            employee.setEmail(email);
            if (email != null && !email.isEmpty() && !EMAIL_PATTERN.matcher(email).matches()) {
                findings.add(new Finding(FindingSeverity.WARNING, FileRole.EMPLOYEES, rowNumber,
                        "email", "Malformed email: " + email));
            }

            employee.setUtvar(sanitizationService.sanitizeText(raw.get("utvar")));
            employee.setPozice(sanitizationService.sanitizeText(raw.get("pozice")));
            employee.setVedouciEmail(sanitizationService.sanitizeText(raw.get("vedouci_email")));

            employee.setDatumNastupu(parseDateField(raw.get("datum_nastupu"), rowNumber, "datum_nastupu", findings));
            employee.setDatumUkonceni(parseDateField(raw.get("datum_ukonceni"), rowNumber, "datum_ukonceni", findings));

            employee.setStav(sanitizationService.sanitizeText(raw.get("stav")));

            String rodneCislo = raw.get("rodne_cislo");
            if (rodneCislo != null && !rodneCislo.isBlank() && !sanitizationService.isValidRodneCisloFormat(rodneCislo)) {
                findings.add(new Finding(FindingSeverity.WARNING, FileRole.EMPLOYEES, rowNumber,
                        "rodne_cislo", "Malformed rodne_cislo format"));
            }
            employee.setRodneCisloMasked(sanitizationService.maskRodneCislo(rodneCislo));

            employee.setPoznamka(sanitizationService.sanitizeText(raw.get("poznamka")));

            employees.add(employee);
        }

        canonicalizeField(employees, findings, "utvar", RunEmployee::getUtvar, RunEmployee::setUtvar);
        canonicalizeField(employees, findings, "pozice", RunEmployee::getPozice, RunEmployee::setPozice);

        return new AnalysisResult<>(employees, findings);
    }

    /**
     * Collapses spelling variants of the same value (differing only by diacritics
     * and/or case, e.g. "Správa budov" / "Sprava budov" / "SPRÁVA BUDOV") into one
     * canonical spelling, so the rest of the system (grouping, charts, PovinnePro
     * matching) treats them as a single department/position rather than several.
     * The most frequently used spelling wins; ties keep the first one encountered.
     */
    private void canonicalizeField(List<RunEmployee> employees, List<Finding> findings, String fieldName,
                                    Function<RunEmployee, String> getter, BiConsumer<RunEmployee, String> setter) {
        Map<String, Map<String, Long>> variantCountsByKey = new LinkedHashMap<>();
        for (RunEmployee employee : employees) {
            String value = getter.apply(employee);
            if (value == null) {
                continue;
            }
            String key = PovinneProRule.normalize(value);
            variantCountsByKey.computeIfAbsent(key, k -> new LinkedHashMap<>()).merge(value, 1L, Long::sum);
        }

        Map<String, String> canonicalByKey = new LinkedHashMap<>();
        variantCountsByKey.forEach((key, variantCounts) -> {
            String canonical = variantCounts.entrySet().stream()
                    .max(Map.Entry.comparingByValue())
                    .map(Map.Entry::getKey)
                    .orElseThrow();
            canonicalByKey.put(key, canonical);

            if (variantCounts.size() > 1) {
                String otherVariants = variantCounts.keySet().stream()
                        .filter(v -> !v.equals(canonical))
                        .reduce((a, b) -> a + "', '" + b)
                        .orElse("");
                findings.add(new Finding(FindingSeverity.WARNING, FileRole.EMPLOYEES, 0, fieldName,
                        "Merged spelling variants '" + otherVariants + "' into '" + canonical + "' (differ only by case/diacritics)"));
            }
        });

        for (RunEmployee employee : employees) {
            String value = getter.apply(employee);
            if (value == null) {
                continue;
            }
            setter.accept(employee, canonicalByKey.get(PovinneProRule.normalize(value)));
        }
    }

    private LocalDate parseDateField(String raw, int rowNumber, String field, List<Finding> findings) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        Optional<LocalDate> parsed = sanitizationService.parseFlexibleDate(raw);
        if (parsed.isEmpty()) {
            findings.add(new Finding(FindingSeverity.ERROR, FileRole.EMPLOYEES, rowNumber, field, "Invalid date: " + raw));
            return null;
        }
        return parsed.get();
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
