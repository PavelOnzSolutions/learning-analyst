package solutions.onz.muni.learning.service.csv;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.time.format.ResolverStyle;
import java.util.Optional;
import java.util.regex.Pattern;

@Service
public class SanitizationService {

    private static final Pattern FORMULA_PREFIX = Pattern.compile("^[=+\\-@]");
    private static final Pattern RODNE_CISLO_FORMAT = Pattern.compile("^\\d{6}/?\\d{3,4}$");

    private static final DateTimeFormatter ISO = DateTimeFormatter.ISO_LOCAL_DATE.withResolverStyle(ResolverStyle.STRICT);
    // Note: "uuuu" (proleptic YEAR) is used instead of "yyyy" (YEAR_OF_ERA) because
    // ResolverStyle.STRICT requires an explicit era to resolve YEAR_OF_ERA, which these
    // inputs never provide; "uuuu" resolves under STRICT without needing one.
    private static final DateTimeFormatter CZECH_SPACED = DateTimeFormatter.ofPattern("d. M. uuuu").withResolverStyle(ResolverStyle.STRICT);
    private static final DateTimeFormatter CZECH_DOTTED = DateTimeFormatter.ofPattern("d.M.uuuu").withResolverStyle(ResolverStyle.STRICT);

    public String sanitizeText(String raw) {
        if (raw == null) {
            return null;
        }
        String collapsed = raw.trim().replaceAll("\\s+", " ");
        if (!collapsed.isEmpty() && FORMULA_PREFIX.matcher(collapsed).find()) {
            return "'" + collapsed;
        }
        return collapsed;
    }

    public Optional<BigDecimal> parseAmount(String raw) {
        if (raw == null) {
            return Optional.empty();
        }
        String cleaned = raw.replaceAll("[^0-9,.\\-]", "");
        if (cleaned.isEmpty()) {
            return Optional.empty();
        }
        int lastComma = cleaned.lastIndexOf(',');
        if (lastComma >= 0) {
            cleaned = cleaned.substring(0, lastComma) + "." + cleaned.substring(lastComma + 1).replace(",", "");
        }
        try {
            return Optional.of(new BigDecimal(cleaned));
        } catch (NumberFormatException e) {
            return Optional.empty();
        }
    }

    public Optional<LocalDate> parseFlexibleDate(String raw) {
        if (raw == null || raw.trim().isEmpty()) {
            return Optional.empty();
        }
        String trimmed = raw.trim();
        for (DateTimeFormatter formatter : new DateTimeFormatter[]{ISO, CZECH_SPACED, CZECH_DOTTED}) {
            try {
                return Optional.of(LocalDate.parse(trimmed, formatter));
            } catch (DateTimeParseException ignored) {
                // try the next format
            }
        }
        return Optional.empty();
    }

    public String maskRodneCislo(String raw) {
        if (raw == null || raw.trim().isEmpty()) {
            return null;
        }
        String digitsOnly = raw.replaceAll("[^0-9]", "");
        if (digitsOnly.length() < 4) {
            return digitsOnly;
        }
        return digitsOnly.substring(digitsOnly.length() - 4);
    }

    public boolean isValidRodneCisloFormat(String raw) {
        return raw != null && RODNE_CISLO_FORMAT.matcher(raw.trim()).matches();
    }
}
