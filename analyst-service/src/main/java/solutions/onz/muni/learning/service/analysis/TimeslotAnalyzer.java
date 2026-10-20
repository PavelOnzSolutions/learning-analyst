package solutions.onz.muni.learning.service.analysis;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import solutions.onz.muni.learning.domain.Finding;
import solutions.onz.muni.learning.domain.FindingSeverity;
import solutions.onz.muni.learning.domain.FileRole;
import solutions.onz.muni.learning.domain.RunTimeslot;
import solutions.onz.muni.learning.service.csv.SanitizationService;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class TimeslotAnalyzer {

    private final SanitizationService sanitizationService;

    public AnalysisResult<RunTimeslot> analyze(List<Map<String, String>> rawRows, Set<String> validTrainingCodes) {
        List<RunTimeslot> slots = new ArrayList<>();
        List<Finding> findings = new ArrayList<>();
        Set<String> seenIds = new HashSet<>();

        for (int i = 0; i < rawRows.size(); i++) {
            int rowNumber = i + 1;
            Map<String, String> raw = rawRows.get(i);

            String idTerminu = trimToNull(raw.get("id_terminu"));
            if (idTerminu == null) {
                findings.add(new Finding(FindingSeverity.ERROR, FileRole.TIMESLOTS, rowNumber,
                        "id_terminu", "Missing required id_terminu"));
                continue;
            }
            if (!seenIds.add(idTerminu)) {
                findings.add(new Finding(FindingSeverity.WARNING, FileRole.TIMESLOTS, rowNumber,
                        "id_terminu", "Duplicate id_terminu: " + idTerminu + " (row dropped)"));
                continue;
            }

            RunTimeslot slot = new RunTimeslot();
            slot.setIdTerminu(idTerminu);

            String kodSkoleni = trimToNull(raw.get("kod_skoleni"));
            slot.setKodSkoleni(kodSkoleni);
            if (kodSkoleni == null) {
                findings.add(new Finding(FindingSeverity.ERROR, FileRole.TIMESLOTS, rowNumber,
                        "kod_skoleni", "Missing required kod_skoleni"));
            } else {
                validateTrainingCodeReference(kodSkoleni, validTrainingCodes, rowNumber, findings);
            }

            String datumRaw = raw.get("datum");
            Optional<LocalDate> datum = sanitizationService.parseFlexibleDate(datumRaw);
            if (datumRaw != null && !datumRaw.isBlank() && datum.isEmpty()) {
                findings.add(new Finding(FindingSeverity.ERROR, FileRole.TIMESLOTS, rowNumber, "datum", "Invalid date: " + datumRaw));
            }
            slot.setDatum(datum.orElse(null));

            slot.setCas(sanitizationService.sanitizeText(raw.get("cas")));
            slot.setMisto(sanitizationService.sanitizeText(raw.get("misto")));

            Integer kapacita = parseInt(raw.get("kapacita"));
            Integer obsazeno = parseInt(raw.get("obsazeno"));
            slot.setKapacita(kapacita);
            slot.setObsazeno(obsazeno);

            String stav = sanitizationService.sanitizeText(raw.get("stav"));
            slot.setStav(stav);
            boolean cancelled = stav != null && stav.equalsIgnoreCase("zrušeno");

            if (kapacita != null && kapacita == 0 && !cancelled) {
                findings.add(new Finding(FindingSeverity.WARNING, FileRole.TIMESLOTS, rowNumber, "kapacita",
                        "Zero capacity on a non-cancelled slot"));
            } else if (kapacita != null && kapacita > 0 && obsazeno != null && obsazeno > kapacita) {
                findings.add(new Finding(FindingSeverity.WARNING, FileRole.TIMESLOTS, rowNumber, "obsazeno",
                        "Overbooked: obsazeno (" + obsazeno + ") exceeds kapacita (" + kapacita + ")"));
            }

            Optional<BigDecimal> cena = sanitizationService.parseAmount(raw.get("cena_na_osobu"));
            cena.ifPresent(slot::setCenaNaOsobu);
            if (cena.isPresent() && cena.get().signum() < 0) {
                findings.add(new Finding(FindingSeverity.WARNING, FileRole.TIMESLOTS, rowNumber,
                        "cena_na_osobu", "Negative price: " + cena.get()));
            }

            slots.add(slot);
        }

        return new AnalysisResult<>(slots, findings);
    }

    private void validateTrainingCodeReference(String kodSkoleni, Set<String> validCodes, int rowNumber, List<Finding> findings) {
        if (validCodes.contains(kodSkoleni)) {
            return;
        }
        boolean caseInsensitiveMatch = validCodes.stream().anyMatch(c -> c.equalsIgnoreCase(kodSkoleni));
        if (caseInsensitiveMatch) {
            findings.add(new Finding(FindingSeverity.WARNING, FileRole.TIMESLOTS, rowNumber,
                    "kod_skoleni", "Training code case mismatch: " + kodSkoleni));
        } else {
            findings.add(new Finding(FindingSeverity.ERROR, FileRole.TIMESLOTS, rowNumber,
                    "kod_skoleni", "Unknown training code: " + kodSkoleni));
        }
    }

    private Integer parseInt(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        try {
            return Integer.parseInt(raw.trim());
        } catch (NumberFormatException e) {
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
