package solutions.onz.platform.demon.manager.api;

import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import solutions.onz.platform.demon.manager.api.dto.MenuNodeDto;
import solutions.onz.platform.demon.manager.security.CurrentUser;
import solutions.onz.platform.demon.manager.security.CustomerContext;
import solutions.onz.platform.demon.manager.service.MenuService;

@RestController
@RequestMapping("/api/v1/iwt")
public class MenuController {

    private final MenuService menuService;

    public MenuController(MenuService menuService) {
        this.menuService = menuService;
    }

    @GetMapping("/menu")
    @PreAuthorize("hasAnyRole('CUSTOMER_ADMIN','CUSTOMER_MEMBER')")
    public List<MenuNodeDto> menu(@CurrentUser CustomerContext ctx) {
        return menuService.menuFor(ctx);
    }
}
