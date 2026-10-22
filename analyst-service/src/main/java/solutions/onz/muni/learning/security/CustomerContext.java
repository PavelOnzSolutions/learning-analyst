package solutions.onz.muni.learning.security;

import solutions.onz.muni.learning.domain.enums.Role;
import java.util.Set;

public record CustomerContext(String userOid, String email, String customerId, Set<Role> roles) {
    public boolean isPlatformAdmin() { return roles.contains(Role.ADMIN); }
}
