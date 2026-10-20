package solutions.onz.muni.learning.domain;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@Document("run_employees")
public class RunEmployee {

    @Id
    private String id;

    @Indexed
    private String runId;

    @Indexed
    private String idZamestnance;

    private String jmeno;
    private String prijmeni;
    private String email;
    private String utvar;
    private String pozice;
    private String vedouciEmail;
    private LocalDate datumNastupu;
    private LocalDate datumUkonceni;
    private String stav;
    private String rodneCisloMasked;
    private String poznamka;
}
