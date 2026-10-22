package solutions.onz.muni.learning.service;

import org.springframework.stereotype.Component;
import solutions.onz.muni.learning.api.dto.MenuNodeDto;
import solutions.onz.muni.learning.security.CustomerContext;


import java.util.List;

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
                        new MenuNodeDto.MenuActionDto.MorphPage("dashboard")),
                new MenuNodeDto("instances", "browse my instances", "violet", null,
                        new MenuNodeDto.MenuActionDto.MorphPage("instances")),
                new MenuNodeDto("subscription", "manage my subscription", "amber", null,
                        new MenuNodeDto.MenuActionDto.MorphPage("subscription")),
                new MenuNodeDto("sign-out", "sign out", "gray", null,
                        new MenuNodeDto.MenuActionDto.Command("sign-out")));
    }
}
