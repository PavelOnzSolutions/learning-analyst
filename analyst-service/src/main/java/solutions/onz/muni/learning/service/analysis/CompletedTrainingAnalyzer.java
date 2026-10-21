package solutions.onz.muni.learning.service.analysis;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import solutions.onz.muni.learning.domain.Finding;
import solutions.onz.muni.learning.domain.enums.FindingSeverity;
import solutions.onz.muni.learning.domain.enums.FileRole;
import solutions.onz.muni.learning.domain.RunCompletedTraining;
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
public class CompletedTrainingAnalyzer {

    private final SanitizationService sanitizationService;

    public AnalysisResult<RunCompletedTraining> analyze(List<Map<String, String>> rawRows,
                                                          Set<String> validTrainingCodes,
                                                          Set<String> validEmployeeIds) {
        List<RunCompletedTraining> trainings = new ArrayList<>();
        List<Finding> findings = new ArrayList<>();
        Set<String> seenIds = new HashSet<>();

        for (int i = 0; i < rawRows.size(); i++) {
            int rowNumber = i + 1;
            Map<String, String> raw = rawRows.get(i);

            String idZaznamu = trimToNull(raw.get("id_zaznamu"));
            if (idZaznamu == null) {
                findings.add(new Finding(FindingSeverity.ERROR, FileRole.COMPLETED_TRAININGS, rowNumber,
                        "id_zaznamu", "Missing required id_zaznamu"));
                continue;
            }
            if (!seenIds.add(idZaznamu)) {
                findings.add(new Finding(FindingSeverity.WARNING, FileRole.COMPLETED_TRAININGS, rowNumber,
                        "id_zaznamu", "Duplicate id_zaznamu: " + idZaznamu + " (row dropped)"));
                continue;
            }

            RunCompletedTraining training = new RunCompletedTraining();
            training.setIdZaznamu(idZaznamu);

            String idZamestnance = trimToNull(raw.get("id_zamestnance"));
            training.setIdZamestnance(idZamestnance);
            if (idZamestnance == null) {
                findings.add(new Finding(FindingSeverity.ERROR, FileRole.COMPLETED_TRAININGS, rowNumber,
                        "id_zamestnance", "Missing required id_zamestnance"));
            } else if (!validEmployeeIds.contains(idZamestnance)) {
                findings.add(new Finding(FindingSeverity.ERROR, FileRole.COMPLETED_TRAININGS, rowNumber,
                        "id_zamestnance", "Unknown employee id: " + idZamestnance));
            }

            training.setZamestnanec(sanitizationService.sanitizeText(raw.get("zamestnanec")));

            String kodSkoleni = trimToNull(raw.get("kod_skoleni"));
            training.setKodSkoleni(kodSkoleni);
            if (kodSkoleni == null) {
                findings.add(new Finding(FindingSeverity.ERROR, FileRole.COMPLETED_TRAININGS, rowNumber,
                        "kod_skoleni", "Missing required kod_skoleni"));
            } else {
                validateTrainingCodeReference(kodSkoleni, validTrainingCodes, rowNumber, findings);
            }

            training.setDatumAbsolvovani(parseDateField(raw.get("datum_absolvovani"), rowNumber, "datum_absolvovani", findings));
            training.setPlatnostDo(parseDateField(raw.get("platnost_do"), rowNumber, "platnost_do", findings));

            training.setPoskytovatel(sanitizationService.sanitizeText(raw.get("poskytovatel")));

            Optional<BigDecimal> cena = sanitizationService.parseAmount(raw.get("cena_kc"));
            cena.ifPresent(training::setCenaKc);
            if (cena.isPresent() && cena.get().signum() < 0) {
                findings.add(new Finding(FindingSeverity.WARNING, FileRole.COMPLETED_TRAININGS, rowNumber,
                        "cena_kc", "Negative price: " + cena.get()));
            }

            training.setPoznamka(sanitizationService.sanitizeText(raw.get("poznamka")));

            trainings.add(training);
        }

        return new AnalysisResult<>(trainings, findings);
    }

    private void validateTrainingCodeReference(String kodSkoleni, Set<String> validCodes, int rowNumber, List<Finding> findings) {
        if (validCodes.contains(kodSkoleni)) {
            return;
        }
        boolean caseInsensitiveMatch = validCodes.stream().anyMatch(c -> c.equalsIgnoreCase(kodSkoleni));
        if (caseInsensitiveMatch) {
            findings.add(new Finding(FindingSeverity.WARNING, FileRole.COMPLETED_TRAININGS, rowNumber,
                    "kod_skoleni", "Training code case mismatch: " + kodSkoleni));
        } else {
            findings.add(new Finding(FindingSeverity.ERROR, FileRole.COMPLETED_TRAININGS, rowNumber,
                    "kod_skoleni", "Unknown training code: " + kodSkoleni));
        }
    }

    private LocalDate parseDateField(String raw, int rowNumber, String field, List<Finding> findings) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        Optional<LocalDate> parsed = sanitizationService.parseFlexibleDate(raw);
        if (parsed.isEmpty()) {
            findings.add(new Finding(FindingSeverity.ERROR, FileRole.COMPLETED_TRAININGS, rowNumber, field, "Invalid date: " + raw));
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
