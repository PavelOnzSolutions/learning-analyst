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
@Document("run_timeslots")
public class RunTimeslot {

    @Id
    private String id;

    @Indexed
    private String runId;

    private String idTerminu;
    private String kodSkoleni;
    private LocalDate datum;
    private String cas;
    private String misto;
    private Integer kapacita;
    private Integer obsazeno;
    private BigDecimal cenaNaOsobu;
    private String stav;
}
