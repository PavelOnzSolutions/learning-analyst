package solutions.onz.muni.learning.api.dto;

import solutions.onz.muni.learning.domain.RunTimeslot;

import java.time.LocalDate;

public record TimeslotSummary(String idTerminu, String kodSkoleni, LocalDate datum, String misto,
                               Integer kapacita, Integer obsazeno, String stav) {
    public static TimeslotSummary from(RunTimeslot timeslot) {
        return new TimeslotSummary(timeslot.getIdTerminu(), timeslot.getKodSkoleni(), timeslot.getDatum(),
                timeslot.getMisto(), timeslot.getKapacita(), timeslot.getObsazeno(), timeslot.getStav());
    }
}
