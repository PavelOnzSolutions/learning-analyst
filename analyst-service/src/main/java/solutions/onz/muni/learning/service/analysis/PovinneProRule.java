package solutions.onz.muni.learning.service.analysis;

import java.text.Normalizer;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

public final class PovinneProRule {

    public enum Type { VSICHNI, UTVAR, POZICE, NEPOVINNE, UNKNOWN }

    private final Type type;
    private final List<String> normalizedValues;
    private final List<String> originalValues;

    private PovinneProRule(Type type, List<String> normalizedValues, List<String> originalValues) {
        this.type = type;
        this.normalizedValues = normalizedValues;
        this.originalValues = originalValues;
    }

    public static PovinneProRule parse(String raw) {
        if (raw == null || raw.isBlank()) {
            return new PovinneProRule(Type.NEPOVINNE, List.of(), List.of());
        }
        String trimmed = raw.trim();
        if (trimmed.equalsIgnoreCase("VSICHNI")) {
            return new PovinneProRule(Type.VSICHNI, List.of(), List.of());
        }
        if (trimmed.equalsIgnoreCase("NEPOVINNE")) {
            return new PovinneProRule(Type.NEPOVINNE, List.of(), List.of());
        }
        if (trimmed.regionMatches(true, 0, "UTVAR:", 0, 6)) {
            List<String> values = splitValues(trimmed.substring(6));
            return new PovinneProRule(Type.UTVAR, normalize(values), values);
        }
        if (trimmed.regionMatches(true, 0, "POZICE:", 0, 7)) {
            List<String> values = splitValues(trimmed.substring(7));
            return new PovinneProRule(Type.POZICE, normalize(values), values);
        }
        return new PovinneProRule(Type.UNKNOWN, List.of(), List.of());
    }

    public Type type() {
        return type;
    }

    public List<String> normalizedValues() {
        return normalizedValues;
    }

    public List<String> originalValues() {
        return originalValues;
    }

    public boolean matches(String employeeUtvar, String employeePozice) {
        return switch (type) {
            case VSICHNI -> true;
            case NEPOVINNE, UNKNOWN -> false;
            case UTVAR -> normalizedValues.contains(normalize(employeeUtvar));
            case POZICE -> normalizedValues.contains(normalize(employeePozice));
        };
    }

    private static List<String> splitValues(String value) {
        return Arrays.stream(value.split(";"))
                .map(String::trim)
                .filter(v -> !v.isEmpty())
                .collect(Collectors.toList());
    }

    private static List<String> normalize(List<String> values) {
        return values.stream()
                .map(PovinneProRule::normalize)
                .filter(v -> !v.isEmpty())
                .collect(Collectors.toList());
    }

    static String normalize(String value) {
        if (value == null) {
            return "";
        }
        String decomposed = Normalizer.normalize(value.trim(), Normalizer.Form.NFD);
        return decomposed.replaceAll("\\p{M}", "").toLowerCase(Locale.ROOT);
    }
}
