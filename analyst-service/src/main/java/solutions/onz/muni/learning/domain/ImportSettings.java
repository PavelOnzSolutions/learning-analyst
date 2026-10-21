package solutions.onz.muni.learning.domain;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import solutions.onz.muni.learning.domain.enums.DelimiterSetting;
import solutions.onz.muni.learning.domain.enums.FileRole;

import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@Document("import_settings")
public class ImportSettings {

    @Id
    private String id;

    private Map<FileRole, DelimiterSetting> delimiters;
}
