package solutions.onz.muni.learning.domain;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@Document("run_completed_trainings")
public class RunCompletedTraining {

    @Id
    private String id;

    @Indexed
    private String runId;

    private String idZaznamu;

    @Indexed
    private String idZamestnance;

    private String zamestnanec;
    private String kodSkoleni;
    private LocalDate datumAbsolvovani;
    private LocalDate platnostDo;
    private String poskytovatel;
    private BigDecimal cenaKc;
    private String poznamka;
}
