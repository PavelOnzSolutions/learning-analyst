package solutions.onz.muni.learning.api;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.web.server.ResponseStatusException;
import solutions.onz.muni.learning.api.dto.EmployeeHistoryResponse;
import solutions.onz.muni.learning.api.dto.EmployeeOption;
import solutions.onz.muni.learning.api.dto.InsightsOverviewResponse;
import solutions.onz.muni.learning.repository.AppUserRepository;
import solutions.onz.muni.learning.service.InsightsService;

import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class InsightsControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private InsightsService insightsService;

    @MockitoBean
    private AppUserRepository appUserRepository;

    private RequestPostProcessor asUser() {
        return jwt().jwt(b -> b.subject("u1").claim("role", "USER"))
                .authorities(new SimpleGrantedAuthority("ROLE_USER"));
    }

    @Test
    void overviewWithoutTokenIsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/v1/insights/overview")).andExpect(status().isUnauthorized());
    }

    @Test
    void overviewReturnsDataForAuthenticatedUser() throws Exception {
        when(insightsService.getOverview()).thenReturn(new InsightsOverviewResponse(List.of()));

        mockMvc.perform(get("/api/v1/insights/overview").with(asUser()))
                .andExpect(status().isOk());
    }

    @Test
    void employeesReturnsDataForAuthenticatedUser() throws Exception {
        when(insightsService.listEmployees()).thenReturn(List.of(new EmployeeOption("E1", "Tereza Urbanová")));

        mockMvc.perform(get("/api/v1/insights/employees").with(asUser()))
                .andExpect(status().isOk());
    }

    @Test
    void employeeHistoryReturns404WhenServiceThrowsNotFound() throws Exception {
        when(insightsService.getEmployeeHistory("unknown"))
                .thenThrow(new ResponseStatusException(HttpStatus.NOT_FOUND));

        mockMvc.perform(get("/api/v1/insights/employees/unknown/history").with(asUser()))
                .andExpect(status().isNotFound());
    }

    @Test
    void employeeHistoryReturnsDataForAuthenticatedUser() throws Exception {
        when(insightsService.getEmployeeHistory("E1"))
                .thenReturn(new EmployeeHistoryResponse("E1", "Tereza Urbanová", List.of()));

        mockMvc.perform(get("/api/v1/insights/employees/E1/history").with(asUser()))
                .andExpect(status().isOk());
    }
}
