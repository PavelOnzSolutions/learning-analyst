package solutions.onz.muni.learning.domain;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Getter
@Setter
@NoArgsConstructor
@Document("run_training_catalog")
public class RunTrainingCatalogEntry {

    @Id
    private String id;

    @Indexed
    private String runId;

    private String kod;
    private String nazev;
    private Integer platnostMesicu;
    private String povinnePro;
    private String poznamka;
}
