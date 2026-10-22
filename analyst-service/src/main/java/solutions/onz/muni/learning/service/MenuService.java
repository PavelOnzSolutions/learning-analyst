package solutions.onz.platform.demon.manager.service;

import java.util.List;
import org.springframework.stereotype.Component;
import solutions.onz.platform.demon.manager.api.dto.MenuNodeDto;
import solutions.onz.platform.demon.manager.api.dto.MenuNodeDto.MenuActionDto.Command;
import solutions.onz.platform.demon.manager.api.dto.MenuNodeDto.MenuActionDto.MorphPage;
import solutions.onz.platform.demon.manager.security.CustomerContext;

/**
 * Builds the IWT orb tree for {@code GET /api/v1/iwt/menu}. The spine tree is
 * the same four orbs for every customer role today — the per-node structure
 * is in place so a future role-specific branch (e.g. an admin-only orb for
 * {@code CUSTOMER_ADMIN}) is a small addition here, not a reshape.
 */
@Component
public class MenuService {

    public List<MenuNodeDto> menuFor(CustomerContext ctx) {
        return List.of(
                new MenuNodeDto("dashboard", "see my dashboard", "teal", null,
                        new MorphPage("dashboard")),
                new MenuNodeDto("instances", "browse my instances", "violet", null,
                        new MorphPage("instances")),
                new MenuNodeDto("subscription", "manage my subscription", "amber", null,
                        new MorphPage("subscription")),
                new MenuNodeDto("sign-out", "sign out", "gray", null,
                        new Command("sign-out")));
    }
}
