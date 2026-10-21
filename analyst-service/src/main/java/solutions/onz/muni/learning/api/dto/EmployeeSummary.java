package solutions.onz.muni.learning.api.dto;

import solutions.onz.muni.learning.domain.RunEmployee;

public record EmployeeSummary(String idZamestnance, String jmeno, String prijmeni, String utvar, String pozice, String stav) {
    public static EmployeeSummary from(RunEmployee employee) {
        return new EmployeeSummary(employee.getIdZamestnance(), employee.getJmeno(), employee.getPrijmeni(),
                employee.getUtvar(), employee.getPozice(), employee.getStav());
    }
}
