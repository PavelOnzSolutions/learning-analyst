package solutions.onz.muni.learning.api;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import solutions.onz.muni.learning.api.dto.MenuNodeDto;
import solutions.onz.muni.learning.security.CurrentUser;
import solutions.onz.muni.learning.security.CustomerContext;
import solutions.onz.muni.learning.service.MenuService;


import java.util.List;

@RestController
@RequestMapping("/api/v1/iwt")
@RequiredArgsConstructor
@Tag(name = "IWT UI Data", description = "IWT UI structural data")
public class MenuController {

    private final MenuService menuService;

    @Operation(summary = "Get menu structure", description = "Returns a complete menu layout and command mappings")
    @ApiResponse(responseCode = "200", description = "Menu returned")
    @GetMapping("/menu")
    @PreAuthorize("hasAnyRole('ADMIN')")
    public List<MenuNodeDto> menu(@CurrentUser CustomerContext ctx) {
        return menuService.menuFor(ctx);
    }
}
