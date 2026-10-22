package solutions.onz.muni.learning.api.dto;

import org.junit.jupiter.api.Test;
import solutions.onz.muni.learning.domain.RunEmployee;
import solutions.onz.muni.learning.domain.RunTimeslot;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

class RunDetailDtoTest {

    @Test
    void employeeSummaryFromCopiesAllDisplayFields() {
        RunEmployee employee = new RunEmployee();
        employee.setIdZamestnance("E0001");
        employee.setJmeno("Tereza");
        employee.setPrijmeni("Urbanová");
        employee.setUtvar("Studijní oddělení");
        employee.setPozice("Vedoucí");
        employee.setStav("aktivní");

        EmployeeSummary summary = EmployeeSummary.from(employee);

        assertThat(summary.idZamestnance()).isEqualTo("E0001");
        assertThat(summary.jmeno()).isEqualTo("Tereza");
        assertThat(summary.prijmeni()).isEqualTo("Urbanová");
        assertThat(summary.utvar()).isEqualTo("Studijní oddělení");
        assertThat(summary.pozice()).isEqualTo("Vedoucí");
        assertThat(summary.stav()).isEqualTo("aktivní");
    }

    @Test
    void timeslotSummaryFromCopiesAllDisplayFields() {
        RunTimeslot timeslot = new RunTimeslot();
        timeslot.setIdTerminu("T001");
        timeslot.setKodSkoleni("BOZP-Z");
        timeslot.setDatum(LocalDate.of(2026, 11, 1));
        timeslot.setMisto("Aula A");
        timeslot.setKapacita(25);
        timeslot.setObsazeno(22);
        timeslot.setCenaNaOsobu(new BigDecimal("450"));
        timeslot.setStav("plánováno");

        TimeslotSummary summary = TimeslotSummary.from(timeslot);

        assertThat(summary.idTerminu()).isEqualTo("T001");
        assertThat(summary.kodSkoleni()).isEqualTo("BOZP-Z");
        assertThat(summary.datum()).isEqualTo(LocalDate.of(2026, 11, 1));
        assertThat(summary.misto()).isEqualTo("Aula A");
        assertThat(summary.kapacita()).isEqualTo(25);
        assertThat(summary.obsazeno()).isEqualTo(22);
        assertThat(summary.stav()).isEqualTo("plánováno");
        assertThat(summary.costPerPerson()).isEqualTo(new BigDecimal("450"));
    }
}
