package solutions.onz.muni.learning.domain;

import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

class RunDomainTest {

    @Test
    void runEmployeeGettersAndSettersRoundTrip() {
        RunEmployee employee = new RunEmployee();
        employee.setId("e1");
        employee.setRunId("r1");
        employee.setIdZamestnance("E0001");
        employee.setJmeno("Tereza");
        employee.setPrijmeni("Urbanová");
        employee.setEmail("tereza.urbanova@vzorova.example");
        employee.setUtvar("Studijní oddělení");
        employee.setPozice("Vedoucí");
        employee.setVedouciEmail("jitka.simkova@vzorova.example");
        employee.setDatumNastupu(LocalDate.of(2008, 2, 23));
        employee.setDatumUkonceni(null);
        employee.setStav("aktivní");
        employee.setRodneCisloMasked("0359");
        employee.setPoznamka(null);

        assertThat(employee.getId()).isEqualTo("e1");
        assertThat(employee.getRunId()).isEqualTo("r1");
        assertThat(employee.getIdZamestnance()).isEqualTo("E0001");
        assertThat(employee.getDatumNastupu()).isEqualTo(LocalDate.of(2008, 2, 23));
        assertThat(employee.getRodneCisloMasked()).isEqualTo("0359");
    }

    @Test
    void runTrainingCatalogEntryGettersAndSettersRoundTrip() {
        RunTrainingCatalogEntry entry = new RunTrainingCatalogEntry();
        entry.setId("c1");
        entry.setRunId("r1");
        entry.setKod("BOZP-Z");
        entry.setNazev("BOZP – základní školení");
        entry.setPlatnostMesicu(24);
        entry.setPovinnePro("VSICHNI");
        entry.setPoznamka(null);

        assertThat(entry.getKod()).isEqualTo("BOZP-Z");
        assertThat(entry.getPlatnostMesicu()).isEqualTo(24);
        assertThat(entry.getPovinnePro()).isEqualTo("VSICHNI");
    }

    @Test
    void runTimeslotGettersAndSettersRoundTrip() {
        RunTimeslot slot = new RunTimeslot();
        slot.setId("t1");
        slot.setRunId("r1");
        slot.setIdTerminu("T001");
        slot.setKodSkoleni("KYBER");
        slot.setDatum(LocalDate.of(2026, 10, 14));
        slot.setCas("09:00-12:00");
        slot.setMisto("Aula A");
        slot.setKapacita(25);
        slot.setObsazeno(22);
        slot.setCenaNaOsobu(new BigDecimal("800"));
        slot.setStav("plánováno");

        assertThat(slot.getKapacita()).isEqualTo(25);
        assertThat(slot.getObsazeno()).isEqualTo(22);
        assertThat(slot.getCenaNaOsobu()).isEqualTo(new BigDecimal("800"));
    }

    @Test
    void runCompletedTrainingGettersAndSettersRoundTrip() {
        RunCompletedTraining training = new RunCompletedTraining();
        training.setId("ct1");
        training.setRunId("r1");
        training.setIdZaznamu("Z000001");
        training.setIdZamestnance("E0131");
        training.setZamestnanec("Vacková Hana");
        training.setKodSkoleni("BOZP-Z");
        training.setDatumAbsolvovani(LocalDate.of(2019, 1, 6));
        training.setPlatnostDo(LocalDate.of(2021, 1, 6));
        training.setPoskytovatel("Interní školitel");
        training.setCenaKc(new BigDecimal("450"));
        training.setPoznamka(null);

        assertThat(training.getIdZamestnance()).isEqualTo("E0131");
        assertThat(training.getPlatnostDo()).isEqualTo(LocalDate.of(2021, 1, 6));
        assertThat(training.getCenaKc()).isEqualTo(new BigDecimal("450"));
    }
}
