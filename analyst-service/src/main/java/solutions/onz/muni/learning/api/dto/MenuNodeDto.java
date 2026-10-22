package solutions.onz.platform.demon.manager.api.dto;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import java.util.List;

/**
 * Wire shape of one IWT orb, returned by {@code GET /api/v1/iwt/menu}. Mirrors
 * the frontend's {@code OrbNode} minus anything that can't cross JSON — a
 * {@code command} action carries a symbolic {@code key} instead of a closure,
 * resolved client-side.
 */
public record MenuNodeDto(
        String id,
        String label,
        String color,
        List<MenuNodeDto> children,
        MenuActionDto action) {

    /**
     * {@code @JsonTypeInfo} writes a synthetic "kind" property alongside each
     * record's own fields on serialization — neither {@code MorphPage} nor
     * {@code Command} declares a "kind" component itself. The frontend's
     * {@code toAction()} (real-menu.ts) reads that "kind" field to pick the
     * right branch, so this annotation is load-bearing for the wire contract,
     * not cosmetic.
     */
    @JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "kind")
    @JsonSubTypes({
            @JsonSubTypes.Type(value = MenuActionDto.MorphPage.class, name = "morph-page"),
            @JsonSubTypes.Type(value = MenuActionDto.Command.class, name = "command"),
    })
    public sealed interface MenuActionDto {
        record MorphPage(String page) implements MenuActionDto {}
        record Command(String key) implements MenuActionDto {}
    }
}
