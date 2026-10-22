package solutions.onz.platform.demon.manager.security;

import java.util.Set;
import solutions.onz.platform.demon.manager.domain.enums.Role;

public record CustomerContext(String userOid, String email, String customerId, Set<Role> roles) {
    public boolean isPlatformAdmin() { return roles.contains(Role.PLATFORM_ADMIN); }
}
