package solutions.onz.muni.learning.domain.enums;

public enum DelimiterSetting {
    AUTO,
    COMMA,
    SEMICOLON,
    TAB,
    PIPE;

    public char toChar() {
        return switch (this) {
            case COMMA -> ',';
            case SEMICOLON -> ';';
            case TAB -> '\t';
            case PIPE -> '|';
            case AUTO -> throw new IllegalStateException("AUTO has no fixed delimiter character — resolve via sniffing first");
        };
    }
}
