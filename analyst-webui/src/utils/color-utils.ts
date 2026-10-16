import { AccentColor } from '../context/ThemeContext';

export const getHueFromAccentColor = (accentColor: AccentColor): number => {
    const hueMap: Record<AccentColor, number> = {
        'gray': 168,
        'gold': 45,
        'bronze': 30,
        'brown': 30,
        'yellow': 60,
        'amber': 45,
        'orange': 30,
        'tomato': 10,
        'red': 0,
        'ruby': 350,
        'crimson': 340,
        'pink': 325,
        'plum': 300,
        'purple': 280,
        'violet': 270,
        'iris': 260,
        'indigo': 240,
        'blue': 220,
        'cyan': 190,
        'teal': 170,
        'jade': 150,
        'green': 130,
        'grass': 110,
        'lime': 90,
        'mint': 160,
        'sky': 200,
    };

    return hueMap[accentColor] ?? 350;
};


