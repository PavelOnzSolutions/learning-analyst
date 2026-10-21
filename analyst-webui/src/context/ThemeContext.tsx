import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type AccentColor = 'gray' | 'gold' | 'bronze' | 'brown' | 'yellow' | 'amber' | 'orange' | 'tomato' | 'red' | 'ruby' | 'crimson' | 'pink' | 'plum' | 'purple' | 'violet' | 'iris' | 'indigo' | 'blue' | 'cyan' | 'teal' | 'jade' | 'green' | 'grass' | 'lime' | 'mint' | 'sky';
export type BackgroundType = 'orbs' | 'starfield' | 'particles' | 'glyphs';
export type DefaultFont = 'Macondo' | 'Poppins' | 'Sansation' | 'Space Grotesk' | 'Titillium Web' | 'VT323';
export type CodeFont = 'Fira Code' | 'Syne Mono' | 'Space Mono';
export type ElementEdgeRadius = 'none' | 'small' | 'medium' | 'large' | 'full';

export const accentColors = [
    'gray',
    'gold',
    'bronze',
    'brown',
    'yellow',
    'amber',
    'orange',
    'tomato',
    'red',
    'ruby',
    'crimson',
    'pink',
    'plum',
    'purple',
    'violet',
    'iris',
    'indigo',
    'blue',
    'cyan',
    'teal',
    'jade',
    'green',
    'grass',
    'lime',
    'mint',
    'sky'
];

interface ThemeContextType {
    appearance: 'light' | 'dark' | 'auto';
    toggleTheme: () => void;
    setAppearance: (appearance: 'light' | 'dark' | 'auto') => void;
    accentColor: AccentColor;
    setAccentColor: (color: AccentColor) => void;
    backgroundType: BackgroundType;
    setBackgroundType: (type: BackgroundType) => void;
    radiusType: ElementEdgeRadius;
    setRadiusType: (type: ElementEdgeRadius) => void;
    useAccentColorForBackground: boolean;
    setUseAccentColorForBackground: (value: boolean) => void;
    defaultFont: DefaultFont;
    setDefaultFont: (font: DefaultFont) => void;
    codeFont: CodeFont;
    setCodeFont: (font: CodeFont) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

interface ThemeProviderProps {
    children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
    const [appearance, setAppearance] = useState<'light' | 'dark' | 'auto'>(() => {
        const saved = localStorage.getItem('theme');
        if (saved === 'light' || saved === 'dark' || saved === 'auto') return saved;
        return 'auto';
    });

    const [resolvedAppearance, setResolvedAppearance] = useState<'light' | 'dark'>(() => {
        if (appearance === 'auto') {
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        return appearance === 'dark' ? 'dark' : 'light';
    });

    const [accentColor, setAccentColor] = useState<AccentColor>(() => {
        return (localStorage.getItem('accentColor') as AccentColor) || 'grass';
    });

    const [backgroundType, setBackgroundType] = useState<BackgroundType>(() => {
        return (localStorage.getItem('backgroundType') as BackgroundType) || 'glyphs';
    });

    const [radiusType, setRadiusType] = useState<ElementEdgeRadius>(() => {
        return (localStorage.getItem('radiusType') as ElementEdgeRadius) || 'large';
    });

    const [useAccentColorForBackground, setUseAccentColorForBackground] = useState<boolean>(() => {
        const saved = localStorage.getItem('useAccentColorForBackground');
        return saved === null ? false : saved === 'true';
    });

    const [defaultFont, setDefaultFont] = useState<DefaultFont>(() => {
        return (localStorage.getItem('defaultFont') as DefaultFont) || 'Sansation';
    });

    const [codeFont, setCodeFont] = useState<CodeFont>(() => {
        return (localStorage.getItem('codeFont') as CodeFont) || 'Fira Code';
    });

    useEffect(() => {
        if (appearance === 'auto') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handleChange = () => {
                setResolvedAppearance(mediaQuery.matches ? 'dark' : 'light');
            };
            mediaQuery.addEventListener('change', handleChange);
            setResolvedAppearance(mediaQuery.matches ? 'dark' : 'light');
            return () => mediaQuery.removeEventListener('change', handleChange);
        } else {
            setResolvedAppearance(appearance === 'dark' ? 'dark' : 'light');
        }
    }, [appearance]);

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(resolvedAppearance);
        localStorage.setItem('theme', appearance);
    }, [resolvedAppearance, appearance]);

    useEffect(() => {
        localStorage.setItem('accentColor', accentColor);
    }, [accentColor]);

    useEffect(() => {
        localStorage.setItem('backgroundType', backgroundType);
    }, [backgroundType]);

    useEffect(() => {
        const root = window.document.querySelector('.radix-themes');
        if (root) {
            root.setAttribute('data-radius', radiusType);
        }
        localStorage.setItem('radiusType', radiusType);
    }, [radiusType]);

    useEffect(() => {
        localStorage.setItem('useAccentColorForBackground', String(useAccentColorForBackground));
    }, [useAccentColorForBackground]);

    useEffect(() => {
        localStorage.setItem('defaultFont', defaultFont);
        document.documentElement.style.setProperty('--default-font', defaultFont);
    }, [defaultFont]);

    useEffect(() => {
        localStorage.setItem('codeFont', codeFont);
        document.documentElement.style.setProperty('--code-font', codeFont);
    }, [codeFont]);

    const toggleTheme = () => {
        setAppearance((prev) => (prev === 'light' ? 'dark' : 'light'));
    };

    const setAccentColorWithTransition = (color: AccentColor) => {
        const root = window.document.querySelector('.radix-themes');
        if (root) {
            root.classList.add('accent-transitioning');
            setAccentColor(color);
            setTimeout(() => {
                root.classList.remove('accent-transitioning');
            }, 1100); // Slightly more than transition duration
        } else {
            setAccentColor(color);
        }
    };

    // @ts-ignore
    return (
        <ThemeContext.Provider value={{
            appearance,
            toggleTheme,
            setAppearance,
            accentColor,
            setAccentColor: setAccentColorWithTransition,
            backgroundType,
            setBackgroundType,
            radiusType,
            setRadiusType,
            useAccentColorForBackground,
            setUseAccentColorForBackground,
            defaultFont,
            setDefaultFont,
            codeFont,
            setCodeFont,
        }}>
            {children}
        </ThemeContext.Provider>
    );
};
